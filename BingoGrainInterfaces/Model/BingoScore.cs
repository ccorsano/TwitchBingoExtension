using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrainInterfaces.Model
{
    public record BingoScore : IComparable<BingoScore>
    {
        public uint Rank { get; set; }
        public uint Score { get; set; }
        public string PlayerId { get; set; } = null!;

        public int CompareTo(BingoScore? other) => Score.CompareTo(other?.Score ?? 0);
    }
}
