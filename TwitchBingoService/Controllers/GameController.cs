using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;
using TwitchBingoService.Services;
using TwitchBingoService.Storage;

namespace TwitchBingoService.Controllers
{
    [Route("/game")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class GameController : Controller
    {
        private readonly BingoService _gameService;
        private readonly ILogger _logger;

        public GameController(BingoService gameService, ILogger<GameController> logger)
        {
            _gameService = gameService;
            _logger = logger;
        }

        [HttpPost("")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task<BingoGame> PostGame([FromBody] BingoGameCreationParams gameParams)
        {
            return _gameService.CreateGame(gameParams);
        }


        [HttpGet("{gameId}/grid")]
        public Task<BingoGrid> GetGrid(Guid gameId)
        {
            return _gameService.GetGrid(gameId, User.Identity.Name);
        }

        [HttpPost("{gameId}/{key}/tentative")]
        public Task<BingoTentative> PostTentative(Guid gameId, ushort key)
        {
            return _gameService.AddTentative(gameId, key, User.Identity.Name);
        }

        [HttpPost("{gameId}/{key}/confirm")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task<BingoEntry> PostConfirmation(Guid gameId, ushort key)
        {
            try
            {
                return _gameService.Confirm(gameId, key, User.Identity.Name);
            }
            catch(InvalidOperationException _)
            {
                Response.StatusCode = 409;
                throw;
            }
        }
    }
}
