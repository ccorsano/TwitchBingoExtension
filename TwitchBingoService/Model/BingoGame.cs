using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    [ProtoContract]
    public class BingoGame
    {
        [ProtoMember(1)]
        public Guid gameId { get; set; }

        [ProtoMember(2)]
        public string channelId { get; set; }

        [ProtoMember(3)]
        public BingoEntry[] entries { get; set; }

        [ProtoMember(4)]
        public Byte rows { get; set; }

        [ProtoMember(5)]
        public Byte columns { get; set; }

        [ProtoMember(6)]
        public TimeSpan confirmationThreshold { get; set; }
    }
}
