using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System;
using System.Buffers;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage
{
    public class RedisGameStore : IGameStorage
    {
        private readonly IConnectionMultiplexer _connection;
        private readonly ILogger _logger;

        public RedisGameStore(IConnectionMultiplexer connectionMultiplexer, ILogger<RedisGameStore> logger)
        {
            _connection = connectionMultiplexer;
            _logger = logger;
        }

        private string GetGameKey(Guid gameId) => $"game:{gameId}:def";
        private string GetPendingTentativeKey(Guid gameId, ushort key) => $"game:{gameId}:{key}:pending";
        private string GetTentativeKey(Guid gameId, string playerId) => $"game:{gameId}:{playerId}:tentatives";
        private string GetNotificationsKey(Guid gameId, ushort key) => $"game:{gameId}:{key}:notifications";

        public async Task<BingoGame> ReadGame(Guid gameId)
        {
            _logger.LogInformation("Read bingo game {gameId}", gameId);

            var db = _connection.GetDatabase();
            var result = await db.StringGetAsync(GetGameKey(gameId));
            if (! result.HasValue)
            {
                _logger.LogError("Bingo game {gameId} not found", gameId);
                return null;
            }
            var data = (ReadOnlyMemory<byte>)result;
            return ProtoBuf.Serializer.Deserialize<BingoGame>(data);
        }

        public async Task WriteGame(BingoGame bingoGame)
        {
            _logger.LogInformation("Save bingo game {gameId}", bingoGame.gameId);

            var db = _connection.GetDatabase();
            var buffer = ArrayPool<byte>.Shared.Rent(4096);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, bingoGame);
                stream.Flush();
                await db.StringSetAsync(GetGameKey(bingoGame.gameId), new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position));
            }
        }

        public async Task WriteTentative(Guid gameId, BingoTentative tentative)
        {
            _logger.LogInformation("Save bingo game {gameId} tentatives for player.", gameId, tentative?.playerId);

            var db = _connection.GetDatabase();
            var buffer = ArrayPool<byte>.Shared.Rent(256);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, tentative);
                stream.Flush();
                var serializedTentative = new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position);
                await db.ListRightPushAsync(GetPendingTentativeKey(gameId, tentative.entryKey), serializedTentative);
                await db.HashSetAsync(GetTentativeKey(gameId, tentative.playerId), (int) tentative.entryKey, serializedTentative);
            }
        }

        public async Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key)
        {
            const long batchSize = 1;

            _logger.LogInformation("Read bingo game {gameId} tentatives for key {key}", gameId, key);

            var db = _connection.GetDatabase();
            var listKey = GetPendingTentativeKey(gameId, key);

            var tentatives = new List<BingoTentative>();
            var index = 0;
            RedisValue[] results = null;
            while(results == null || results?.Length == batchSize)
            {
                results = await db.ListRangeAsync(listKey, index, index + batchSize);
                tentatives.AddRange(results.Select(r => ProtoBuf.Serializer.Deserialize<BingoTentative>(r)));
                index += results.Length;
            }

            return tentatives.ToArray();
        }

        public async Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId)
        {
            _logger.LogInformation("Read bingo game {gameId} tentatives for player {playerId}", gameId, playerId);

            var db = _connection.GetDatabase();
            var result = await db.HashGetAllAsync(GetTentativeKey(gameId, playerId));

            var tentatives = new List<BingoTentative>();

            foreach(var entry in result)
            {
                if (!entry.Value.HasValue)
                {
                    continue;
                }
                var data = (ReadOnlyMemory<byte>)entry.Value;
                tentatives.Add(ProtoBuf.Serializer.Deserialize<BingoTentative>(data));
            }
            return tentatives.ToArray();
        }

        public async Task QueueNotification(Guid gameId, ushort key, BingoNotification notification)
        {
            var db = _connection.GetDatabase();

            var buffer = ArrayPool<byte>.Shared.Rent(256);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, notification);
                stream.Flush();
                var serializedTentative = new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position);
                await db.ListRightPushAsync(GetNotificationsKey(gameId, key), serializedTentative);
            }
        }

        public async Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key)
        {
            var db = _connection.GetDatabase();
            var notifications = new List<BingoNotification>();
            RedisValue notifRedisValue = default;
            do
            {
                notifRedisValue = await db.ListLeftPopAsync(GetNotificationsKey(gameId, key));
                var data = (ReadOnlyMemory<byte>)notifRedisValue;
                notifications.Add(ProtoBuf.Serializer.Deserialize<BingoNotification>(data));
            }
            while (notifRedisValue.HasValue);

            return notifications.ToArray();
        }
    }
}
