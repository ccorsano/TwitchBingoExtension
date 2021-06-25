using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage
{
    public interface IGameStorage
    {
        public Task WriteGame(BingoGame bingoGame);
        public Task<BingoGame> ReadGame(Guid gameId);
        public Task WriteTentative(Guid gameId, BingoTentative tentatives);
        public Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key, DateTime cutoff);
        public Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId);
        public Task QueueNotification(Guid gameId, ushort key, BingoNotification notification);
        public Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key);
    }
}
