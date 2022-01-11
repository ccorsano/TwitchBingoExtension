using BingoGrain;
using Orleans;
using Orleans.Configuration;
using Orleans.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
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
                })
                .UseLocalhostClustering()
                .ConfigureApplicationParts(app => app.AddApplicationPart(typeof(BingoGameGrain).Assembly).WithReferences());
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
