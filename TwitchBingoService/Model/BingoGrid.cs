using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoGrid
    {
        public Guid gameId { get; set; }
        public required string playerId { get; set; }
        public ushort rows { get; set; }
        public ushort cols { get; set; }
        public BingoGridCell[] cells { get; set; } = Array.Empty<BingoGridCell>();
        public bool isCompleted { get; set; }
        public ushort[] completedRows { get; set; } = Array.Empty<ushort>();
        public ushort[] completedCols { get; set; } = Array.Empty<ushort>();
    }
}
