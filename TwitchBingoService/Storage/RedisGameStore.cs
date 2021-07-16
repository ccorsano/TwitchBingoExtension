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
        private string GetUserKey(string userId) => $"bingo:username:{userId}";

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
                await Task.WhenAll(
                    db.StringSetAsync(GetGameKey(bingoGame.gameId), new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position)),
                    db.KeyExpireAsync(GetGameKey(bingoGame.gameId), TimeSpan.FromDays(7))
                );
            }
        }

        public async Task DeleteGame(Guid gameId)
        {
            _logger.LogInformation("Delete bingo game {gameId}", gameId);

            var game = await ReadGame(gameId);

            if (game != null)
            {
                var db = _connection.GetDatabase();
                await db.KeyDeleteAsync(GetGameKey(gameId));

                var deleteTentatives = game.entries.Select(entry => db.KeyDeleteAsync(GetPendingTentativeKey(game.gameId, entry.key)));
                var deleteNotifications = game.entries.Select(entry => db.KeyDeleteAsync(GetNotificationsKey(game.gameId, entry.key)));
                await Task.WhenAll(deleteTentatives);
                await Task.WhenAll(deleteNotifications);
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
                await Task.WhenAll(
                    db.ListRightPushAsync(GetPendingTentativeKey(gameId, tentative.entryKey), serializedTentative),
                    db.HashSetAsync(GetTentativeKey(gameId, tentative.playerId), (int) tentative.entryKey, serializedTentative),
                    db.KeyExpireAsync(GetPendingTentativeKey(gameId, tentative.entryKey), TimeSpan.FromDays(7)),
                    db.KeyExpireAsync(GetTentativeKey(gameId, tentative.playerId), TimeSpan.FromDays(7))
                );
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
            _logger.LogInformation($"Queue: {gameId}, {key}, {notification.playerId}");
            var db = _connection.GetDatabase();

            var buffer = ArrayPool<byte>.Shared.Rent(256);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, notification);
                stream.Flush();
                var serializedTentative = new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position);
                await Task.WhenAll(
                    db.ListRightPushAsync(GetNotificationsKey(gameId, key), serializedTentative),
                    db.KeyExpireAsync(GetNotificationsKey(gameId, key), TimeSpan.FromDays(7))
                );
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
                _logger.LogInformation($"Dequeue: {gameId}, {key}, {notifications.Last().playerId}");
            }
            while (notifRedisValue.HasValue);

            return notifications.ToArray();
        }

        public async Task<string> ReadUserName(string userId)
        {
            var db = _connection.GetDatabase();
            var userValue = await db.StringGetAsync(GetUserKey(userId));
            if (userValue.HasValue)
            {
                return userValue;
            }

            return null;
        }

        public async Task WriteUserName(string userId, string userName)
        {
            var db = _connection.GetDatabase();
            await db.StringSetAsync(GetUserKey(userId), userName, TimeSpan.FromDays(1));
        }
    }
}
