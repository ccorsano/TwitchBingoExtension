using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    public class BingoGrid
    {
        public Guid gameId { get; set; }
        public string playerId { get; set; } = null!;
        public ushort rows { get; set; }
        public ushort cols { get; set; }
        public BingoGridCell[] cells { get; set; } = new BingoGridCell[0];
        public bool isCompleted { get; set; }
        public ushort[] completedRows { get; set; } = new ushort[0];
        public ushort[] completedCols { get; set; } = new ushort[0];
    }
}
