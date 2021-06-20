using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public enum BingoCellState
    {
        Idle = 0,
        Pending = 1,
        Confirmed = 2,
        Missed = 3,
        Rejected = 4,
    }

    public class BingoGridCell
    {
        public UInt16 row { get; set; }
        public UInt16 col { get; set; }
        public ushort key { get; set; }
        public BingoCellState state { get; set; }
    }
}
