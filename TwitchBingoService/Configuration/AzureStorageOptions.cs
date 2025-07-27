using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Configuration
{
    public class AzureStorageOptions
    {
        public required string ConnectionString { get; set; }
        public string Prefix { get; set; } = "bingo";
    }
}
