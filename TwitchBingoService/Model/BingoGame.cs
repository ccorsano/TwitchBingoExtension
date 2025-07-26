using System;
using System.Globalization;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;
using TwitchBingoService.Configuration;

namespace TwitchBingoService.Model
{
    public class BingoGame
    {
        public Guid gameId { get; set; }

        public string channelId { get; set; }

        public BingoEntry[] entries { get; set; }

        public Byte rows { get; set; }

        public Byte columns { get; set; }

        [JsonConverter(typeof(TimeSpanConverter))]
        public TimeSpan confirmationThreshold { get; set; }

        [IgnoreDataMember,JsonIgnore]
        public string[] moderators { get; set; }

        public bool hasChatIntegration { get; set; } = false;

        [IgnoreDataMember, JsonIgnore]
        public string version { get; set; }

        [IgnoreDataMember, JsonIgnore]
        public string language { get; set; } = "en";

        [IgnoreDataMember, JsonIgnore]
        internal object StorageObject { get; set; } = null;
    }
}
