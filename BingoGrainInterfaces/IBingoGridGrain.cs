using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    public interface IBingoGridGrain : Orleans.IGrainWithStringKey
    {
        public static string PrimaryKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";
        public Task SetOpaqueId(string opaqueId);
        public Task<BingoGrid> GetGrid();
        public Task<BingoTentative> AddTentative(ushort key);
    }
}
