﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Configuration
{
    public class BingoServiceOptions
    {
        public TimeSpan DefaultConfirmationThreshold { get; set; } = TimeSpan.FromMinutes(2);
        public string Version { get; set; } = "2025.01";
        public bool EnableChatBot { get; set; } = false;
    }
}
