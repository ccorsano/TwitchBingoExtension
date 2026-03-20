using Azure;
using Azure.Data.Tables;
using System;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors | DynamicallyAccessedMemberTypes.PublicProperties)]
    public class BingoLogEntity : ITableEntity
    {
        public BingoLogEntity()
        {
            RowKey = string.Empty;
            PlayersNames = string.Empty;
        }

        public BingoLogEntity(Guid gameId, BingoLogEntry log)
        {
            GameId = gameId;
            RowKey = log.timestamp.InvertedTicks();
            NotificationTime = log.timestamp;
            Key = log.key;
            Type = (byte)log.type;
            PlayersCount = log.playersCount;
            PlayersNames = JsonSerializer.Serialize(log.playerNames, JsonContext.Default.StringArray);
        }

        public string PartitionKey
        {
            get
            {
                return GameId.ToString();
            }
            set
            {
                GameId = Guid.Parse(value);
            }
        }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public Guid GameId { get; set; }

        public DateTime NotificationTime { get; set; }

        public Int32 Key { get; set; }

        public Int32 Type { get; set; }

        public Int32 PlayersCount { get; set; }

        public string PlayersNames { get; set; }

        public BingoLogEntry ToLogEntry()
        {
            return new BingoLogEntry
            {
                gameId = GameId,
                timestamp = NotificationTime,
                key = (ushort)Key,
                type = (NotificationType)Type,
                playersCount = PlayersCount,
                playerNames = JsonSerializer.Deserialize(PlayersNames, JsonContext.Default.StringArray) ?? Array.Empty<string>(),
            };
        }

        public static BingoLogEntry FromTableEntity(TableEntity entity)
        {
            return new BingoLogEntry
            {
                gameId = entity.GetGuid("GameId")!.Value,
                timestamp = entity.GetDateTime("NotificationTime")!.Value,
                key = (ushort) entity.GetInt32("Key")!.Value,
                type = (NotificationType) entity.GetInt32("Type")!.Value,
                playersCount = entity.GetInt32("PlayersCount")!.Value,
                playerNames = JsonSerializer.Deserialize(entity.GetString("PlayersCount"), JsonContext.Default.StringArray) ?? Array.Empty<string>(),
            };
        }

        public TableEntity ToEntity()
        {
            TableEntity entity = new TableEntity(PartitionKey, RowKey);
            entity.Add("GameId", GameId);
            entity.Add("NotificationTime", NotificationTime);
            entity.Add("Key", Key);
            entity.Add("Type", Type);
            entity.Add("PlayersCount", PlayersCount);
            entity.Add("PlayersName", PlayersNames);
            return entity;
        }
    }
}
