﻿using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoLogEntity : TableEntity
    {
        public BingoLogEntity()
        {

        }

        public BingoLogEntity(Guid gameId, BingoLogEntry log) : base(gameId.ToString(), log.timestamp.InvertedTicks())
        {
            GameId = gameId;
            NotificationTime = log.timestamp;
            Key = log.key;
            Type = (byte)log.type;
            PlayersCount = log.playersCount;
            PlayersNames = JsonSerializer.Serialize(log.playerNames);
        }

        public BingoLogEntry ToLogEntry()
        {
            return new BingoLogEntry
            {
                gameId = GameId,
                timestamp = NotificationTime,
                key = (ushort)Key,
                type = (NotificationType)Type,
                playersCount = PlayersCount,
                playerNames = JsonSerializer.Deserialize<string[]>(PlayersNames),
            };
        }

        public Guid GameId { get; set; }

        public DateTime NotificationTime { get; set; }

        public Int32 Key { get; set; }

        public Int32 Type { get; set; }

        public Int32 PlayersCount { get; set; }

        public string PlayersNames { get; set; }
    }
}