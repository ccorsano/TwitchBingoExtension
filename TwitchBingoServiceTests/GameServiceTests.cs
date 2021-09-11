using Conceptoire.Twitch.IRC;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Services;
using TwitchBingoService.Storage;
using Xunit;

namespace TwitchBingoServiceTests
{
    public class GameServiceTests
    {
        private BingoGameCreationParams GetParams(byte rows, byte cols)
        {
            return new BingoGameCreationParams
            {
                columns = cols,
                rows = rows,
                entries = Enumerable.Range(0, rows * cols).Select(idx => new BingoEntry
                {
                    key = (ushort)idx,
                    text = $"Test {idx}"
                }).ToArray()
            };
        }

        private TwitchEBSService GetEBSService(Func<HttpRequestMessage, HttpResponseMessage> callback = null)
        {
            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .Returns((HttpRequestMessage request, CancellationToken token) =>
                {
                    if (callback != null)
                    {
                        return Task.FromResult(callback(request));
                    }
                    return Task.FromResult(new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        RequestMessage = request,
                    });
                });
            var response = new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
            };

            var mockHttpFactory = new Mock<IHttpClientFactory>();
            mockHttpFactory
                .Setup(factory => factory.CreateClient("twitchExt"))
                .Returns(new HttpClient(handlerMock.Object));
            var loggerFactory = new LoggerFactory();

