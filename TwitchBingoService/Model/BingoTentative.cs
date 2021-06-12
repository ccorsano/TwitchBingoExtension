using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    [ProtoContract]
    public class BingoTentative
    {
        [ProtoMember(1)]
        public string playerId { get; set; }

        [ProtoMember(2)]
        public ushort entryKey { get; set; }

        [ProtoMember(3)]
        public bool confirmed { get; set; }

        [ProtoMember(4)]
        public DateTime tentativeTime { get; set; }
    }
}
