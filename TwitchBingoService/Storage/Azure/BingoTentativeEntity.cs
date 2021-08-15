using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoTentativeEntity : TableEntity
    {
        public static string TentativePartitionKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";
        public static string TentativePartitionKey(Guid gameId, ushort entryKey) => $"{gameId}:{entryKey.ToString("00000")}";

        public BingoTentativeEntity()
        {

        }

        public BingoTentativeEntity(Guid gameId, string playerId, BingoTentative tentative) : base(TentativePartitionKey(gameId, playerId), tentative.entryKey.ToString("00000"))
        {
            GameId = gameId;
            PlayerId = tentative.playerId;
            EntryKey = tentative.entryKey;
            Confirmed = tentative.confirmed;
            TentativeTime = tentative.tentativeTime;
        }

        public BingoTentativeEntity(Guid gameId, ushort entryKey, BingoTentative tentative) : base(TentativePartitionKey(gameId, entryKey), tentative.playerId)
        {
            GameId = gameId;
            PlayerId = tentative.playerId;
            EntryKey = tentative.entryKey;
            Confirmed = tentative.confirmed;
            TentativeTime = tentative.tentativeTime;
        }

        public BingoTentative ToTentative()
        {
            return new BingoTentative
            {
                playerId = PlayerId,
                entryKey = EntryKey,
                confirmed = Confirmed,
                tentativeTime = TentativeTime,
            };
        }

        public Guid GameId { get; set; }

        public string PlayerId { get; set; }

        public ushort EntryKey { get; set; }

        public bool Confirmed { get; set; }

        public DateTime TentativeTime { get; set; }
    }
}
