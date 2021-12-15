using BingoGrain.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrain
{
    public class BingoGameState
    {
        public bool IsDeleted { get; set; } = false;
        public BingoGame? GameState { get; set; }
        public BingoLeaderboard? Leaderboard { get; set; }
    }
}
