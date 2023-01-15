using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoLogEntry
    {
        public Guid gameId { get; set; }
        public ushort key { get; set; }
        public NotificationType type { get; set; }
        public int playersCount { get; set; }
        public string[] playerNames { get; set; }
        public DateTime timestamp { get; set; }
    }
}
