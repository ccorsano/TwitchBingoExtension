using BingoGrainInterfaces;
using BingoServices.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Orleans;
using Orleans.Runtime;

namespace BingoGrains
{
    public class BingoGameGrain : Grain, IBingoGameGrain
    {
        private readonly IPersistentState<BingoGameState> _game;
        private readonly BingoServiceOptions _options;
        private readonly ILogger _logger;

        public BingoGameGrain(
            [PersistentState("game", "gameStore")] IPersistentState<BingoGameState> grainState,
            IOptions<BingoServiceOptions> options,
            ILogger<BingoGameGrain> logger)
        {
            _game = grainState;
            _options = options.Value;
            _logger = logger;
        }

        public Task<BingoEntry> Confirm(ushort key, string opaqueId)
        {
            if(_game.State.GameState == null)
            {
                throw new InvalidOperationException($"Game is not available");
            }
            var bingoEntry = _game.State.GameState.entries.First(e => e.key == key);
            if (bingoEntry == null)
            {
                throw new ArgumentOutOfRangeException($"Unknown key {key}");
            }

            if (! _game.State.Moderators.ContainsKey(opaqueId))
            {
                throw new ArgumentOutOfRangeException($"Unknown moderator, can't confirm");
            }

            bingoEntry.confirmedAt = DateTime.UtcNow;
            bingoEntry.confirmedBy = _game.State.Moderators[opaqueId];

            return Task.FromResult(bingoEntry);
        }

        public async Task<BingoGame> CreateGame(string channelId, BingoGameCreationParams creationParams)
        {
            _game.State.GameState = new BingoGame
            {
                channelId = channelId,
                rows = creationParams.rows,
                columns = creationParams.columns,
                entries = creationParams.entries,
                confirmationThreshold = creationParams.confirmationThreshold ?? _options.DefaultConfirmationThreshold,
                gameId = this.GetPrimaryKey(),
                hasChatIntegration = creationParams.enableChatIntegration,
                moderators = new List<string>(),
            };
            _game.State.LogEntries = new List<BingoLogEntry>{
                new BingoLogEntry
                {
                    gameId = this.GetPrimaryKey(),
                    key = 0,
                    type = NotificationType.Start,
                    playerNames = new string[0],
                    playersCount = 0,
                    timestamp = DateTime.UtcNow,
                }
            };
            await _game.WriteStateAsync();
            return _game.State.GameState;
        }

        public Task DeleteGame()
        {
            _game.State.IsDeleted = true;
            return Task.CompletedTask;
        }

        public Task<BingoGame?> GetGame()
        {
            return Task.FromResult(_game.State.GameState);
        }

        public Task<BingoScore[]> GetLeaderboard()
        {
            return Task.FromResult(_game.State.Leaderboard?.Scores?.ToArray() ?? new BingoScore[0]);
        }

        public Task<BingoLogEntry[]> GetLog()
        {
            return Task.FromResult(_game.State.LogEntries.ToArray());
        }

        public Task HandleNotifications(ushort key)
        {
            throw new NotImplementedException();
        }

        public Task RegisterModerator(string moderatorOpaqueId, string userName)
        {
            _game.State.Moderators.TryAdd(moderatorOpaqueId, userName);
            return Task.CompletedTask;
        }
    }
}