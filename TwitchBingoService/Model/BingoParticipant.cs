using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Model
{
    public class BingoParticipant
    {
        public string participantId { get; set; }
        public BingoTentative[] tentatives { get; set; }
    }
}
