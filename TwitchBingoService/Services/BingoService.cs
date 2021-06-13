using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Storage;

namespace TwitchBingoService.Services
{
    public class BingoService
    {
        private readonly IGameStorage _storage;
        private readonly BingoServiceOptions _options;
        private readonly ILogger _logger;

        public BingoService(IGameStorage gameStorage, IOptions<BingoServiceOptions> options, ILogger<BingoService> logger)
        {
            _storage = gameStorage;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<BingoGame> CreateGame(BingoGameCreationParams gameParams)
        {
            var game = new BingoGame
            {
                gameId = Guid.NewGuid(),
                entries = gameParams.entries,
                rows = gameParams.rows,
                columns = gameParams.columns,
                confirmationThreshold = _options.DefaultConfirmationThreshold,
            };

            await _storage.WriteGame(game);

            return game;
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

            var user = await _storage.ReadTentatives(gameId, playerId);

            var cells = new List<BingoGridCell>();
            var drawSet = game.entries.ToList();
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
                        cell.key = -(y * game.columns) - x - 100;
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
                    }
                    cells.Add(cell);
                }
            }

            return new BingoGrid
            {
                gameId = game.gameId,
                playerId = playerId,
                rows = game.rows,
                cols = game.columns,
                cells = cells.ToArray()
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

            return entry;
        }

        public async Task ProcessTentatives(Guid gameId, ushort key)
        {
            var game = await _storage.ReadGame(gameId);
            if (game == null)
            {
                throw new ArgumentOutOfRangeException("gameId");
            }
            var entry = game.entries.FirstOrDefault(e => e.key == key);
            if (entry == null)
            {
                throw new ArgumentOutOfRangeException("key");
            }
            var cutoff = entry.confirmedAt?.Add(game.confirmationThreshold) ?? DateTime.MaxValue;
            var tentatives = _storage.ReadPendingTentatives(game.gameId, key, cutoff);

        }

    }
}
