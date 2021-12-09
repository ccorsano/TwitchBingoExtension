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

        public Task<bool> CreateGame(string channelId, BingoGameCreationParams creationParams)
        {
            State.GameState = new BingoGame
            {
                channelId = channelId,
                rows = creationParams.rows,
                columns = creationParams.columns,
                entries = creationParams.entries,
                confirmationThreshold = creationParams.confirmationThreshold ?? _,
                gameId = this.GetPrimaryKey(),
                hasChatIntegration = creationParams.enableChatIntegration,
                moderators = new List<string>(),
            };
            return Task.FromResult(true);
        }

        public Task<BingoGame> GetGame()
        {
            return Task.FromResult(State.GameState);
        }

        public Task<BingoScore[]> GetLeaderboard()
        {
            return Task.FromResult(State.Leaderboard.Scores.ToArray());
        }
    }
}