using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Storage.Azure
{
    public static class Utils
    {
        public static string InvertedTicks(this DateTime dateTime) => string.Format("{0:D19}", DateTime.MaxValue.Ticks - dateTime.Ticks);
    }
}
