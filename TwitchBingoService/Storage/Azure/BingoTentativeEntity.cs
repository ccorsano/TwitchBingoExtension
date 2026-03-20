using Azure;
using Azure.Data.Tables;
using System;
using System.Diagnostics.CodeAnalysis;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors | DynamicallyAccessedMemberTypes.PublicProperties)]
    public class BingoTentativeEntity : ITableEntity
    {
        public static string TentativePartitionKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";
        public static string TentativePartitionKey(Guid gameId, ushort entryKey) => $"{gameId}:{entryKey.ToString("00000")}";

        public BingoTentativeEntity() 
        {
            PartitionKey = string.Empty;
            RowKey = "00000";
            PlayerId = string.Empty;
        }

        public BingoTentativeEntity(Guid gameId, string playerId, BingoTentative tentative)
        {
            PartitionKey = TentativePartitionKey(gameId, playerId);
            RowKey = tentative.entryKey.ToString("00000");
            GameId = gameId;
            PlayerId = tentative.playerId;
            EntryKey = tentative.entryKey;
            Confirmed = tentative.confirmed;
            TentativeTime = tentative.tentativeTime;
        }

        public BingoTentativeEntity(Guid gameId, ushort entryKey, BingoTentative tentative)
        {
            PartitionKey = TentativePartitionKey(gameId, entryKey);
            RowKey = tentative.playerId;
            GameId = gameId;
            PlayerId = tentative.playerId;
            EntryKey = tentative.entryKey;
            Confirmed = tentative.confirmed;
            TentativeTime = tentative.tentativeTime;
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public BingoTentative ToTentative()
        {
            return new BingoTentative
            {
                playerId = PlayerId,
                entryKey = (ushort) EntryKey,
                confirmed = Confirmed,
                tentativeTime = TentativeTime,
            };
        }

        public Guid GameId { get; set; }

        public string PlayerId { get; set; }

        public Int32 EntryKey { get; set; }

        public bool Confirmed { get; set; }

        public DateTime TentativeTime { get; set; }

        public TableEntity ToEntity()
        {
            TableEntity entity = new TableEntity(PartitionKey, RowKey);
            entity.Add("GameId", GameId);
            entity.Add("PlayerId", PlayerId);
            entity.Add("EntryKey", EntryKey);
            entity.Add("Confirmed", Confirmed);
            entity.Add("TentativeTime", TentativeTime);

            return entity;
        }
    }
}
