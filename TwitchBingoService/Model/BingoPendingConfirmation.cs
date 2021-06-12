using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    [ProtoContract]
    public class BingoPendingConfirmation
    {
        [ProtoMember(1)]
        public Guid gameId { get; set; }

        [ProtoMember(2)]
        public ushort entryKey { get; set; }

        [ProtoMember(3)]
        public DateTime confirmationCutoff { get; set; }

        [ProtoMember(4)]
        public string confirmedBy { get; set; }
    }
}
