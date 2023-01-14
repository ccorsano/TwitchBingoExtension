using Azure;
using Azure.Data.Tables;
using System;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoNotificationEntity : ITableEntity
    {
        public BingoNotificationEntity()
        {

        }

        public BingoNotificationEntity(Guid gameId, DateTime notificationTime, BingoNotification notification)
        {
            PartitionKey = gameId.ToString();
            RowKey = notificationTime.InvertedTicks();
            GameId = gameId;
            NotificationTime = notificationTime;
            Key = notification.key;
            Type = (byte) notification.type;
            PlayerId = notification.playerId;
        }

        public BingoNotification ToNotification()
        {
            return new BingoNotification
            {
                key = (ushort)Key,
                type = (NotificationType)Type,
                playerId = PlayerId,
            };
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public Guid GameId { get; set; }

        public DateTime NotificationTime { get; set; }

        public Int32 Key { get; set; }

        public Int32 Type { get; set; }

        public string PlayerId { get; set; }
    }
}
