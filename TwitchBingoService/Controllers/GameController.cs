using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;
using TwitchBingoService.Storage;

namespace TwitchBingoService.Controllers
{
    [Route("/game")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class GameController : Controller
    {
        private readonly IGameStorage _storage;
        private readonly ILogger _logger;

        public GameController(IGameStorage storage, ILogger<GameController> logger)
        {
            _storage = storage;
            _logger = logger;
        }

        [HttpPost("")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<BingoGame> PostGame([FromBody] BingoGameCreationParams gameParams)
        {
            var game = new BingoGame
            {
                gameId = Guid.NewGuid(),
                entries = gameParams.entries,
                rows = gameParams.rows,
                columns = gameParams.columns,
            };

            await _storage.WriteGame(game);

            return game;
        }


        [HttpGet("{gameId}/grid")]
        public async Task<BingoGrid> GetGrid(Guid gameId)
        {
            var game = await _storage.ReadGame(gameId);
            var seed = User.Identity.Name.GetHashCode() ^ gameId.GetHashCode();
            var random = new Random(seed);

            var cells = new List<BingoGridCell>();
            var drawSet = game.entries.ToList();
            for(ushort x = 0; x < game.columns; ++x)
            {
                for (ushort y = 0; y < game.rows; ++y)
                {
                    var index = random.Next(0, drawSet.Count);
                    var entry = new BingoGridCell
                    {
                        row = y,
                        col = x,
                        key = drawSet[index].key
                    };
                }
            }

            return new BingoGrid
            {
                cells = cells.ToArray()
            };
        }

        [HttpPost("{gameId}/{key}/tentative")]
        public async Task<BingoTentative> PostTentativeAsync(Guid gameId, ushort key)
        {
            var game = await _storage.ReadGame(gameId);
            var entry = game.entries.First(e => e.key == key);

            var tentatives = await _storage.ReadTentatives(gameId, User.Identity.Name);
            tentatives = tentatives.Concat(new BingoTentative[]
            {
                new BingoTentative
                {
                    confirmed = false,
                    entryKey = key,
                    tentativeTime = DateTimeOffset.UtcNow,
                }
            }).ToArray();
            await _storage.WriteTentatives(gameId, User.Identity.Name, tentatives);

            return tentatives.Last();
        }

        [HttpPost("{gameId}/{key}/confirm")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<BingoEntry> PostConfirmationAsync(Guid gameId, ushort key)
        {
            var game = await _storage.ReadGame(gameId);
            var entry = game.entries.First(e => e.key == key);

            throw new NotImplementedException();
        }
    }
}
