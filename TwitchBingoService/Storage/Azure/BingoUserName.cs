using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoUserName : TableEntity
    {
        public BingoUserName()
        {

        }

        public BingoUserName(string userId, string userName): base(userId, "")
        {
            UserName = userName;
        }

        public string UserName { get; set; }
    }
}
