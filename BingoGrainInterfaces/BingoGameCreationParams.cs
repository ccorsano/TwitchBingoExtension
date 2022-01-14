using BingoGrainInterfaces.Configuration;
using System.Text.Json.Serialization;

namespace BingoGrainInterfaces
{
    public class BingoGameCreationParams
    {
        public byte rows { get; set; }
        public byte columns { get; set; }
        public BingoEntry[] entries { get; set; } = new BingoEntry[0];

        [JsonConverter(typeof(TimeSpanConverter))]
        public TimeSpan? confirmationThreshold { get; set; }
        public bool enableChatIntegration { get; set; }
    }
}
