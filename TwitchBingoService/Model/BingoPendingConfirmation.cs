using ProtoBuf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoPendingConfirmation
    {
        public Guid gameId { get; set; }

        public ushort entryKey { get; set; }

        public DateTime confirmationCutoff { get; set; }

        public required string confirmedBy { get; set; }
    }
}
