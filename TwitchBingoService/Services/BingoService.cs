using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Storage;

namespace TwitchBingoService.Services
{
    public class BingoService
    {
        private readonly IGameStorage _storage;
        private readonly TwitchEBSService _ebsService;
        private readonly BingoServiceOptions _options;
        private readonly ILogger _logger;

        public BingoService(IGameStorage gameStorage, TwitchEBSService ebsService, IOptions<BingoServiceOptions> options, ILogger<BingoService> logger)
        {
            _storage = gameStorage;
            _ebsService = ebsService;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<BingoGame> CreateGame(string channelId, BingoGameCreationParams gameParams)
        {
            var game = new BingoGame
            {
                gameId = Guid.NewGuid(),
                channelId = channelId,
                entries = gameParams.entries,
                rows = gameParams.rows,
                columns = gameParams.columns,
                confirmationThreshold = _options.DefaultConfirmationThreshold,
            };

            await _storage.WriteGame(game);

            return game;
        }

        public async Task RegisterModerator(Guid gameId, string opaqueId)
        {
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }
            if (game?.moderators?.Contains(opaqueId) ?? false)
            {
                return;
            }

            game.moderators = game.moderators?.Append(opaqueId)?.ToArray() ?? new string[] { opaqueId };

            await _storage.WriteGame(game);

            _logger.LogWarning("Moderators in game {gameId} of channel {channelId}: {moderators}", game.gameId, game.channelId, string.Join(',', game.moderators));
        }

        public async Task<BingoGame> GetGame(Guid gameId)
        {
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }

            return game;
        }

        public async Task DeleteGame(Guid gameId)
        {
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }

