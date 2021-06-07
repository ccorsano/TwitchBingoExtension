using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoGame
    {
        public Guid gameId { get; set; }
        public string channelId { get; set; }
        public BingoEntry[] entries { get; set; }
        public Byte rows { get; set; }
        public Byte columns { get; set; }
    }
}
