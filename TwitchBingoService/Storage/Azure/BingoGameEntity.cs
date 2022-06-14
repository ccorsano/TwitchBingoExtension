
using Azure;
using Azure.Data.Tables;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoGameEntity : ITableEntity
    {
        public string PartitionKey { get; set; }
        public string RowKey { get; set; } = "";

        public string ChannelId { get; set; }
        public string SerializedGame { get; set; }
        public string SerializedModerators { get; set; }

        [IgnoreDataMember]
        public BingoGame Game {
            get
            {
                if (!string.IsNullOrEmpty(SerializedGame))
                {
                    return JsonSerializer.Deserialize<BingoGame>(SerializedGame);
                }
                if (Game != null && !string.IsNullOrEmpty(SerializedModerators))
                {
                    Game.moderators = JsonSerializer.Deserialize<string[]>(SerializedModerators);
                }
                return null;
            }
            set
            {
                PartitionKey = value.gameId.ToString();
                SerializedGame = JsonSerializer.Serialize(value);
                SerializedModerators = JsonSerializer.Serialize(value.moderators);
            }
        }

        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
    }
}
