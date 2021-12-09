using BingoGrains;
using BingoWorker;
using Microsoft.Extensions.Hosting;
using Orleans;
using Orleans.Configuration;
using Orleans.Hosting;
using System.Net;

IHostBuilder hostBuilder = Host.CreateDefaultBuilder(args)
    .UseOrleans((hostContext, builder) =>
    {
        var hostingModel = hostContext.Configuration.GetValue<HostingModel?>("HOSTING_MODEL") ?? HostingModel.Localhost;

        builder.UseLocalhostClustering()
            .Configure<ClusterOptions>(options =>
            {
                options.ClusterId = "dev";
                options.ServiceId = "BingoService";
            })
            .Configure<EndpointOptions>(options => options.AdvertisedIPAddress = IPAddress.Loopback)
            .ConfigureLogging(logging => logging.AddConsole());
        builder.AddMemoryGrainStorageAsDefault();
        builder.ConfigureApplicationParts(options =>
            options.AddApplicationPart(typeof(BingoGameGrain).Assembly).WithReferences()
        );
    });

IHost host = hostBuilder.Build();

await host.RunAsync();

enum HostingModel
{
    Localhost,
}