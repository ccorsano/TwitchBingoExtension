using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoEntry
    {
        public UInt16 key { get; set; }

        public required string text { get; set; }

        public DateTime? confirmedAt { get; set; }

        public string? confirmedBy { get; set; }
    }
}
