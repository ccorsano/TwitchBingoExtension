﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    public class BingoLeaderboard
    {
        public SortedSet<BingoScore> Scores { get; set; } = new SortedSet<BingoScore>();
    }
}