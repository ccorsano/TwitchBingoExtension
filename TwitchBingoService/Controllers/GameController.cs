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
            var channelClaim = User.Claims.First(c => c.Type == "channel_id");
            return _gameService.CreateGame(channelClaim.Value, gameParams);
        }

        [HttpGet("{gameId}/grid")]
        public async Task<BingoGrid> GetGrid(Guid gameId)
        {
            if (User.IsInRole("moderator") || User.IsInRole("broadcaster"))
            {
                var opaqueId = User.Claims.First(c => c.Type == "opaque_user_id").Value;
                await _gameService.RegisterModerator(gameId, opaqueId);
            }
            return await _gameService.GetGrid(gameId, User.Identity.Name);
        }

        [HttpPost("{gameId}/{key}/tentative")]
        public Task<BingoTentative> PostTentative(Guid gameId, ushort key)
        {
            var opaqueId = User.Claims.First(c => c.Type == "opaque_user_id").Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value ?? opaqueId;
            return _gameService.AddTentative(gameId, key, userId);
        }

        [HttpPost("{gameId}/{key}/confirm")]
        [ProducesDefaultResponseType(typeof(BingoGame))]
        [ProducesErrorResponseType(typeof(APIError))]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<IActionResult> PostConfirmation(Guid gameId, ushort key)
        {
            try
            {
                return new ObjectResult(await _gameService.Confirm(gameId, key, User.Identity.Name));
            }
            catch(InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error in confirmation of game {gameId} for key {key} by player {playerName}", gameId, key, User.Identity.Name);
                return new ConflictObjectResult(new APIError
                {
                    Error = ex.Message
                });
            }
        }
    }
}
