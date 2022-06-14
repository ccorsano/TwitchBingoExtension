
using Azure;
using Azure.Data.Tables;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoUserName : ITableEntity
    {
        public string PartitionKey { get ; set; }
        public string RowKey { get; set; } = "";
        
        [IgnoreDataMember]
        public string UserId
        {
            get { return PartitionKey; }
            set { PartitionKey = value.ToLowerInvariant(); }
        }

        public string UserName { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
    }
}
