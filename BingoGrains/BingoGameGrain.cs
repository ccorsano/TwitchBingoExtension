using BingoGrainInterfaces;
using BingoGrainInterfaces.Model;
using BingoServices.Configuration;
using BingoServices.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Orleans;
using Orleans.Runtime;
using Orleans.Streams;

namespace BingoGrains
{
    public class BingoGameGrain : Grain, IBingoGameGrain
    {
        private readonly IPersistentState<BingoGameState> _game;
        private readonly TwitchEBSService _ebsService;
        private readonly BingoServiceOptions _options;
        private readonly ILogger _logger;
        private IAsyncStream<BingoNotification> _notificationStream;

        public BingoGameGrain(
            [PersistentState("game", "gameStore")] IPersistentState<BingoGameState> grainState,
            TwitchEBSService ebsService,
            IOptions<BingoServiceOptions> options,
            ILogger<BingoGameGrain> logger)
        {
            _game = grainState;
            _ebsService = ebsService;
            _options = options.Value;
            _logger = logger;
        }

        public override Task OnActivateAsync()
        {
            var streamProvider = GetStreamProvider(Constants.NotificationsProvider);
            _notificationStream = streamProvider.GetStream<BingoNotification>(this.GetPrimaryKey(), Constants.GameNotificationsNamespace);
            _notificationStream.SubscribeAsync((notification,token) => OnBingoNotification(notification));
            return base.OnActivateAsync();
        }

        private async Task OnBingoNotification(BingoNotification notification)
        {
            if (_game.State.GameState == null)
            {
                return;
            }

            switch (notification.type)
            {
                case NotificationType.CompletedRow:
                    
                    break;
                case NotificationType.CompletedColumn:
                    break;
                case NotificationType.CompletedGrid:
                    break;
                case NotificationType.Confirmation:
                    break;
                case NotificationType.Missed:
                    break;
                case NotificationType.Start:
                    break;
                case NotificationType.Tentative:
                    if (!_game.State.PendingTentatives.Any(t => t.Key == notification.key))
                    {
                        _game.State.PendingTentatives.Add(new BingoTentative
                        {
                            Key = notification.key,
                            playerId = notification.playerId ?? "",
                            TentativeTime = notification.notificationTime,
                        });
                        var tasks = new List<Task>();
                        tasks.Add(_game.WriteStateAsync());
                        _logger.LogWarning($"Sending tentative notification to {string.Join(",", _game.State.Moderators.Values)}");
                        tasks.Add(_ebsService.TryWhisperJson(_game.State.GameState.channelId, _game.State.Moderators.Keys.ToArray(),
                            new
                            {
                                type = "tentative",
                                payload = new
                                {
                                    gameId = this.GetPrimaryKey(),
                                    key = notification.key,
                                    tentativeTime = new DateTimeOffset(notification.notificationTime),
                                }
                            }
                        ));
                        await Task.WhenAll(tasks);
                    }
                    break;
                default:
                    break;
            }

        }

        public async Task<BingoEntry> Confirm(ushort key, string opaqueId)
        {
            if(_game.State.GameState == null)
            {
                throw new InvalidOperationException($"Game is not available");
            }
            var bingoEntry = _game.State.GameState.entries.First(e => e.key == key);
            if (bingoEntry == null)
            {
                throw new ArgumentOutOfRangeException($"Unknown key {key}");
            }

            if (! _game.State.Moderators.ContainsKey(opaqueId))
            {
                throw new ArgumentOutOfRangeException($"Unknown moderator, can't confirm");
            }

            bingoEntry.confirmedAt = DateTime.UtcNow;
            bingoEntry.confirmedBy = _game.State.Moderators[opaqueId];

            await _notificationStream.OnNextAsync(new BingoNotification
            {
                type = NotificationType.Confirmation,
                key = key,
                notificationTime = (DateTime) bingoEntry.confirmedAt,
                playerId = bingoEntry.confirmedBy,
            });

            var confirmNotification = new
            {
                type = "confirm",
                payload = new
                {
                    gameId = _game.State.GameState.gameId,
                    key = key,
                    confirmationTime = bingoEntry.confirmedAt,
                    confirmedBy = bingoEntry.confirmedBy,
                }
            };
            var channelId = new string(_game.State.GameState.channelId);
            var delay = _game.State.GameState.confirmationThreshold;
            var externalTask = Task.Run(async () =>
            {
                await Task.Delay(delay);
                await _ebsService.BroadcastJson(channelId, System.Text.Json.JsonSerializer.Serialize(confirmNotification));
            });

            _game.State.LogEntries.Add(new BingoLogEntry
            {
                gameId = this.GetPrimaryKey(),
                key = key,
                timestamp = bingoEntry.confirmedAt.Value,
                type = NotificationType.Confirmation,
                playersCount = 1,
                playerNames = new string[] { bingoEntry.confirmedBy }
            });

            await Task.WhenAll(
                _game.WriteStateAsync()
                //_storage.QueueNotification(gameId, key, new BingoNotification
                //{
                //    key = key,
                //    playerId = userId,
                //    type = NotificationType.Confirmation
                //}),
            );

            var tasks = new List<Task>();
            if (_game.State.Moderators?.Any() ?? false)
            {
                var gameId = this.GetPrimaryKey().ToString();
                var moderators = _game.State.Moderators.Keys.ToArray();
                _logger.LogWarning($"Sending confirmation notification to {string.Join(",", _game.State.Moderators.Values)}");
                externalTask = Task.Run(() => _ebsService.TryWhisperJson(channelId, moderators, confirmNotification));
            }

            return bingoEntry;
        }

        public async Task<BingoGame> CreateGame(string channelId, BingoGameCreationParams creationParams)
        {
            _game.State.GameState = new BingoGame
            {
                channelId = channelId,
                rows = creationParams.rows,
                columns = creationParams.columns,
                entries = creationParams.entries,
                confirmationThreshold = creationParams.confirmationThreshold ?? _options.DefaultConfirmationThreshold,
                gameId = this.GetPrimaryKey(),
                hasChatIntegration = creationParams.enableChatIntegration,
                moderators = new List<string>(),
            };
            _game.State.LogEntries = new List<BingoLogEntry>{
                new BingoLogEntry
                {
                    gameId = this.GetPrimaryKey(),
                    key = 0,
                    type = NotificationType.Start,
                    playerNames = new string[0],
                    playersCount = 0,
                    timestamp = DateTime.UtcNow,
                }
            };
            await _game.WriteStateAsync();
            return _game.State.GameState;
        }

        public Task DeleteGame()
        {
            _game.State.IsDeleted = true;
            return Task.CompletedTask;
        }

        public Task<BingoGame?> GetGame()
        {
            return Task.FromResult(_game.State.GameState);
        }

        public Task<BingoScore[]> GetLeaderboard()
        {
            return Task.FromResult(_game.State.Leaderboard?.Scores?.ToArray() ?? new BingoScore[0]);
        }

        public Task<BingoLogEntry[]> GetLog()
        {
            return Task.FromResult(_game.State.LogEntries.ToArray());
        }

        public Task HandleNotifications(ushort key)
        {
            throw new NotImplementedException();
        }

        public Task RegisterModerator(string moderatorOpaqueId, string userName)
        {
            _game.State.Moderators.TryAdd(moderatorOpaqueId, userName);
            return Task.CompletedTask;
        }
    }
}