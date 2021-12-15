using BingoGrain.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrain
{
    public interface IBingoGridGrain : Orleans.IGrainWithStringKey
    {
        public static string PrimaryKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";
        public Task<BingoGrid> GetGrid();
    }
}
