using Azure;
using Azure.Data.Tables;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoGameEntity : ITableEntity
    {
        public BingoGameEntity()
        {
            PartitionKey = string.Empty;
            ChannelId = string.Empty;
            Language = "en";
        }

        public BingoGameEntity(BingoGame game)
        {
            PartitionKey = game.gameId.ToString();
            ChannelId = game.channelId;
            Game = game;
            Version = game.version;
            Language = game.language;
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; } = "";
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public string ChannelId { get; set; }

        public string? Version { get; set; }

        public string Language { get; set; }

        public string SerializedGame {
            get {
                return System.Text.Json.JsonSerializer.Serialize(Game, JsonContext.Default.BingoGame);
            }
            set
            {
                Game = System.Text.Json.JsonSerializer.Deserialize(value, JsonContext.Default.BingoGame);
                if (Game is not null)
                {
                    Game.version = Version;
                    Game.language = Language;
                }
            }
        }
        public string SerializedModerators
        {
            get
            {
                return System.Text.Json.JsonSerializer.Serialize(Game?.moderators, JsonContext.Default.StringArray);
            }
            set
            {
                if (Game != null && !string.IsNullOrEmpty(value))
                {
                    Game.moderators = System.Text.Json.JsonSerializer.Deserialize<string[]>(value, JsonContext.Default.StringArray) ?? Array.Empty<string>();
                }
            }
        }

        [IgnoreDataMember]
        public BingoGame? Game { get; set; }
    }
}
