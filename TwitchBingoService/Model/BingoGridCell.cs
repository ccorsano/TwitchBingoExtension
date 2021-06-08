using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoGridCell
    {
        public UInt16 row { get; set; }
        public UInt16 col { get; set; }
        public int key { get; set; }
    }
}
