using BingoGrainInterfaces;
using BingoServices.Configuration;
using BingoServices.Services;
using Conceptoire.Twitch.IRC;
using Force.Crc32;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Troschuetz.Random.Generators;
using TwitchBingoService.Storage;

namespace TwitchBingoService.Services
{
    public class BingoService
    {
        private readonly IGameStorage _storage;
        private readonly TwitchEBSService _ebsService;
        private readonly BingoServiceOptions _options;
        private readonly ITwitchChatClientBuilder _chatBuilder;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger _logger;

        public BingoService(IGameStorage gameStorage, TwitchEBSService ebsService, ITwitchChatClientBuilder chatBuilder, IMemoryCache memoryCache, IOptions<BingoServiceOptions> options, ILogger<BingoService> logger)
        {
            _storage = gameStorage;
            _ebsService = ebsService;
            _chatBuilder = chatBuilder;
            _memoryCache = memoryCache;
            _options = options.Value;
            _logger = logger;
        }

        private async Task<ITwitchChatClient> ConnectBot(string channelId, CancellationToken cancelationToken)
        {
            var channelName = await _memoryCache.GetOrCreateAsync<string>($"channelname:{channelId}", async (entry) =>
            {
                return (await _ebsService.GetChannelInfo(channelId)).BroadcasterName;
            });
            return await _memoryCache.GetOrCreateAsync<ITwitchChatClient>($"chatclient:{channelId}", async (entry) =>
            {
                entry.SetSlidingExpiration(TimeSpan.FromHours(1));

                var chatClient = _chatBuilder.Build();
                await chatClient.ConnectAsync(cancelationToken);
                await chatClient.JoinAsync(channelName.ToLowerInvariant(), cancelationToken);
                return chatClient;
            });
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
                confirmationThreshold = gameParams.confirmationThreshold ?? _options.DefaultConfirmationThreshold,
                hasChatIntegration = gameParams.enableChatIntegration,
            };

            await _storage.WriteGame(game);

