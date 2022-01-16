using BingoGrainInterfaces.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrains
{
    public class BingoGridState
    {
        public string? userDisplayName { get; set; }
        public string? userOpaqueId { get; set; }
        public ushort rows { get; set; }
        public ushort cols { get; set; }
        public BingoGridCell[] cells { get; set; } = new BingoGridCell[0];
        public List<BingoTentative> tentatives { get; set; } = new List<BingoTentative>();
        public bool isCompleted { get; set; }
        public ushort[] completedRows { get; set; } = new ushort[0];
        public ushort[] completedCols { get; set; } = new ushort[0];
        public TimeSpan confirmationThreshold { get; set; }
    }
}
