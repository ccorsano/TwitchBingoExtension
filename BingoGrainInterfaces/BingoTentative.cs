using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrain.Model
{
    public class BingoTentative
    {
        public int Key { get; set; }
        public DateTime TentativeTime { get; set; }
        public bool Confirmed { get; set; }
    }
}
