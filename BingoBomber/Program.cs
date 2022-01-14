using BingoGrainInterfaces;
using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;
using NBomber.Plugins.Http.CSharp;
using System.Net.Http.Json;

var httpFactory = HttpClientFactory.Create();

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

var step = Step.Create("step", clientFactory: httpFactory, execute: async context => {
    var request = Http.CreateRequest("POST", "https://localhost:5001/game")
                        .WithHeader("Accept", "application/json")
                        .WithBody(JsonContent.Create(bingoGame))
                        .WithCheck(response =>
                            Task.FromResult(
                                response.IsSuccessStatusCode
                                    ? Response.Ok()
                                    : Response.Fail()
                            )
                        );

    var response = await Http.Send(request, context);
    return response;
});

var scenario = ScenarioBuilder
    .CreateScenario("nbomber-web-site", step)
    .WithLoadSimulations(Simulation.InjectPerSec(100, TimeSpan.FromSeconds(30)));

NBomberRunner
    .RegisterScenarios(scenario)
    .Run();