using System;
using System.Text.Json.Serialization;

namespace TwitchBingoService.Model
{
    public class BingoEditableEntry
    {
        public int key { get; set; }
        public string text { get; set; } = string.Empty;
        public bool isNew { get; set; }
    }

    public class BingoConfigurationSegment
    {
        public int nextKey { get; set; } = 0;
        public BingoEditableEntry[] entries { get; set; } = Array.Empty<BingoEditableEntry>();
        public int[] selectedEntries { get; set; } = Array.Empty<int>();
        public int rows { get; set; } = 3;
        public int columns { get; set; } = 3;
        public int confirmationThreshold { get; set; } = 120;
        public BingoGame? activeGame { get; set; } = null;
        public string? activeGameId { get; set; } = null;
    }

    [JsonSerializable(typeof(BingoConfigurationSegment))]
    public partial class ConfigurationSerializerContext : JsonSerializerContext { }
}
