using System;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage
{
    public class ConcurrentGameUpdateException : Exception
    {
        public ConcurrentGameUpdateException() { }
    }

    public interface IGameStorage
    {
        /// <summary>
        /// 
        /// </summary>
        /// <exception cref="ConcurrentGameUpdateException">If the write fails because the game got modified concurrently</exception>
        /// <param name="bingoGame"></param>
        /// <returns></returns>
        public Task WriteGame(BingoGame bingoGame);
        public Task<BingoGame> ReadGame(Guid gameId);
        public Task DeleteGame(Guid gameId);
        public Task WriteTentative(Guid gameId, BingoTentative tentatives);
        public Task WriteParticipation(Guid gameId, string channelId, string userId);
        public Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key, DateTime deletionCutoff);
        public Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId);
        public Task QueueNotification(Guid gameId, ushort key, BingoNotification notification);
        public Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key);
        public Task<string> ReadUserName(string userId);
        public Task WriteUserName(string userId, string userName);
        public Task WriteLog(Guid gameid, BingoLogEntry entry);
        public Task<BingoLogEntry[]> ReadLog(Guid gameId);
    }
}
