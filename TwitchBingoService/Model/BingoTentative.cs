using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoTentative
    {
        public string entryKey { get; set; }
        public bool confirmed { get; set; }
        public DateTimeOffset tentativeTime { get; set; }
    }
}
