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

        [HttpDelete("{gameId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task DeleteGame(Guid gameId)
        {
            return _gameService.DeleteGame(gameId);
        }

        [HttpGet("{gameId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task<BingoGame> GetGame(Guid gameId)
        {
            var channelClaim = User.Claims.First(c => c.Type == "channel_id");
            return _gameService.GetGame(gameId);
        }

        [HttpGet("{gameId}/grid")]
        public async Task<BingoGrid> GetGrid(Guid gameId)
        {
            var opaqueId = User.Claims.First(c => c.Type == "opaque_user_id").Value;
            if (User.IsInRole("moderator") || User.IsInRole("broadcaster"))
            {
                await _gameService.RegisterModerator(gameId, opaqueId);
            }
            var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
            if (userId != null)
            {
                var userTask = _gameService.RegisterPlayer(userId);
            }
            return await _gameService.GetGrid(gameId, userId ?? opaqueId);
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
