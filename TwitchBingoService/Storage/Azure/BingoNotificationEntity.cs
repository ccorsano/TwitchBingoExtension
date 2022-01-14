using BingoGrainInterfaces;
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
        public BingoNotificationEntity()
        {

        }

        public BingoNotificationEntity(Guid gameId, DateTime notificationTime, BingoNotification notification) : base(gameId.ToString(), notificationTime.InvertedTicks())
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
                key = (ushort)Key,
                type = (NotificationType)Type,
                playerId = PlayerId,
            };
        }

        public Guid GameId { get; set; }

        public DateTime NotificationTime { get; set; }

        public Int32 Key { get; set; }

        public Int32 Type { get; set; }

        public string PlayerId { get; set; }

    }
}
