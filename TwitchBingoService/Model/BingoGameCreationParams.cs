using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoGameCreationParams
    {
        public Byte rows { get; set; }
        public Byte columns { get; set; }
        public BingoEntry[] entries { get; set; }
    }
}
