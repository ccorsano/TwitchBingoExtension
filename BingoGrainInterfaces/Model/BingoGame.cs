using BingoGrainInterfaces.Configuration;
using ProtoBuf;
using System.Text.Json.Serialization;

namespace BingoGrainInterfaces.Model
{
    [ProtoContract]
    public class BingoGame
    {
        [ProtoMember(1)]
        public Guid gameId { get; set; }

        [ProtoMember(2)]
        public string channelId { get; set; } = null!;

        [ProtoMember(3)]
        public BingoEntry[] entries { get; set; } = new BingoEntry[0];

        [ProtoMember(4)]
        public byte rows { get; set; }

        [ProtoMember(5)]
        public byte columns { get; set; }

        [ProtoMember(6)]
        [JsonConverter(typeof(TimeSpanConverter))]
        public TimeSpan confirmationThreshold { get; set; }

        [ProtoMember(7)]
        [JsonIgnore]
        public List<string> moderators { get; set; } = new List<string>();

        [ProtoMember(8)]
        public bool hasChatIntegration { get; set; } = false;
    }
}
