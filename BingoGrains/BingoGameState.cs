using BingoGrainInterfaces.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrains
{
    public class BingoGameState
    {
        public bool IsDeleted { get; set; } = false;
        public BingoGame? GameState { get; set; }
        public BingoLeaderboard? Leaderboard { get; set; }
        public List<BingoLogEntry> LogEntries { get; set; } = new List<BingoLogEntry>();
        public Dictionary<string, string> Moderators { get; set; } = new Dictionary<string, string>();
        public List<BingoTentative> PendingTentatives { get; set; } = new List<BingoTentative>();
        public Dictionary<ushort, List<BingoNotification>> PendingNotifications { get; set; } = new Dictionary<ushort, List<BingoNotification>>();
    }
}
