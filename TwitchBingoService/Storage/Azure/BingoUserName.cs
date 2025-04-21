using Azure;
using Azure.Data.Tables;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoUserName : ITableEntity
    {
        public BingoUserName()
        {

        }

        public BingoUserName(string userId, string userName)
        {
            PartitionKey = userId;
            UserName = userName;
        }

        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        public string UserName { get; set; }
    }
}
