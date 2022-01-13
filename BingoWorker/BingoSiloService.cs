using BingoGrain;
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
        private readonly IConfiguration _configuration;
        private readonly ILogger _logger;
        private ISiloHost _siloHost;
        public IClusterClient Client { get; private set; }

        public BingoSiloService(IConfiguration configuration, ILogger<BingoSiloService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            //var clientBuilder = new ClientBuilder();
            //Client = clientBuilder.Build();
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
            builder.ConfigureApplicationParts(app => app.AddApplicationPart(typeof(BingoGameGrain).Assembly).WithReferences());

            return builder.Build();
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            //return Task.Run(() => _siloHost.StartAsync(cancellationToken));
            return _siloHost.StartAsync(cancellationToken);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return _siloHost.StopAsync(cancellationToken);
        }
    }
}