            var tasks = new List<Task>();
            if (game.hasChatIntegration)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var chatBot = await ConnectBot(channelId, CancellationToken.None);
                    await chatBot.SendMessageAsync(new OutgoingMessage { Message = "Bingo game started !" }, CancellationToken.None);
                }));
            }
            tasks.Add(_storage.WriteLog(game.gameId, new BingoLogEntry
            {
                gameId = game.gameId,
                key = 0,
                type = NotificationType.Start,
                playerNames = new string[0],
                playersCount = 0,
                timestamp = DateTime.UtcNow,
            }));

            await Task.WhenAll(tasks);

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

            game.moderators = game.moderators?.Append(opaqueId)?.ToList() ?? new List<string> { opaqueId };

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
                    var isInValidationWindow = tentative.TentativeTime > validationWindowStart && tentative.TentativeTime < validationWindowEnd;
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
                    var validationWindowEnd = tentative.TentativeTime.Add(threshold);
                    return validationWindowEnd > DateTime.UtcNow ? BingoCellState.Pending : BingoCellState.Rejected;
                }
            }
        }

        public async Task<BingoGrid> GetGrid(Guid gameId, string playerId)
        {
            var game = await _storage.ReadGame(gameId);
            return await GetGrid(game, playerId);
        }

        private async Task<BingoGrid> GetGrid(BingoGame game, string playerId)
        {
            var gameId = game.gameId;
            var seed = Crc32Algorithm.Compute(Encoding.UTF8.GetBytes(playerId)) ^ Crc32Algorithm.Compute(gameId.ToByteArray());
            var random = new ALFGenerator(seed);

            _logger.LogWarning("Generating grid for game {gameId}, player {playerId} (seed: {seed}, random: {random})", gameId, playerId, seed, random);

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
                        var tentative = user.FirstOrDefault(t => t.Key == entry.key);

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
                Confirmed = false,
                Key = key,
                TentativeTime = DateTime.UtcNow,
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
            entry.confirmedBy = await _ebsService.GetUserDisplayName(userId);

            await Task.WhenAll(
                _storage.WriteGame(game),
                _storage.QueueNotification(gameId, key, new BingoNotification
                {
                    key = key,
                    playerId = userId,
                    type = NotificationType.Confirmation
                }),
                _storage.WriteLog(game.gameId, new BingoLogEntry
                {
                    gameId = game.gameId,
                    key = key,
                    timestamp = entry.confirmedAt.Value,
                    type = NotificationType.Confirmation,
                    playersCount = 1,
                    playerNames = new string[] { entry.confirmedBy }
                })
            );

            var tasks = new List<Task>();
            if (game.moderators?.Any() ?? false)
            {
                _logger.LogWarning($"Sending confirmation notification to {string.Join(",", game.moderators)}");
                tasks.Add(_ebsService.TryWhisperJson(game.channelId, game.moderators.ToArray(),
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
                ));
            }

            tasks.Add(ProcessTentatives(game, key));
            await Task.WhenAll(tasks);

            return entry;
        }

        private async Task ProcessTentatives(BingoGame game, ushort key)
        {
            var entry = game.entries.FirstOrDefault(e => e.key == key);
            if (entry == null)
            {
                throw new ArgumentOutOfRangeException("key");
            }
            var deletionCutoff = entry.confirmedAt?.Add(-game.confirmationThreshold) ?? DateTime.MinValue;
            var tentatives = await _storage.ReadPendingTentatives(game.gameId, key, deletionCutoff);

            var earliestTentatives = from t in tentatives
                       group t by t.playerId into perPlayer
                       select new BingoTentative
                       {
                           playerId = perPlayer.Key,
                           TentativeTime = perPlayer.Min(t => t.TentativeTime),
                           Key = perPlayer.First().Key,
                           Confirmed = perPlayer.Max(t => t.Confirmed)
                       };

            foreach (var tentative in earliestTentatives)
            {
                await ProcessTentative(game, tentative, entry);
            }
        }

        private async Task ProcessTentative(BingoGame game, BingoTentative tentative, BingoEntry entry)
        {
            var grid = await GetGrid(game, tentative.playerId);

            BingoCellState state = GetCellState(entry, tentative, game.confirmationThreshold);
            if (state == BingoCellState.Missed || state == BingoCellState.Rejected)
            {
                return;
            }

            var deletionCutoff = tentative.TentativeTime.Add(-game.confirmationThreshold);
            var tentatives = await _storage.ReadPendingTentatives(game.gameId, tentative.Key, deletionCutoff);

            var tasks = new List<Task>();

            Task moderationTask = Task.CompletedTask;
            if (tentatives.Length == 1 && (game.moderators?.Count ?? 0) > 0)
            {
                _logger.LogWarning($"Sending tentative notification to {string.Join(",", game.moderators)}");
                tasks.Add(_ebsService.TryWhisperJson(game.channelId, game.moderators.ToArray(),
                    new
                    {
                        type = "tentative",
                        payload = new
                        {
                            gameId = game.gameId,
                            key = tentative.Key,
                            tentativeTime = new DateTimeOffset(tentatives.FirstOrDefault()?.TentativeTime ?? tentative.TentativeTime),
                        }
                    }
                ));
            }

            if (state == BingoCellState.Confirmed)
            {
                var cell = grid.cells.First(c => c.key == tentative.Key);
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
                    tasks.Add(_storage.QueueNotification(game.gameId, tentative.Key, notification));
                }
            }

            await Task.WhenAll(tasks);
        }

        public async Task HandleNotifications(Guid gameId, ushort key)
        {
            // Fetch notifications queue
            var notifications = await _storage.UnqueueNotifications(gameId, key);

            if (notifications.Length == 0)
            {
                _logger.LogWarning("No notifications to handle");
                return;
            }

            // Fetch current game state
            _logger.LogInformation("Pushing notification for {gameId}, entry {key}", gameId, key);
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }

            // Retrieve entry from game
            var confirmedEntry = game.entries.First(e => e.key == key);

            var tasks = new List<Task>();

            // Send confirm notification first
            if (notifications.Any(n => n.type == NotificationType.Confirmation))
            {

                tasks.Add(_ebsService.BroadcastJson(game.channelId, System.Text.Json.JsonSerializer.Serialize(new
                {
                    type = "confirm",
                    payload = new
                    {
                        gameId = gameId,
                        key = key,
                        confirmationTime = confirmedEntry.confirmedAt,
                        confirmedBy = confirmedEntry.confirmedBy,
                    }
                })));
            }

            // Process completion notifications
            var colComplete = Task.WhenAll(notifications.Where(n => n.type == NotificationType.CompletedColumn && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous")));
            var rowComplete = Task.WhenAll(notifications.Where(n => n.type == NotificationType.CompletedRow && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous")));
            var gridComplete = Task.WhenAll(notifications.Where(n => n.type == NotificationType.CompletedGrid && !string.IsNullOrEmpty(n.playerId))
                    .Select(n => _storage.ReadUserName(n.playerId).ContinueWith(t => t.Result ?? "Anonymous")));

            _logger.LogInformation("Notification game {gameId} key {key} completed cols: {colComplete}, rows: {rowComplete}, grid: {gridComplete}", gameId, key, string.Join(',', colComplete), string.Join(',', rowComplete), string.Join(',', gridComplete));
            tasks.Add(_ebsService.BroadcastJson(game.channelId, System.Text.Json.JsonSerializer.Serialize(new
            {
                type = "bingo",
                payload = new
                {
                    gameId = gameId,
                    key = key,
                    colComplete = (await colComplete),
                    rowComplete = (await rowComplete),
                    gridComplete = (await gridComplete),
                }
            })));
            if ((await colComplete).Length > 0)
            {
                tasks.Add(_storage.WriteLog(gameId, new BingoLogEntry
                {
                    gameId = gameId,
                    key = key,
                    type = NotificationType.CompletedColumn,
                    playerNames = await colComplete,
                    playersCount = (await colComplete).Length,
                    timestamp = DateTime.UtcNow,
                }));
            }
            if ((await rowComplete).Length > 0)
            {
                tasks.Add(_storage.WriteLog(gameId, new BingoLogEntry
                {
                    gameId = gameId,
                    key = key,
                    type = NotificationType.CompletedRow,
                    playerNames = await rowComplete,
                    playersCount = (await rowComplete).Length,
                    timestamp = DateTime.UtcNow,
                }));
            }
            if ((await gridComplete).Length > 0)
            {
                tasks.Add(_storage.WriteLog(gameId, new BingoLogEntry
                {
                    gameId = gameId,
                    key = key,
                    type = NotificationType.CompletedGrid,
                    playerNames = await gridComplete,
                    playersCount = (await gridComplete).Length,
                    timestamp = DateTime.UtcNow,
                }));
            }

            await Task.WhenAll(tasks);

            // Send chat messages
            if (!game.hasChatIntegration)
            {
                _logger.LogWarning("No chat integration for this game {gameId} on channel {channelId}, skipping.", game.gameId, game.channelId);
                return;
            }

            var confirmationMessage = $"✅ {game.entries.First(e => e.key == key).text}";
            await SendChatMessage(confirmationMessage, game.channelId);

            var messageBuilder = new StringBuilder(140, 280);
            if (gridComplete.Result.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", gridComplete.Result);
                var bingoStr = gridComplete.Result.Count() == 1 ? " has a bingo ! " : " have a bingo ! ";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(gridComplete.Result.Count());
                    messageBuilder.Append(gridComplete.Result.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }
            if (rowComplete.Result.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", rowComplete.Result);
                var bingoStr = rowComplete.Result.Count() == 1 ? " has completed a row ! " : " have completed a row ! ";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(rowComplete.Result.Count());
                    messageBuilder.Append(rowComplete.Result.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }
            if (colComplete.Result.Count() > 0 && messageBuilder.Length < 200)
            {
                var playerIds = string.Join(",", colComplete.Result);
                var bingoStr = colComplete.Result.Count() == 1 ? " has completed a column !" : " have completed a column !";
                if (playerIds.Length < (280 - messageBuilder.Length - bingoStr.Length))
                {
                    messageBuilder.Append(playerIds);
                }
                else
                {
                    messageBuilder.Append(colComplete.Result.Count());
                    messageBuilder.Append(colComplete.Result.Count() == 1 ? " player" : " players");
                }
                messageBuilder.Append(bingoStr);
            }

            if (messageBuilder.Length > 0)
            {
                await SendChatMessage(messageBuilder.ToString(), game.channelId);
            }
        }

        private async Task SendChatMessage(string message, string channelId)
        {
            await _ebsService.TrySendChatMessage(channelId, message, _options.Version);

            if (_options.EnableChatBot)
            {
                try
                {
                    var chatClient = await ConnectBot(channelId, CancellationToken.None);
                    await chatClient.SendMessageAsync(new OutgoingMessage
                    {
                        Message = message.ToString(),
                    }, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending chat message to channel {channelId} using bot account", channelId);
                }
            }
        }

        public async Task<BingoLogEntry[]> GetGameLog(Guid gameId)
        {
            return await _storage.ReadLog(gameId);
        }
    }
}
