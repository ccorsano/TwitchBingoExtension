using BingoGrain;
using BingoGrain.Configuration;
using BingoGrain.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Orleans;

namespace BingoGrain
{
    public class BingoGameGrain : Orleans.Grain<BingoGameState>, IBingoGameGrain
    {
        private readonly BingoServiceOptions _options;
        private readonly ILogger _logger;

        public BingoGameGrain(IOptions<BingoServiceOptions> options, ILogger<BingoGameGrain> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public Task<BingoGame> CreateGame(string channelId, BingoGameCreationParams creationParams)
        {
            State.GameState = new BingoGame
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
            return Task.FromResult(State.GameState);
        }

        public Task DeleteGame()
        {
            State.IsDeleted = true;
            return Task.CompletedTask;
        }

        public Task<BingoGame?> GetGame()
        {
            return Task.FromResult(State.GameState);
        }

        public Task<BingoScore[]> GetLeaderboard()
        {
            return Task.FromResult(State.Leaderboard?.Scores?.ToArray() ?? new BingoScore[0]);
        }
    }
}