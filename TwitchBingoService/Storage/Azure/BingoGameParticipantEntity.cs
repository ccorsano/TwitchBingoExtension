using Azure;
using Azure.Data.Tables;
using System;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoGameParticipantEntity : ITableEntity
    {
        public BingoGameParticipantEntity()
        {

        }

        public BingoGameParticipantEntity(string userId, Guid gameId, string channelId)
        {
            UserId = userId;
            GameId = gameId;
            ChannelId = channelId;
        }

        public string PartitionKey {
            get => UserId;
            set
            {
                UserId = value;
            }
        }
        public string RowKey { get; set; } = string.Empty;
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public string UserId { get; set; }
        public Guid GameId { get; set; }
        public string ChannelId { get; set; }
    }
}
