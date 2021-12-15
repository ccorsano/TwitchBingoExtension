using BingoGrain.Configuration;
using System.Text.Json.Serialization;

namespace BingoGrain.Model
{
    public class BingoGameCreationParams
    {
        public Byte rows { get; set; }
        public Byte columns { get; set; }
        public BingoEntry[] entries { get; set; } = new BingoEntry[0];

        [JsonConverter(typeof(TimeSpanConverter))]
        public TimeSpan? confirmationThreshold { get; set; }
        public bool enableChatIntegration { get; set; }
    }
}
