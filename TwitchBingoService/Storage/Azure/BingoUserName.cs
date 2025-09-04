using Azure;
using Azure.Data.Tables;
using System;
using System.Diagnostics.CodeAnalysis;

namespace TwitchBingoService.Storage.Azure
{
    [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors | DynamicallyAccessedMemberTypes.PublicProperties)]
    public class BingoUserName : ITableEntity
    {
        public BingoUserName()
        {
            PartitionKey = string.Empty;
            RowKey = string.Empty;
            UserName = string.Empty;
        }

        public BingoUserName(string userId, string userName)
        {
            PartitionKey = userId;
            UserName = userName;
            RowKey = "";
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        public string UserName { get; set; }
    }
}
