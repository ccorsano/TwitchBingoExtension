using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System;
using System.Buffers;
using System.IO;
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

        private string GetGameKey(Guid gameId) => $"game:{gameId}";
        private string GetTentativeKey(Guid gameId, string playerId) => $"game:{gameId}:{playerId}";

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
            var buffer = ArrayPool<byte>.Shared.Rent(512);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, bingoGame);
                stream.Flush();
                await db.StringSetAsync(GetGameKey(bingoGame.gameId), new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position));
            }
        }

        public async Task WriteTentatives(Guid gameId, string playerId, BingoTentative[] tentatives)
        {
            _logger.LogInformation("Save bingo game {gameId} tentatives for player.", gameId, playerId);

            var db = _connection.GetDatabase();
            var buffer = ArrayPool<byte>.Shared.Rent(512);
            using (var stream = new MemoryStream(buffer))
            {
                ProtoBuf.Serializer.Serialize(stream, tentatives);
                stream.Flush();
                await db.StringSetAsync(GetTentativeKey(gameId, playerId), new ReadOnlyMemory<byte>(buffer).Slice(0, (int)stream.Position));
            }
        }

        public async Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId)
        {
            _logger.LogInformation("Read bingo game {gameId} tentatives for player {playerId}", gameId, playerId);

            var db = _connection.GetDatabase();
            var result = await db.StringGetAsync(GetGameKey(gameId));
            if (!result.HasValue)
            {
                _logger.LogError("Bingo game {gameId} tentatives not found for player {playerId}", gameId, playerId);
                return null;
            }
            var data = (ReadOnlyMemory<byte>)result;
            return ProtoBuf.Serializer.Deserialize<BingoTentative[]>(data);
        }
    }
}
