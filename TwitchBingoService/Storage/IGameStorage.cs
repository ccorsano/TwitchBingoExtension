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
        public Task WriteTentatives(Guid gameId, string playerId, BingoTentative[] tentatives);
        public Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId);
    }
}
