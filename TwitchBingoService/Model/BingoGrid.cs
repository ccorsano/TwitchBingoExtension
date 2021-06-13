using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoGrid
    {
        public Guid gameId { get; set; }
        public string playerId { get; set; }
        public ushort rows { get; set; }
        public ushort cols { get; set; }
        public BingoGridCell[] cells { get; set; }
    }
}
