using BingoGrainInterfaces;
using BingoServices.Services;
using Force.Crc32;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Orleans;
using Orleans.Runtime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Troschuetz.Random.Generators;

namespace BingoGrains
{
    public class BingoGridGrain : Grain, IBingoGridGrain
    {
        private readonly IPersistentState<BingoGridState> _grid;
        private readonly TwitchEBSService _twitchEBSService;
        private readonly ILogger _logger;
        private Guid _gameId;
        private string _playerId;

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public BingoGridGrain(
            [PersistentState("grid", "gameStore")] IPersistentState<BingoGridState> grid,
            TwitchEBSService ebsService,
            ILogger<BingoGridGrain> logger)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
            _grid = grid;
            _twitchEBSService = ebsService;
            _logger = logger;
        }

        public async Task SetOpaqueId(string opaqueId)
        {
            _grid.State.userOpaqueId = opaqueId;
            if (_grid.State.userDisplayName == null)
            {
                _grid.State.userDisplayName = await _twitchEBSService.GetUserDisplayName(_playerId);
            }
        }

        public override Task OnActivateAsync()
        {
            var keySegments = this.GetPrimaryKeyString().Split(":");
            _gameId = Guid.Parse(keySegments[0]);
            _playerId = keySegments[1];

            return base.OnActivateAsync();
        }

        public async Task<BingoGrid> GetGrid()
        {
            var gameGrain = GrainFactory.GetGrain<IBingoGameGrain>(_gameId);
            var game = await gameGrain.GetGame();
            if (game == null)
                throw new InvalidOperationException($"Invalid game {_gameId}");

            GenerateGrid(game);

            return new BingoGrid
            {
                gameId = _gameId,
                playerId = _playerId,
                rows = game.rows,
                cols = game.columns,
                cells = _grid.State.cells.ToArray(),
                completedCols = _grid.State.completedCols,
                completedRows = _grid.State.completedRows,
                isCompleted = _grid.State.isCompleted,
            };
        }

        private void GenerateGrid(BingoGame game)
        {
            var seed = Crc32Algorithm.Compute(Encoding.UTF8.GetBytes(_playerId)) ^ Crc32Algorithm.Compute(_gameId.ToByteArray());
            var random = new ALFGenerator(seed);

            _logger.LogWarning("Generating grid for game {gameId}, player {playerId} (seed: {seed}, random: {random})", _gameId, _playerId, seed, random);

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
                        cell.key = (ushort)(ushort.MaxValue - (y * game.columns + x + 100));
                        cell.state = BingoCellState.Idle;
                    }
                    else
                    {
                        var index = random.Next(0, drawSet.Count);
                        var entry = drawSet[index];
                        drawSet.RemoveAt(index);
                        var tentative = _grid.State.tentatives.FirstOrDefault(t => t.Key == entry.key);

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
            for (ushort idx = 0; idx < game.rows; ++idx)
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

            _grid.State.cols = game.columns;
            _grid.State.rows = game.rows;
            _grid.State.cells = cells.ToArray();
            _grid.State.completedRows = completedRows.ToArray();
            _grid.State.completedCols = completedCols.ToArray();
            _grid.State.isCompleted = isGridCompleted;
        }

        private BingoCellState GetCellState(BingoEntry gameEntry, BingoTentative? tentative, TimeSpan threshold)
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

        public async Task<BingoTentative> AddTentative(ushort key)
        {
            var tentative = new BingoTentative
            {
                Key = key,
                TentativeTime = DateTime.UtcNow,
            };
            _grid.State.tentatives.Add(tentative);
            await _grid.WriteStateAsync();

            return new BingoTentative
            {
                playerId = _playerId,
                Key = key,
                TentativeTime = tentative.TentativeTime,
                Confirmed = false,
            };
        }
    }
}
