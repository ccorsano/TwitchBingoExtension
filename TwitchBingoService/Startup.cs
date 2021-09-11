using Conceptoire.Twitch;
using Conceptoire.Twitch.API;
using Conceptoire.Twitch.IRC;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Configuration;
using TwitchBingoService.Services;
using TwitchBingoService.Storage;

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

            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "TwitchBingoService", Version = "v1" });
            });
            services.AddApplicationInsightsTelemetry();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    TwitchOptions twitchOptions = new TwitchOptions();
                    Configuration.GetSection("twitch").Bind(twitchOptions);
                    var signingKey = new SymmetricSecurityKey(Convert.FromBase64String(twitchOptions.ExtensionSecret));
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        IssuerSigningKey = signingKey,
                        ValidateAudience = false, // No audience on extension tokens
                        ValidateIssuer = false, // No issuer either
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = (validationContext) =>
                        {
                            var token = validationContext.SecurityToken as JwtSecurityToken;

                            var claims = new List<Claim>
                            {
                                new Claim(ClaimTypes.Role, token.Payload["role"].ToString())
                            };
                            if (token.Payload.ContainsKey("user_id"))
                            {
                                claims.Add(new Claim(ClaimTypes.Role, "viewer"));
                            }

                            var identity = new ClaimsIdentity(claims);
                            validationContext.Principal.AddIdentity(identity);

                            return Task.CompletedTask;
                        },
                        OnAuthenticationFailed = (context) =>
                        {
                            var logger = context.HttpContext.RequestServices.GetService<ILogger>();
                            logger.LogWarning("Rejected request");
                            return Task.CompletedTask;
                        }
                    };

                    options.TokenValidationParameters.NameClaimTypeRetriever = (token, _) =>
                    {
                        var jwtToken = token as JwtSecurityToken;
                        if (jwtToken.Payload.ContainsKey("user_id"))
                        {
                            return "user_id";
                        }
                        else
                        {
                            return "opaque_user_id";
                        }
                    };
                });

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
                        s.GetService<IOptions<TwitchOptions>>().Value.ClientId,
                        s.GetService<IOptions<TwitchOptions>>().Value.ClientSecret)
                    .Build()
            );
            services.Configure<TwitchChatClientOptions>(Configuration.GetSection("twitch").GetSection("IrcOptions"));
            services.AddTransient(s => TwitchChatClientBuilder.Create()
                .WithOAuthToken(s.GetService<IOptions<TwitchChatClientOptions>>().Value.OAuthToken)
                .WithLoggerFactory(s.GetRequiredService<ILoggerFactory>()));
            services.AddTransient<TwitchAPIClient>();
            services.AddMemoryCache();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TwitchBingoService v1"));
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
                endpoints.MapControllers();
            });
        }
    }
}
