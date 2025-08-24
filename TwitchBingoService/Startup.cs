using Azure.Core;
using Conceptoire.Twitch;
using Conceptoire.Twitch.API;
using Conceptoire.Twitch.IRC;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Services;
using TwitchBingoService.Storage;
using static Microsoft.ApplicationInsights.MetricDimensionNames.TelemetryContext;

namespace TwitchBingoService
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddHttpClient();
            services.AddSingleton<TwitchEBSService>();
            services.AddSingleton<BingoService>();
            services.Configure<BingoServiceOptions>(Configuration.GetSection("bingo"));
            services.Configure<TwitchOptions>(Configuration.GetSection("twitch"));
            services.Configure<AzureStorageOptions>(Configuration.GetSection("azure"));

            services.AddSingleton<IOptionsSnapshot<OpenApiOptions>>(sp =>
            {
                OpenApiOptions options = new();
                return new StaticOptions<OpenApiOptions>(options);
            });
            services.AddOpenApi("v1");

            services.AddApplicationInsightsTelemetry();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    TwitchOptions twitchOptions = new TwitchOptions();
                    Configuration.GetSection("twitch").Bind(twitchOptions);
                    var signingKey = new SymmetricSecurityKey(Convert.FromBase64String(twitchOptions.ExtensionSecret!));
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        IssuerSigningKey = signingKey,
                        ValidateAudience = false, // No audience on extension tokens
                        ValidateIssuer = false, // No issuer either
                    };
                    options.Audience = null;

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = (validationContext) =>
                        {
                            var token = validationContext.SecurityToken as JsonWebToken;

                            if (token == null)
                            {
                                validationContext.Fail("Could not process token");
                                return Task.CompletedTask;
                            }

                            var claims = new List<Claim>
                            {
                                new Claim(ClaimTypes.Role, token.GetPayloadValue<string>("role"))
                            };
                            if (token.TryGetPayloadValue("user_id", out string userId))
                            {
                                claims.Add(new Claim(ClaimTypes.Role, "viewer"));
                            }

                            validationContext.Request.HttpContext.Items.Add("jwtPayload", System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(token.EncodedPayload)));

                            var identity = new ClaimsIdentity(claims);
                            validationContext.Principal!.AddIdentity(identity);

                            return Task.CompletedTask;
                        },
                        OnAuthenticationFailed = (context) =>
                        {
                            var logger = context.HttpContext.RequestServices.GetService<ILogger<Startup>>();
                            logger?.LogWarning("Rejected request");
                            return Task.CompletedTask;
                        }
                    };

                    options.TokenValidationParameters.NameClaimTypeRetriever = (token, _) =>
                    {
                        var jwtToken = token as JsonWebToken;
                        if (jwtToken is not null && jwtToken.TryGetPayloadValue("user_id", out string userId))
                        {
                            return "user_id";
                        }
                        else
                        {
                            return "opaque_user_id";
                        }
                    };
                });

            services.AddAuthorizationBuilder()
              .AddPolicy("gamemaster", policy =>
                policy
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                .RequireRole("broadcaster", "moderator"))
              .AddPolicy("player", policy =>
                policy
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                .RequireRole("viewer", "broadcaster", "moderator"));

            var azureConnectionString = Configuration.GetValue<string>("azure:ConnectionString");
            if (string.IsNullOrEmpty(azureConnectionString))
            {
                var redisUrl = Configuration.GetValue<string>("REDIS_URL");
                if (string.IsNullOrEmpty(redisUrl))
                {
                    services.AddSingleton<IGameStorage, InMemoryGameStore>();
                }
                else
                {
                    services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(services => StackExchange.Redis.ConnectionMultiplexer.Connect(redisUrl));
                    services.AddSingleton<IGameStorage, RedisGameStore>();
                }
            }
            else
            {
                services.AddSingleton<IGameStorage, AzureGameStore>();
            }
            services.AddSingleton(s =>
                Twitch.Authenticate()
                    .FromAppCredentials(
                        s.GetService<IOptions<TwitchOptions>>()!.Value.ClientId,
                        s.GetService<IOptions<TwitchOptions>>()!.Value.ClientSecret)
                    .Build()
            );
            services.AddTransient<ITwitchAPIClient, TwitchAPIClient>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IHostApplicationLifetime hostLifetime)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            var basePath = Configuration.GetValue<string>("HostBasePath");

            if (!string.IsNullOrEmpty(basePath))
            {
                app.UsePathBase(basePath);
            }

            // Note: I am deploying this behind an HTTPS reverse proxy, so the HTTPs redirection is handled there.
            //app.UseHttpsRedirection();

            app.UseCors(config =>
            {
                if (env.IsDevelopment())
                {
                    config.AllowAnyOrigin().AllowAnyMethod();
                }
                else
                {
                    config
                        .WithOrigins("https://localhost:8180")
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyMethod();
                    config
                        .WithOrigins("https://*.ext-twitch.tv")
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyMethod();
                }
                config.WithHeaders("Authorization", "Content-Type");
            });

            app.UseRouting();

            app.UseAuthorization();
            app.UseWebSockets();

            app.UseEndpoints(endpoints =>
            {
                // Post Game
                endpoints.MapPost("/game", (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    [FromBody] BingoGameCreationParams gameParams) =>
                    {
                    var channelClaim = request.HttpContext.User.Claims.First(c => c.Type == "channel_id");
                    return gameService.CreateGame(channelClaim.Value, gameParams);
                }).RequireAuthorization("gamemaster");

                // Delete Game
                endpoints.MapDelete("/game/{gameId}", (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    Guid gameId
                    ) =>
                {
                    return gameService.DeleteGame(gameId);
                }).RequireAuthorization("gamemaster");

                // Get Game
                endpoints.MapGet("/game/{gameId}", (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    Guid gameId) =>
                {
                    Claim channelClaim = request.HttpContext.User.Claims.First(c => c.Type == "channel_id");
                    return gameService.GetGame(gameId, channelClaim.Value);
                }).RequireAuthorization("player");

                // Get Grid
                endpoints.MapGet("/game/{gameId}/grid", async(
                    HttpRequest request,
                    ILogger < Startup > logger,
                    [FromServices] BingoService gameService,
                    Guid gameId) =>
                {
                    var user = request.HttpContext.User;
                    var userId = user.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                    if (userId == null)
                    {
                        logger.LogError("Missing user id, token payload: {tokenPayload}", request.HttpContext.Items.TryGetValue("jwtPayload", out object? payload) ? payload : "empty");
                        throw new ArgumentOutOfRangeException("Missing user id");
                    }
                    var opaqueId = user.Claims.First(c => c.Type == "opaque_user_id").Value;
                    if (user.IsInRole("moderator") || user.IsInRole("broadcaster"))
                    {
                        await gameService.RegisterModerator(gameId, opaqueId);
                    }
                    var userTask = gameService.RegisterPlayer(userId);
                    return await gameService.GetGrid(gameId, userId);
                }).RequireAuthorization("player");

                // Post Tentative
                endpoints.MapPost("/game/{gameId}/{key}/tentative", async (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    Guid gameId,
                    ushort key) =>
                {
                    var user = request.HttpContext.User;
                    var userId = user.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                    if (userId == null)
                    {
                        throw new ArgumentOutOfRangeException("Missing user id");
                    }
                    return Results.Json(await gameService.AddTentative(gameId, key, userId), JsonContext.Default.BingoTentative);
                }).RequireAuthorization("player");

                // Post Confirmation
                endpoints.MapPost("/game/{gameId}/{key}/confirm", async (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    [FromServices] ILogger<Startup> logger,
                    Guid gameId,
                    ushort key) =>
                {
                    var user = request.HttpContext.User;
                    try
                    {
                        return Results.Json(await gameService.Confirm(gameId, key, user.Identity!.Name ?? "Anonymous"), JsonContext.Default.BingoEntry);
                    }
                    catch (InvalidOperationException ex)
                    {
                        logger.LogError(ex, "Error in confirmation of game {gameId} for key {key} by player {playerName}", gameId, key, user.Identity!.Name);

                        return Results.Conflict(new APIError
                        {
                            Error = ex.Message
                        });
                    }
                }).RequireAuthorization("player");

                // Notify
                endpoints.MapPost("/game/{gameId}/{key}/notify", async (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    [FromServices] ILogger<Startup> logger,
                    Guid gameId,
                    ushort key
                    ) =>
                {
                    var user = request.HttpContext.User;
                    try
                    {
                        await gameService.HandleNotifications(gameId, key);
                        return Results.Empty;
                    }
                    catch (InvalidOperationException ex)
                    {
                        logger.LogError(ex, "Error triggering notifications for game {gameId} for key {key} by moderator {playerName}", gameId, key, user?.Identity?.Name);
                        return Results.Conflict(new APIError
                        {
                            Error = ex.Message
                        });
                    }
                }).RequireAuthorization("gamemaster");

                // Get Logs
                endpoints.MapGet("/game/{gameId}/log", async (
                    HttpRequest request,
                    [FromServices] BingoService gameService,
                    [FromServices] ILogger<Startup> logger,
                    Guid gameId
                    ) =>
                {
                    return Results.Json(await gameService.GetGameLog(gameId), JsonContext.Default.BingoEntryArray);
                }).RequireAuthorization("gamemasters");

                if (env.IsDevelopment())
                {
                    endpoints.MapOpenApi();
                }
            });

            // Explicitely flush Telemetry channel on shutdown, else when running on Lambda we will lose exceptions & more
            hostLifetime.ApplicationStopping.Register(() =>
            {
                var channel = app.ApplicationServices.GetRequiredService<ITelemetryChannel>();
                channel.Flush();
            });
        }
    }
}
