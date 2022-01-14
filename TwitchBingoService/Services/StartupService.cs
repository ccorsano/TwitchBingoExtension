using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Orleans;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TwitchBingoService.Services
{
    public class StartupService : IHostedService
    {
        private readonly Func<IClusterClient> _clientFactory;
        private readonly ILogger _logger;

        public IClusterClient ClusterClient { get; internal set; }

        public StartupService(Func<IClusterClient> orleansClientFactory, ILogger<StartupService> logger)
        {
            _clientFactory = orleansClientFactory;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Connecting Orleans client");
            while (!cancellationToken.IsCancellationRequested && ! (ClusterClient?.IsInitialized ?? false))
            {
                Task.Delay(TimeSpan.FromMilliseconds(10)).Wait();
                try
                {
                    ClusterClient = _clientFactory();
                    await ClusterClient.Connect();
                }
                catch (Orleans.Runtime.Messaging.ConnectionFailedException)
                {
                    ClusterClient?.Dispose();
                }
            }
            _logger.LogInformation("Orleans client connected to internal cluster");
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            ClusterClient?.Dispose();
            return Task.CompletedTask;
        }
    }
}
