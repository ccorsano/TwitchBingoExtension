using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BingoServices.Configuration
{
    public class AzureStorageOptions
    {
        public string? ConnectionString { get; set; }
        public string Prefix { get; set; } = "bingo";
    }
}
