using BingoGrainInterfaces;
using ProtoBuf;

namespace TwitchBingoService.Model
{
    [ProtoContract]
    public class BingoParticipant
    {
        [ProtoMember(1)]
        public string participantId { get; set; }

        [ProtoMember(2)]
        public BingoTentative[] tentatives { get; set; }
    }
}
