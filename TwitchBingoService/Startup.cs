using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Services;

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

            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "TwitchBingoService", Version = "v1" });
            });

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

                            var claims = new Claim[]
                            {
                                new Claim(ClaimTypes.Role, token.Payload["role"].ToString())
                            };
                            var identity = new ClaimsIdentity(claims);
                            validationContext.Principal.AddIdentity(identity);

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

            app.UseHttpsRedirection();

            app.UseCors(config =>
            {
                if (env.IsDevelopment())
                {
                    config.AllowAnyOrigin();
                }
                else
                {
                    config.WithOrigins("https://*.ext-twitch.tv")
                        .SetIsOriginAllowedToAllowWildcardSubdomains();
                }
                config.WithHeaders("Authorization", "X-Config-Token", "X-Config-Version", "Content-Type");
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
