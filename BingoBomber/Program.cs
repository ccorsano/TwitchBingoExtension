using BingoBomber;
using BingoBomber.Configuration;
using BingoGrainInterfaces;
using BingoGrainInterfaces.Model;
using BingoServices.Configuration;
using BingoServices.Services;
using Conceptoire.Twitch;
using Conceptoire.Twitch.API;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;
using NBomber.Plugins.Http.CSharp;
using System.Net.Http.Json;
using System.Reflection;

var host = Host.CreateDefaultBuilder()
    .ConfigureAppConfiguration(host =>
    {
        host.AddUserSecrets(Assembly.GetExecutingAssembly());
    })
    .ConfigureServices((host,services) =>
    {
        services.Configure<TwitchOptions>(host.Configuration.GetSection("twitch"));
        services.Configure<BingoBomberOptions>(host.Configuration.GetSection("BingoBomber"));
        services.AddHttpClient();
        services.AddSingleton(s =>
            Twitch.Authenticate()
                .FromAppCredentials(
                    s.GetRequiredService<IOptions<TwitchOptions>>().Value.ClientId,
                    s.GetRequiredService<IOptions<TwitchOptions>>().Value.ClientSecret)
                .Build()
        );
        services.AddTransient<ITwitchAPIClient, TwitchAPIClient>();
        services.AddSingleton<TwitchEBSService>();
    }).Build();

var httpFactory = HttpClientFactory.Create();

var ebsService = host.Services.GetRequiredService<TwitchEBSService>();
var options = host.Services.GetRequiredService<IOptions<BingoBomberOptions>>().Value;

var bingoGame = new BingoGameCreationParams
{
    rows = 3,
    columns = 3,
    confirmationThreshold = TimeSpan.FromSeconds(30),
    enableChatIntegration = false,
    entries = new BingoEntry[]
    {
        new BingoEntry
        {
            key = 1,
            text = "Event 1",
        },
        new BingoEntry
        {
            key = 2,
            text = "Event 2",
        },
        new BingoEntry
        {
            key = 3,
            text = "Event 3",
        },
        new BingoEntry
        {
            key = 4,
            text = "Event 4",
        },
        new BingoEntry
        {
            key = 5,
            text = "Event 5",
        },
        new BingoEntry
        {
            key = 6,
            text = "Event 6",
        },
        new BingoEntry
        {
            key = 7,
            text = "Event 7",
        },
        new BingoEntry
        {
            key = 8,
            text = "Event 8",
        },
        new BingoEntry
        {
            key = 9,
            text = "Event 9",
        },
    }
};

var myOwnContext = new Dictionary<string, object>();

Func<IStepContext<HttpClient, Microsoft.FSharp.Core.Unit>, Task<Response>> viewerGetGameFunc = async context =>
{
    if (!context.Data.TryGetValue("userId", out object? userId))
    {
        context.Data["userId"] = $"U-{DateTime.UtcNow.Ticks}";
        userId = context.Data["userId"];
    }
    var game = myOwnContext["game"] as BingoGame;
    if (game == null) throw new ArgumentNullException("game");
    var getGridRequest = BingoRequestBuilder.CreateViewerRequest(ebsService)
        .WithChannelId(options.ChannelId)
        .WithUserId((string)userId as string)
        .WithTarget("GET", options.TargetService, $"game/{game.gameId}/grid")
        .Build()
        .WithCheck(response =>
        Task.FromResult(
            response.IsSuccessStatusCode
                ? Response.Ok()
                : Response.Fail()
        ));

    var response = await Http.Send(getGridRequest, context);
    return response;
};
Func<IStepContext<HttpClient, Microsoft.FSharp.Core.Unit>, Task<Response>> viewerMarkEventFunc = async context =>
{
    if (!context.Data.TryGetValue("userId", out object? userId))
    {
        context.Data["userId"] = $"U-{DateTime.UtcNow.Ticks}";
        userId = context.Data["userId"];
    }
    var game = myOwnContext["game"] as BingoGame;
    if (game == null) throw new ArgumentNullException("game");

    var key = game.entries.FirstOrDefault(e => e.confirmedAt == null);

    var getGridRequest = BingoRequestBuilder.CreateViewerRequest(ebsService)
        .WithChannelId(options.ChannelId)
        .WithUserId((string)userId as string)
        .WithTarget("POST", options.TargetService, $"game/{game.gameId}/{key}/tentative")
        .Build()
        .WithCheck(response =>
        Task.FromResult(
            response.IsSuccessStatusCode
                ? Response.Ok()
                : Response.Fail()
        ));

    var response = await Http.Send(getGridRequest, context);
    return response;
};

var viewerGetGame = Step.Create("getGameInitial", clientFactory: httpFactory, execute: viewerGetGameFunc);
var viewerMarkEvent1 = Step.Create("markEvent1", clientFactory: httpFactory, execute: viewerMarkEventFunc);
var viewerGetGameEvent1 = Step.Create("getGameEvent1", clientFactory: httpFactory, execute: viewerGetGameFunc);
var viewerMarkEvent2 = Step.Create("markEvent2", clientFactory: httpFactory, execute: viewerMarkEventFunc);
var viewerGetGameEvent2 = Step.Create("getGameEvent2", clientFactory: httpFactory, execute: viewerGetGameFunc);
var viewerMarkEvent3 = Step.Create("markEvent3", clientFactory: httpFactory, execute: viewerMarkEventFunc);
var viewerGetGameEvent3 = Step.Create("getGameEvent3", clientFactory: httpFactory, execute: viewerGetGameFunc);

var viewerPause = Step.CreatePause(TimeSpan.FromSeconds(1) + Random.Shared.NextDouble() * TimeSpan.FromSeconds(1));

var scenario = ScenarioBuilder
    .CreateScenario("nbomber-web-site", viewerGetGame, viewerPause, viewerMarkEvent1, viewerGetGameEvent1, viewerPause, viewerMarkEvent2, viewerGetGameEvent2, viewerPause, viewerMarkEvent3, viewerGetGameEvent3)
    .WithInit(async context =>
    {
        var httpClient = host.Services.GetRequiredService<HttpClient>();
        var gameRequest = BingoRequestBuilder.CreateBroadcasterRequest(ebsService)
            .WithChannelId(options.ChannelId)
            .WithTarget("POST", options.TargetService, "game/")
            .BuildMessage();
        gameRequest.Content = JsonContent.Create(bingoGame);
        var result = await httpClient.SendAsync(gameRequest);
        result.EnsureSuccessStatusCode();
        var game = result.Content.ReadFromJsonAsync<BingoGame>();
        if (game.Result == null)
        {
            throw new Exception("Got null game from server");
        }
        myOwnContext.Add("gameId", game.Result.gameId);
        myOwnContext.Add("game", game.Result);
    })
    .WithLoadSimulations(Simulation.InjectPerSec(100, TimeSpan.FromSeconds(30)));

NBomberRunner
    .RegisterScenarios(scenario)
    .Run();