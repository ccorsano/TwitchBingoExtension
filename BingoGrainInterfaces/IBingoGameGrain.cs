using BingoGrain.Model;

namespace BingoGrain
{
    public interface IBingoGameGrain : Orleans.IGrainWithGuidKey
    {
        Task<bool> CreateGame(string channelId, BingoGameCreationParams creationParams);
        Task<BingoGame> GetGame();
        Task<BingoScore[]> GetLeaderboard();
    }
}