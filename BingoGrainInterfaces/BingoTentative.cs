using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    public class BingoTentative
    {
        [ProtoMember(1)]
        public string playerId { get; set; } = null!;

        [ProtoMember(2)]
        public ushort Key { get; set; }

        [ProtoMember(3)]
        public DateTime TentativeTime { get; set; }

        [ProtoMember(4)]
        public bool Confirmed { get; set; }
    }
}
