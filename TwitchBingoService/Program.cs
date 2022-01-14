using BingoServices.Configuration;
using BingoServices.Services;
using BingoWorker;
using Conceptoire.Twitch;
using Conceptoire.Twitch.API;
using Conceptoire.Twitch.IRC;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TwitchBingoService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureServices((ctx,sp) =>
                {
                    sp.AddHttpClient();
                    sp.AddSingleton<TwitchEBSService>();
                    sp.Configure<BingoServiceOptions>(ctx.Configuration.GetSection("bingo"));
                    sp.Configure<TwitchOptions>(ctx.Configuration.GetSection("twitch"));
                    sp.Configure<AzureStorageOptions>(ctx.Configuration.GetSection("azure"));

                    sp.AddSingleton(s =>
                        Twitch.Authenticate()
                            .FromAppCredentials(
                                s.GetService<IOptions<TwitchOptions>>().Value.ClientId,
                                s.GetService<IOptions<TwitchOptions>>().Value.ClientSecret)
                            .Build()
                    );
                    sp.Configure<TwitchChatClientOptions>(ctx.Configuration.GetSection("twitch").GetSection("IrcOptions"));
                    sp.AddTransient(s => TwitchChatClientBuilder.Create()
                        .WithOAuthToken(s.GetService<IOptions<TwitchChatClientOptions>>().Value.OAuthToken)
                        .WithLoggerFactory(s.GetRequiredService<ILoggerFactory>()));
                    sp.AddTransient<ITwitchAPIClient, TwitchAPIClient>();
                    sp.AddMemoryCache();

                    sp.AddSingleton<IHostedService, BingoSiloService>();
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.ConfigureServices((ctx, sp) =>
                    {

                    });
                    webBuilder.UseStartup<Startup>();
                });
    }
}
