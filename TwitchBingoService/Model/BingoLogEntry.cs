using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    [ProtoContract]
    public class BingoLogEntry
    {
        [ProtoMember(1)]
        public Guid gameId { get; set; }
        [ProtoMember(2)]
        public ushort key { get; set; }
        public NotificationType type { get; set; }
        [ProtoMember(3)]
        public int playersCount { get; set; }
        [ProtoMember(4)]
        public string[] playerNames { get; set; }
        [ProtoMember(5)]
        public DateTime timestamp { get; set; }
    }
}
