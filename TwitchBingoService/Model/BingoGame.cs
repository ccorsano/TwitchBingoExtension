using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using TwitchBingoService.Configuration;

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
        [JsonConverter(typeof(TimeSpanConverter))]
        public TimeSpan confirmationThreshold { get; set; }

        [ProtoMember(7)]
        [JsonIgnore]
        public string[] moderators { get; set; }

        [ProtoMember(8)]
        public bool hasChatIntegration { get; set; } = false;
    }
}
