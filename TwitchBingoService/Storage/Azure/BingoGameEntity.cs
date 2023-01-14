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

        }

        public BingoGameEntity(BingoGame game)
        {
            PartitionKey = game.gameId.ToString();
            ChannelId = game.channelId;
            Game = game;
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; } = "";
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public string ChannelId { get; set; }
        public string SerializedGame {
            get {
                return System.Text.Json.JsonSerializer.Serialize(Game);
            }
            set
            {
                Game = System.Text.Json.JsonSerializer.Deserialize<BingoGame>(value);
            }
        }
        public string SerializedModerators
        {
            get
            {
                return System.Text.Json.JsonSerializer.Serialize(Game?.moderators);
            }
            set
            {
                if (Game != null && !string.IsNullOrEmpty(value))
                {
                    Game.moderators = System.Text.Json.JsonSerializer.Deserialize<string[]>(value);
                }
            }
        }

        [IgnoreDataMember]
        public BingoGame Game { get; set; }
    }
}