            await _storage.DeleteGame(gameId);
        }

        public async Task RegisterPlayer(string userId)
        {
            var userName = await _storage.ReadUserName(userId);
            if (userName == null)
            {
                userName = await _ebsService.GetUserDisplayName(userId);
                await _storage.WriteUserName(userId, userName);
            }
        }

        private BingoCellState GetCellState(BingoEntry gameEntry, BingoTentative tentative, TimeSpan threshold)
        {
            // Entry has been confirmed
            if (gameEntry.confirmedAt.HasValue)
            {
                var validationWindowStart = gameEntry.confirmedAt.Value.Subtract(threshold);
                var validationWindowEnd = gameEntry.confirmedAt.Value.Add(threshold);
                // No tentative from player, if we are out of the confirmation window it is missed
                if (tentative == null)
                {
                    return validationWindowEnd > DateTime.UtcNow ? BingoCellState.Idle : BingoCellState.Missed;
                }
                // Tentative submitted, either it's in, or it's out, depending when it was submitted
                else
                {
                    var isInValidationWindow = tentative.tentativeTime > validationWindowStart && tentative.tentativeTime < validationWindowEnd;
                    return isInValidationWindow ? BingoCellState.Confirmed : BingoCellState.Rejected;
                }
            }
            // Entry hasn't been confirmed yet
            else
            {
                // No tentative: still in base state
                if (tentative == null)
                {
                    return BingoCellState.Idle;
                }
                // Else, we might be still in the validation window
                else
                {
                    var validationWindowEnd = tentative.tentativeTime.Add(threshold);
                    return validationWindowEnd > DateTime.UtcNow ? BingoCellState.Pending : BingoCellState.Rejected;
                }
            }
        }

        public async Task<BingoGrid> GetGrid(Guid gameId, string playerId)
        {
            var game = await _storage.ReadGame(gameId);
            var seed = playerId.GetHashCode() ^ gameId.GetHashCode();
            var random = new Random(seed);

            _logger.LogInformation("Generating grid for game {gameId}, player {playerId} (seed: {seed})", gameId, playerId, seed);

            var user = await _storage.ReadTentatives(gameId, playerId);

            var cells = new List<BingoGridCell>();
            var drawSet = game.entries.ToList();
            bool[] isRowCompleted = Enumerable.Range(0, game.rows).Select(x => true).ToArray();
            bool[] isColCompleted = Enumerable.Range(0, game.columns).Select(x => true).ToArray();
            bool isGridCompleted = true;

            for (ushort x = 0; x < game.columns; ++x)
            {
                for (ushort y = 0; y < game.rows; ++y)
                {
                    var cell = new BingoGridCell
                    {
                        row = y,
                        col = x,
                    };
                    if (drawSet.Count == 0)
                    {
                        cell.key = (ushort) (ushort.MaxValue - ((y * game.columns) + x + 100));
                        cell.state = BingoCellState.Idle;
                    }
                    else
                    {
                        var index = random.Next(0, drawSet.Count);
                        var entry = drawSet[index];
                        drawSet.RemoveAt(index);
                        var tentative = user.FirstOrDefault(t => t.entryKey == entry.key);

                        cell.key = entry.key;
                        cell.state = GetCellState(entry, tentative, game.confirmationThreshold);

                        isRowCompleted[y] &= cell.state == BingoCellState.Confirmed;
                        isColCompleted[x] &= cell.state == BingoCellState.Confirmed;
                        isGridCompleted &= cell.state == BingoCellState.Confirmed;
                    }
                    cells.Add(cell);
                }
            }

            var completedRows = new List<ushort>();
            for(ushort idx = 0; idx < game.rows; ++idx)
            {
                if (isRowCompleted[idx])
                {
                    completedRows.Add(idx);
                }
            }
            var completedCols = new List<ushort>();
            for (ushort idx = 0; idx < game.columns; ++idx)
            {
                if (isColCompleted[idx])
                {
                    completedCols.Add(idx);
                }
            }

            return new BingoGrid
            {
                gameId = game.gameId,
                playerId = playerId,
                rows = game.rows,
                cols = game.columns,
                cells = cells.ToArray(),
                completedCols = completedCols.ToArray(),
                completedRows = completedRows.ToArray(),
                isCompleted = isGridCompleted,
            };
        }

        public async Task<BingoTentative> AddTentative(Guid gameId, ushort key, string userId)
        {
            var game = await _storage.ReadGame(gameId);
            var entry = game.entries.First(e => e.key == key);

            var tentative = new BingoTentative
            {
                playerId = userId,
                confirmed = false,
                entryKey = key,
                tentativeTime = DateTime.UtcNow,
            };
            await _storage.WriteTentative(gameId, tentative);
            await ProcessTentative(game, tentative, entry);

            return tentative;
        }

        public async Task<BingoEntry> Confirm(Guid gameId, ushort key, string userId)
        {
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }

            var entry = game.entries.First(e => e.key == key);
            if (entry.confirmedAt != null)
            {
                // Signal conflict
                throw new InvalidOperationException("Entry already confirmed");
            }
            entry.confirmedAt = DateTime.UtcNow;
            entry.confirmedBy = userId;

            await _storage.WriteGame(game);

            if (game.moderators?.Any() ?? false)
            {
                _logger.LogWarning($"Sending confirmation notification to {string.Join(",", game.moderators)}");
                await _ebsService.TryWhisperJson(game.channelId, game.moderators,
                    new
                    {
                        type = "confirm",
                        payload = new
                        {
                            gameId = game.gameId,
                            key = key,
                            confirmationTime = new DateTimeOffset(entry.confirmedAt.Value),
                            confirmedBy = entry.confirmedBy,
                        }
                    }
                );
            }

            await ProcessTentatives(game, key);

            var notification = Task.Delay(game.confirmationThreshold).ContinueWith(async t =>
            {
                await HandleNotifications(gameId, key);
            });

            return entry;
        }

        private async Task ProcessTentatives(BingoGame game, ushort key)
        {
            var entry = game.entries.FirstOrDefault(e => e.key == key);
            if (entry == null)
            {
                throw new ArgumentOutOfRangeException("key");
            }
            var cutoff = entry.confirmedAt?.Add(game.confirmationThreshold) ?? DateTime.MaxValue;
            var tentatives = await _storage.ReadPendingTentatives(game.gameId, key);

            var earliestTentatives = from t in tentatives
                       group t by t.playerId into perPlayer
                       select new BingoTentative
                       {
                           playerId = perPlayer.Key,
                           tentativeTime = perPlayer.Min(t => t.tentativeTime),
                           entryKey = perPlayer.First().entryKey,
                           confirmed = perPlayer.Max(t => t.confirmed)
                       };

            foreach (var tentative in earliestTentatives)
            {
                await ProcessTentative(game, tentative, entry);
            }
        }

        private async Task ProcessTentative(BingoGame game, BingoTentative tentative, BingoEntry entry)
        {
            var grid = await GetGrid(game.gameId, tentative.playerId);

            BingoCellState state = GetCellState(entry, tentative, game.confirmationThreshold);
            if (state == BingoCellState.Missed || state == BingoCellState.Rejected)
            {
                return;
            }

            var cutoff = tentative.tentativeTime.Add(game.confirmationThreshold);
            var tentatives = await _storage.ReadPendingTentatives(game.gameId, tentative.entryKey);

            Task moderationTask = Task.CompletedTask;
            if (tentatives.Length == 1 && (game.moderators?.Any() ?? false))
            {
                _logger.LogWarning($"Sending tentative notification to {string.Join(",", game.moderators)}");
                await _ebsService.TryWhisperJson(game.channelId, game.moderators,
                    new
                    {
                        type = "tentative",
                        payload = new
                        {
                            gameId = game.gameId,
                            key = tentative.entryKey,
                            tentativeTime = new DateTimeOffset(tentatives.FirstOrDefault()?.tentativeTime ?? tentative.tentativeTime),
                        }
                    }
                );
            }

            if (state != BingoCellState.Confirmed)
            {
                return;
            }

            var cell = grid.cells.First(c => c.key == tentative.entryKey);
            var isRowConfirmed = grid.completedRows.Contains(cell.row);
            var isColConfirmed = grid.completedCols.Contains(cell.col);

            if (grid.isCompleted || isRowConfirmed || isColConfirmed)
            {
                var notification = new BingoNotification
                {
                    key = cell.key,
                    type = grid.isCompleted ? NotificationType.CompletedGrid : isRowConfirmed ? NotificationType.CompletedRow : NotificationType.CompletedColumn,
                    playerId = tentative.playerId,
                };
                await _storage.QueueNotification(game.gameId, tentative.entryKey, notification);
                return;
            }
        }

        private async Task HandleNotifications(Guid gameId, ushort key)
        {
            _logger.LogInformation("Pushing notification for {gameId}, entry {key}", gameId, key);
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }
            var notifications = await _storage.UnqueueNotifications(gameId, key);

            var colComplete = notifications.Where(n => n.type == NotificationType.CompletedColumn && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous"));
            var rowComplete = notifications.Where(n => n.type == NotificationType.CompletedRow && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous"));
            var gridComplete = notifications.Where(n => n.type == NotificationType.CompletedGrid && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous"));

            _logger.LogInformation("Notification game {gameId} key {key} completed cols: {colComplete}, rows: {rowComplete}, grid: {gridComplete}", gameId, key, string.Join(',', colComplete), string.Join(',', rowComplete), string.Join(',', gridComplete));
            await _ebsService.BroadcastJson(game.channelId, System.Text.Json.JsonSerializer.Serialize(new
            {
                type = "bingo",
                payload = new
                {
                    gameId = gameId,
                    key = key,
                    colComplete = (await Task.WhenAll(colComplete)),
                    rowComplete = (await Task.WhenAll(rowComplete)),
                    gridComplete = (await Task.WhenAll(gridComplete)),
                }
            }));

            var messageBuilder = new StringBuilder(140, 280);
            messageBuilder.Append($"{game.entries.First(e => e.key == key).text} confirmed !");
            if (gridComplete.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", gridComplete);
                var bingoStr = gridComplete.Count() == 1 ? " has a bingo !" : " have a bingo !";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(gridComplete.Count());
                    messageBuilder.Append(gridComplete.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }
            if (rowComplete.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", rowComplete);
                var bingoStr = gridComplete.Count() == 1 ? " has completed a row !" : " have completed a row !";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(rowComplete.Count());
                    messageBuilder.Append(gridComplete.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }
            if (colComplete.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", colComplete);
                var bingoStr = gridComplete.Count() == 1 ? " has completed a column !" : " have completed a column !";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(colComplete.Count());
                    messageBuilder.Append(gridComplete.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }

            await _ebsService.TrySendChatMessage(game.channelId, messageBuilder.ToString(), _options.Version);
        }

    }
}
