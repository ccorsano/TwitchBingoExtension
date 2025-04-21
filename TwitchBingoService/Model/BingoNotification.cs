using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public enum NotificationType
    {
        CompletedRow = 0,
        CompletedColumn = 1,
        CompletedGrid = 2,
        Confirmation = 3,
        Missed = 4,
        Start = 5,
    }

    public class BingoNotification
    {
        public ushort key { get; set; }

        public NotificationType type { get; set; }

        public string playerId { get; set; }
    }
}