            return new TwitchEBSService(mockHttpFactory.Object, null, new OptionsWrapper<TwitchOptions>(new TwitchOptions
            {
                ExtensionId = "nope",
                ExtensionSecret = "dGhpcyBpcyBhIHNlY3JldCBwaHJhc2UgdG8gZ2VuZXJhdGUgYSB0ZXN0IHByaXZhdGUga2V5"
            }), loggerFactory.CreateLogger<TwitchEBSService>());
        }

        [Fact]
        public async Task CreateGame()
        {
            var storage = new InMemoryGameStore();
            var mockEBS = GetEBSService();
            var options = new OptionsWrapper<BingoServiceOptions>(new BingoServiceOptions());
            var memoryCache = new MemoryCache(new OptionsWrapper<MemoryCacheOptions>(new MemoryCacheOptions()));
            var loggerFactory = new LoggerFactory();
            var chatClientBuilder = TwitchChatClientBuilder.Create()
                .WithOAuthToken("")
                .WithLoggerFactory(loggerFactory);
            var gameService = new BingoService(storage, mockEBS, chatClientBuilder, memoryCache, options, loggerFactory.CreateLogger<BingoService>());

            var channelId = "123456";
            var paramObject = GetParams(3, 4);
            var game = await gameService.CreateGame(channelId, paramObject);
            var grid01 = await gameService.GetGrid(game.gameId, "User01");
            Assert.Equal(3, grid01.rows);
            Assert.Equal(4, grid01.cols);
            Assert.Equal(game.gameId, grid01.gameId);
            Assert.Equal(channelId, game.channelId);
        }

        [Fact]
        public async Task ConfirmSingle()
        {
            var storage = new InMemoryGameStore();
            var mockEBS = GetEBSService();
            var options = new OptionsWrapper<BingoServiceOptions>(new BingoServiceOptions());
            var memoryCache = new MemoryCache(new OptionsWrapper<MemoryCacheOptions>(new MemoryCacheOptions()));
            var loggerFactory = new LoggerFactory();
            var chatClientBuilder = TwitchChatClientBuilder.Create()
                .WithOAuthToken("")
                .WithLoggerFactory(loggerFactory);
            var gameService = new BingoService(storage, mockEBS, chatClientBuilder, memoryCache, options, loggerFactory.CreateLogger<BingoService>());

            var channelId = "123456";
            var paramObject = GetParams(2, 3);

            // Create game & get initial grid for player
            var game = await gameService.CreateGame(channelId, paramObject);
            var grid01 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0 = grid01.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            // Add a tentative from player on cell 0,0
            var tentative01 = await gameService.AddTentative(game.gameId, cell_0_0.key, "Player01");
            Assert.False(tentative01.confirmed);

            // Confirm entry from moderator
            var confirmedEntry = await gameService.Confirm(game.gameId, cell_0_0.key, "Moderator01");

            // Get updated grid for player
            var grid01_2 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0_2 = grid01_2.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            Assert.Equal(BingoCellState.Confirmed, cell_0_0_2.state);

            // Get cell 0,1 for player
            var cell_0_1 = grid01_2.cells.FirstOrDefault(c => c.col == 0 && c.row == 1);

            // Confirm entry shown at 0,1
            var confirmedEntry2 = await gameService.Confirm(game.gameId, cell_0_1.key, "Moderator01");
            var grid01_3 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_1_2 = grid01_3.cells.FirstOrDefault(c => c.col == 0 && c.row == 1);

            Assert.Equal(BingoCellState.Idle, cell_0_1_2.state);

            // Player add a tentative on cell 0,1 after confirmation
            var tentative02 = await gameService.AddTentative(game.gameId, cell_0_1.key, "Player01");

            var grid01_4 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_1_3 = grid01_4.cells.FirstOrDefault(c => c.col == 0 && c.row == 1);

            Assert.Equal(BingoCellState.Confirmed, cell_0_1_3.state);
        }

        [Fact]
        public async Task ConfirmRow()
        {
            var storage = new InMemoryGameStore();
            var mockEBS = GetEBSService();
            var options = new OptionsWrapper<BingoServiceOptions>(new BingoServiceOptions
            {
                DefaultConfirmationThreshold = TimeSpan.FromMilliseconds(200)
            });
            var memoryCache = new MemoryCache(new OptionsWrapper<MemoryCacheOptions>(new MemoryCacheOptions()));
            var loggerFactory = new LoggerFactory();
            var chatClientBuilder = TwitchChatClientBuilder.Create()
                .WithOAuthToken("")
                .WithLoggerFactory(loggerFactory);
            var gameService = new BingoService(storage, mockEBS, chatClientBuilder, memoryCache, options, loggerFactory.CreateLogger<BingoService>());

            var channelId = "123456";
            var paramObject = GetParams(2, 3);

            // Create game & get initial grid for player
            var game = await gameService.CreateGame(channelId, paramObject);
            var grid01 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0 = grid01.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            var cell_0_1 = grid01.cells.FirstOrDefault(c => c.col == 1 && c.row == 0);
            var cell_0_2 = grid01.cells.FirstOrDefault(c => c.col == 2 && c.row == 0);
            // Add a tentative from player on cell 0,0
            var tentative01 = await gameService.AddTentative(game.gameId, cell_0_0.key, "Player01");
            Assert.False(tentative01.confirmed);

            // Confirm entry from moderator
            var confirmedEntry01 = await gameService.Confirm(game.gameId, cell_0_0.key, "Moderator01");
            await Task.Delay(201);
            var tentative02 = await gameService.AddTentative(game.gameId, cell_0_1.key, "Player01");
            Assert.False(tentative02.confirmed);
            var confirmedEntry02 = await gameService.Confirm(game.gameId, cell_0_1.key, "Moderator01");
            await Task.Delay(201);
            var tentative03 = await gameService.AddTentative(game.gameId, cell_0_2.key, "Player01");
            Assert.False(tentative03.confirmed);
            var confirmedEntry03 = await gameService.Confirm(game.gameId, cell_0_2.key, "Moderator01");
            await Task.Delay(201);

            // Get updated grid for player
            var grid01_2 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0_2 = grid01_2.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            Assert.Equal(BingoCellState.Confirmed, cell_0_0_2.state);
            Assert.All(grid01_2.cells.Where(c => c.row == 0), c =>
            {
                Assert.Equal(BingoCellState.Confirmed, c.state);
            });
            Assert.Contains<ushort>(0, grid01_2.completedRows);
            Assert.DoesNotContain<ushort>(1, grid01_2.completedRows);
            Assert.DoesNotContain<ushort>(0, grid01_2.completedCols);
            Assert.DoesNotContain<ushort>(1, grid01_2.completedCols);
            Assert.DoesNotContain<ushort>(2, grid01_2.completedCols);

            Assert.False(grid01_2.isCompleted);
        }

        [Fact]
        public async Task FailRow()
        {
            var storage = new InMemoryGameStore();
            var mockEBS = GetEBSService();
            var options = new OptionsWrapper<BingoServiceOptions>(new BingoServiceOptions
            {
                DefaultConfirmationThreshold = TimeSpan.FromMilliseconds(200),
            });
            var memoryCache = new MemoryCache(new OptionsWrapper<MemoryCacheOptions>(new MemoryCacheOptions()));
            var loggerFactory = new LoggerFactory();
            var chatClientBuilder = TwitchChatClientBuilder.Create()
                .WithOAuthToken("")
                .WithLoggerFactory(loggerFactory);
            var gameService = new BingoService(storage, mockEBS, chatClientBuilder, memoryCache, options, loggerFactory.CreateLogger<BingoService>());

            var channelId = "123456";
            var paramObject = GetParams(2, 3);

            // Create game & get initial grid for player
            var game = await gameService.CreateGame(channelId, paramObject);
            var grid01 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0 = grid01.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            var cell_0_1 = grid01.cells.FirstOrDefault(c => c.col == 1 && c.row == 0);
            var cell_0_2 = grid01.cells.FirstOrDefault(c => c.col == 2 && c.row == 0);
            // Add a tentative from player on cell 0,0
            var tentative01 = await gameService.AddTentative(game.gameId, cell_0_0.key, "Player01");
            var tentative03 = await gameService.AddTentative(game.gameId, cell_0_2.key, "Player01");
            Assert.False(tentative01.confirmed);
            Assert.False(tentative03.confirmed);

            // Confirm entry from moderator
            var confirmedEntry01 = await gameService.Confirm(game.gameId, cell_0_0.key, "Moderator01");
            var confirmedEntry02 = await gameService.Confirm(game.gameId, cell_0_1.key, "Moderator01");
            await Task.Delay(210);
            var confirmedEntry03 = await gameService.Confirm(game.gameId, cell_0_2.key, "Moderator01");

            // Get updated grid for player
            var grid01_2 = await gameService.GetGrid(game.gameId, "Player01");
            var cell_0_0_2 = grid01_2.cells.FirstOrDefault(c => c.col == 0 && c.row == 0);
            var cell_0_1_2 = grid01_2.cells.FirstOrDefault(c => c.col == 1 && c.row == 0);
            var cell_0_2_2 = grid01_2.cells.FirstOrDefault(c => c.col == 2 && c.row == 0);
            Assert.Equal(BingoCellState.Confirmed, cell_0_0_2.state);
            Assert.Equal(BingoCellState.Missed, cell_0_1_2.state);
            Assert.Equal(BingoCellState.Rejected, cell_0_2_2.state);

            Assert.DoesNotContain<ushort>(0, grid01_2.completedRows);
            Assert.DoesNotContain<ushort>(1, grid01_2.completedRows);
            Assert.DoesNotContain<ushort>(0, grid01_2.completedCols);
            Assert.DoesNotContain<ushort>(1, grid01_2.completedCols);
            Assert.DoesNotContain<ushort>(2, grid01_2.completedCols);

            Assert.False(grid01_2.isCompleted);
        }
    }
}
