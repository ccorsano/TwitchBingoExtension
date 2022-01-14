using BingoGrains;
using BingoServices.Configuration;
using BingoServices.Services;
using Conceptoire.Twitch.API;
using Microsoft.Extensions.Options;
using Orleans;
using Orleans.Configuration;
using Orleans.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace BingoWorker
{
    public class BingoSiloService : IHostedService
    {
        private readonly IServiceProvider _hostServiceProvider;
        private readonly IConfiguration _configuration;
        private readonly ILogger _logger;
        private ISiloHost _siloHost;

        public BingoSiloService(IServiceProvider hostServiceProvider, IConfiguration configuration, ILogger<BingoSiloService> logger)
        {
            _hostServiceProvider = hostServiceProvider;
            _configuration = configuration;
            _logger = logger;
            _siloHost = BuildSiloHost();
        }

        private ISiloHost BuildSiloHost()
        {
            var builder = new SiloHostBuilder()
                .Configure<ClusterOptions>(options =>
                {
                    options.ClusterId = "dev";
                    options.ServiceId = "BingoService";
                });

            if (_configuration.GetValue<string>("WEBSITE_PRIVATE_IP") != null &&
                _configuration.GetValue<string>("WEBSITE_PRIVATE_PORTS") != null)
            {
                // presume the app is running in Web Apps on App Service and start up
                IPAddress endpointAddress = IPAddress.Parse(_configuration.GetValue<string>("WEBSITE_PRIVATE_IP"));

                var strPorts = _configuration.GetValue<string>("WEBSITE_PRIVATE_PORTS").Split(',');

                if (strPorts.Length < 2) throw new Exception("Insufficient private ports configured.");

                int siloPort = int.Parse(strPorts[0]);
                int gatewayPort = int.Parse(strPorts[1]);

                builder.ConfigureEndpoints(endpointAddress, siloPort, gatewayPort);
            }
            else
            {
                builder.UseLocalhostClustering();
            }

            var azureConnectionString = _configuration.GetValue<string>("azure:ConnectionString");
            if (string.IsNullOrEmpty(azureConnectionString))
            {
                builder.AddMemoryGrainStorage("gameStore");
            }
            else
            {
                builder.AddAzureBlobGrainStorage("gameStore", configure =>
                {
                    configure.ConnectionString = azureConnectionString;
                    configure.UseJson = false;
                });
            }

            builder.ConfigureApplicationParts(app => app.AddApplicationPart(typeof(BingoGameGrain).Assembly).WithReferences());

            // Inject services from parent host container
            builder.ConfigureServices((ctx, services) =>
            {
                services.AddTransient(s => _hostServiceProvider.GetRequiredService<TwitchEBSService>());
                services.AddTransient(s => _hostServiceProvider.GetRequiredService<IOptions<BingoServiceOptions>>());
                services.AddTransient(s => _hostServiceProvider.GetRequiredService<IOptions<TwitchOptions>>());
                services.AddTransient(s => _hostServiceProvider.GetRequiredService<IOptions<AzureStorageOptions>>());
                services.AddTransient(s => _hostServiceProvider.GetRequiredService<IOptions<ITwitchAPIClient>>());
            });

            return builder.Build();
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Orleans silo");
            //return Task.Run(() => _siloHost.StartAsync(cancellationToken));
            return _siloHost.StartAsync(cancellationToken);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return _siloHost.StopAsync(cancellationToken);
        }
    }
}
