using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage
{
    public class InMemoryGameStore : IGameStorage
    {
        private ConcurrentDictionary<Guid, BingoGame> Store = new ConcurrentDictionary<Guid, BingoGame>();
        private ConcurrentDictionary<Guid, BingoTentative[]> PendingTentatives = new ConcurrentDictionary<Guid, BingoTentative[]>();
        private ConcurrentDictionary<string, BingoTentative[]> Tentatives = new ConcurrentDictionary<string, BingoTentative[]>();

        public string GetTentativeKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";

        public Task<BingoGame> ReadGame(Guid gameId)
        {
            if (Store.TryGetValue(gameId, out BingoGame value))
            {
                return Task.FromResult(value);
            }

            return Task.FromResult<BingoGame>(null);
        }

        public Task<BingoTentative[]> ReadGameState(Guid gameId, string playerId)
        {
            if (Tentatives.TryGetValue(GetTentativeKey(gameId, playerId), out BingoTentative[] bingoTentative))
            {
                return Task.FromResult(bingoTentative);
            }
            return Task.FromResult<BingoTentative[]>(null);
        }

        public Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId)
        {
            if (Tentatives.TryGetValue(GetTentativeKey(gameId, playerId), out BingoTentative[] tentatives))
            {
                return Task.FromResult(tentatives);
            }
            return Task.FromResult(new BingoTentative[0]);
        }

        public Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key, DateTime cutoff)
        {
            var tentatives = PendingTentatives.GetOrAdd(gameId, new BingoTentative[0]);

            var requeue = tentatives.Where(t => t.tentativeTime < cutoff && t.entryKey != key).ToList();
            PendingTentatives.AddOrUpdate(gameId, requeue.ToArray(), (k, a) => requeue.ToArray());

            return Task.FromResult(tentatives.Where(t => t.tentativeTime < cutoff && t.entryKey == key).ToArray());
        }

        public Task WriteGame(BingoGame bingoGame)
        {
            Store.AddOrUpdate(bingoGame.gameId, bingoGame, (_, _) => bingoGame);
            return Task.CompletedTask;
        }

        public Task WriteGameState(Guid gameId, string playerId, BingoTentative[] tentative)
        {
            Tentatives.AddOrUpdate(GetTentativeKey(gameId, playerId), tentative, (_, _) => tentative);
            return Task.CompletedTask;
        }

        public Task WriteTentative(Guid gameId, BingoTentative tentative)
        {
            PendingTentatives.AddOrUpdate(gameId, new BingoTentative[] { tentative }, (key, existing) =>
                existing.Where(e => tentative.entryKey != e.entryKey).Concat(new BingoTentative[] { tentative }).ToArray()
            );
            Tentatives.AddOrUpdate(GetTentativeKey(gameId, tentative.playerId), new BingoTentative[] { tentative }, (key, existing) =>
                existing.Where(e => tentative.entryKey != e.entryKey).Concat(new BingoTentative[] { tentative }).ToArray()
            );

            return Task.CompletedTask;
        }
    }
}
