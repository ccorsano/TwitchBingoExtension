using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoTentative
    {
        public required string playerId { get; set; }

        public ushort entryKey { get; set; }

        public bool confirmed { get; set; }

        public DateTime tentativeTime { get; set; }
    }
}
