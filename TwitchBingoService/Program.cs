using Amazon.Lambda.Serialization.SystemTextJson;
using Azure.Monitor.OpenTelemetry.AspNetCore;
using Conceptoire.Twitch;
using Conceptoire.Twitch.API;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
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
using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Services;
using TwitchBingoService.Storage;


var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;

services.AddAWSLambdaHosting(LambdaEventSource.RestApi, new SourceGeneratorLambdaJsonSerializer<JsonContext>());

services.AddHttpClient();
services.AddSingleton<TwitchEBSService>();
services.AddSingleton<BingoService>();
services.Configure<BingoServiceOptions>(builder.Configuration.GetSection("bingo"));
services.Configure<TwitchOptions>(builder.Configuration.GetSection("twitch"));
services.Configure<AzureStorageOptions>(builder.Configuration.GetSection("azure"));
services.ConfigureHttpJsonOptions(configure =>
{
    configure.SerializerOptions.TypeInfoResolverChain.Add(JsonContext.Default);
});
services.AddCors();

services.AddSingleton<IOptionsSnapshot<OpenApiOptions>>(sp =>
{
    OpenApiOptions options = new();
    return new StaticOptions<OpenApiOptions>(options);
});
services.AddOpenApi("v1");

services.AddOpenTelemetry().UseAzureMonitor();

services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        TwitchOptions twitchOptions = new TwitchOptions();
        builder.Configuration.GetSection("twitch").Bind(twitchOptions);
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

                validationContext.Request.HttpContext.Items.Add("jwtPayload", Encoding.UTF8.GetString(Base64UrlTextEncoder.Decode(token.EncodedPayload)));

                var identity = new ClaimsIdentity(claims);
                validationContext.Principal!.AddIdentity(identity);

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = (context) =>
            {
                var logger = context.HttpContext.RequestServices.GetService<ILogger<Program>>();
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

var azureConnectionString = builder.Configuration.GetValue<string>("azure:ConnectionString");
if (string.IsNullOrEmpty(azureConnectionString))
{
    var redisUrl = builder.Configuration.GetValue<string>("REDIS_URL");
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

using WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

var basePath = builder.Configuration.GetValue<string>("HostBasePath");

if (!string.IsNullOrEmpty(basePath))
{
    app.UsePathBase(basePath);
}

// Note: I am deploying this behind an HTTPS reverse proxy, so the HTTPs redirection is handled there.
//app.UseHttpsRedirection();

app.UseCors(config =>
{
    if (app.Environment.IsDevelopment())
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

// Post Game
app.MapPost("/game", (
    HttpRequest request,
    [FromServices] BingoService gameService,
    [FromBody] BingoGameCreationParams gameParams) =>
{
    var channelClaim = request.HttpContext.User.Claims.First(c => c.Type == "channel_id");
    return gameService.CreateGame(channelClaim.Value, gameParams);
}).RequireAuthorization("gamemaster");

// Delete Game
app.MapDelete("/game/{gameId}", (
    HttpRequest request,
    [FromServices] BingoService gameService,
    Guid gameId
    ) =>
{
    return gameService.DeleteGame(gameId);
}).RequireAuthorization("gamemaster");

// Get Game
app.MapGet("/game/{gameId}", async (
    HttpRequest request,
    [FromServices] BingoService gameService,
    Guid gameId) =>
{
    Claim channelClaim = request.HttpContext.User.Claims.First(c => c.Type == "channel_id");
    return Results.Json(await gameService.GetGame(gameId, channelClaim.Value), JsonContext.Default.BingoGame);
}).RequireAuthorization("player");

// Get Grid
app.MapGet("/game/{gameId}/grid", async (
    HttpRequest request,
    ILogger<Program> logger,
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
app.MapPost("/game/{gameId}/{key}/tentative", (
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
    return gameService.AddTentative(gameId, key, userId);
}).RequireAuthorization("player");

// Post Confirmation
app.MapPost("/game/{gameId}/{key}/confirm", async (
    HttpRequest request,
    [FromServices] BingoService gameService,
    [FromServices] ILogger<Program> logger,
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
app.MapPost("/game/{gameId}/{key}/notify", async (
    HttpRequest request,
    [FromServices] BingoService gameService,
    [FromServices] ILogger<Program> logger,
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
app.MapGet("/game/{gameId}/log", async (
    HttpRequest request,
    [FromServices] BingoService gameService,
    [FromServices] ILogger<Program> logger,
    Guid gameId
    ) =>
{
    return Results.Json(await gameService.GetGameLog(gameId), JsonContext.Default.BingoLogEntryArray);
}).RequireAuthorization("gamemaster");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
