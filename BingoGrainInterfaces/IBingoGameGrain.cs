using BingoGrainInterfaces.Model;

namespace BingoGrainInterfaces
{
    public interface IBingoGameGrain : Orleans.IGrainWithGuidKey
    {
        Task<BingoGame> CreateGame(string channelId, BingoGameCreationParams creationParams);
        Task<BingoGame?> GetGame();
        Task<BingoScore[]> GetLeaderboard();
        Task<BingoLogEntry[]> GetLog();
        Task RegisterModerator(string opaqueId, string userName);
        Task<BingoEntry> Confirm(ushort key, string opaqueId);
        Task HandleNotifications(ushort key);
        Task DeleteGame();
    }
}