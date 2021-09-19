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
        private ConcurrentDictionary<string, BingoTentative[]> PendingTentatives = new ConcurrentDictionary<string, BingoTentative[]>();
        private ConcurrentDictionary<string, BingoTentative[]> Tentatives = new ConcurrentDictionary<string, BingoTentative[]>();
        private ConcurrentDictionary<string, ConcurrentQueue<BingoNotification>> Notifications = new ConcurrentDictionary<string, ConcurrentQueue<BingoNotification>>();
        private ConcurrentDictionary<string, string> UserNames = new ConcurrentDictionary<string, string>();
        private ConcurrentDictionary<Guid, List<BingoLogEntry>> Logs = new ConcurrentDictionary<Guid, List<BingoLogEntry>>();

        public string GetTentativeKey(Guid gameId, string playerId) => $"{gameId}:{playerId}";
        public string GetPendingTentativeKey(Guid gameId, ushort key) => $"{gameId}:{key}";
        public string GetNotificationKey(Guid gameId, ushort key) => $"{gameId}:{key}";

        public Task<BingoGame> ReadGame(Guid gameId)
        {
            if (Store.TryGetValue(gameId, out BingoGame value))
            {
                return Task.FromResult(value);
            }

            return Task.FromResult<BingoGame>(null);
        }

        public Task DeleteGame(Guid gameId)
        {
            if (Store.TryRemove(gameId, out var deletedGame))
            {
                foreach(var entry in deletedGame.entries)
                {
                    if (PendingTentatives.TryRemove(GetPendingTentativeKey(gameId, entry.key), out var pendingTentatives))
                    {
                        foreach(var tentative in pendingTentatives)
                        {
                            Tentatives.TryRemove(GetTentativeKey(gameId, tentative.playerId), out var _);
                        }
                    }
                    if (Notifications.TryRemove(GetNotificationKey(gameId, entry.key), out var notifications))
                    {
                        foreach (var notification in notifications)
                        {
                            Tentatives.TryRemove(GetTentativeKey(gameId, notification.playerId), out var _);
                        }
                    }
                }
            }
            return Task.CompletedTask;
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

        public Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key)
        {
            var pendingKey = GetPendingTentativeKey(gameId, key);
            var tentatives = PendingTentatives.GetOrAdd(pendingKey, new BingoTentative[0]);

            PendingTentatives.GetValueOrDefault(pendingKey);

            return Task.FromResult(tentatives.ToArray());
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
            PendingTentatives.AddOrUpdate(GetPendingTentativeKey(gameId, tentative.entryKey), new BingoTentative[] { tentative }, (key, existing) =>
                existing.Where(e => tentative.entryKey != e.entryKey).Concat(new BingoTentative[] { tentative }).ToArray()
            );
            Tentatives.AddOrUpdate(GetTentativeKey(gameId, tentative.playerId), new BingoTentative[] { tentative }, (key, existing) =>
                existing.Where(e => tentative.entryKey != e.entryKey).Concat(new BingoTentative[] { tentative }).ToArray()
            );

            return Task.CompletedTask;
        }

        public Task QueueNotification(Guid gameId, ushort key, BingoNotification notification)
        {
            var queue = Notifications.GetOrAdd(GetNotificationKey(gameId, key), key => new ConcurrentQueue<BingoNotification>());
            queue.Enqueue(notification);
            return Task.CompletedTask;
        }

        public Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key)
        {
            if (!Notifications.Remove(GetNotificationKey(gameId, key), out ConcurrentQueue<BingoNotification> queue))
            {
                return Task.FromResult(new BingoNotification[0]);
            }

            var notifs = new List<BingoNotification>();
            while(queue.TryDequeue(out BingoNotification notif))
            {
                notifs.Add(notif);
            }
            return Task.FromResult(notifs.ToArray());
        }

        public Task<string> ReadUserName(string userId)
        {
            if (UserNames.TryGetValue(userId, out string userName))
            {
                return Task.FromResult(userName);
            }
            return Task.FromResult<string>(null);
        }

        public Task WriteUserName(string userId, string userName)
        {
            UserNames.AddOrUpdate(userId, userName, (key, oldValue) => userName);
            return Task.CompletedTask;
        }

        public Task WriteLog(Guid gameid, BingoLogEntry entry)
        {
            var log = Logs.GetOrAdd(gameid, new List<BingoLogEntry>());
            log.Add(entry);
            return Task.CompletedTask;
        }

        public Task<BingoLogEntry[]> ReadLog(Guid gameId)
        {
            var log = Logs.GetOrAdd(gameId, new List<BingoLogEntry>());
            return Task.FromResult(log.ToArray());
        }
    }
}
