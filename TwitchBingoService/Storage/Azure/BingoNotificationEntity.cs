using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoNotificationEntity : TableEntity
    {
        public static string InvertedTicks(DateTime dateTime) => string.Format("{0:D19}", DateTime.MaxValue.Ticks - dateTime.Ticks);

        public BingoNotificationEntity()
        {

        }

        public BingoNotificationEntity(Guid gameId, DateTime notificationTime, BingoNotification notification) : base(gameId.ToString(), InvertedTicks(notificationTime))
        {
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
                key = Key,
                type = (NotificationType)Type,
                playerId = PlayerId,
            };
        }

        public Guid GameId { get; set; }

        public DateTime NotificationTime { get; set; }

        public ushort Key { get; set; }

        public byte Type { get; set; }

        public string PlayerId { get; set; }

    }
}
