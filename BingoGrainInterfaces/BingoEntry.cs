using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    [ProtoContract]
    public class BingoEntry
    {
        [ProtoMember(1)]
        public ushort key { get; set; }

        [ProtoMember(2)]
        public string text { get; set; } = null!;

        [ProtoMember(3)]
        public DateTime? confirmedAt { get; set; }

        [ProtoMember(4)]
        public string? confirmedBy { get; set; }
    }
}
