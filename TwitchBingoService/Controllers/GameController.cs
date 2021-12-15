using BingoGrain;
using BingoGrain.Model;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Orleans;
using System;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;
using TwitchBingoService.Services;

namespace TwitchBingoService.Controllers
{
    [Route("/game")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class GameController : Controller
    {
        private readonly BingoService _gameService;
        private readonly IClusterClient _orleansClient;
        private readonly ILogger _logger;

        public GameController(BingoService gameService, IClusterClient orleansClient, ILogger<GameController> logger)
        {
            _gameService = gameService;
            _orleansClient = orleansClient;
            _logger = logger;
        }

        [HttpPost("")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<BingoGame> PostGame([FromBody] BingoGameCreationParams gameParams)
        {
            var channelClaim = User.Claims.First(c => c.Type == "channel_id");
            var gameId = Guid.NewGuid();
            var grain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
            return await grain.CreateGame(channelClaim.Value, gameParams); ;
        }

        [HttpDelete("{gameId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task DeleteGame(Guid gameId)
        {
            var grain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
            return grain.DeleteGame();
        }

        [HttpGet("{gameId}")]
        public Task<BingoGame> GetGame(Guid gameId)
        {
            var grain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
            return grain.GetGame();
        }

        [HttpGet("{gameId}/grid")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "viewer,broadcaster,moderator")]
        public async Task<BingoGrid> GetGrid(Guid gameId)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
            if (userId == null)
            {
                throw new ArgumentOutOfRangeException("Missing user id");
            }
            var opaqueId = User.Claims.First(c => c.Type == "opaque_user_id").Value;
            if (User.IsInRole("moderator") || User.IsInRole("broadcaster"))
            {
                await _gameService.RegisterModerator(gameId, opaqueId);
            }
            var userTask = _gameService.RegisterPlayer(userId);
            var grain = _orleansClient.GetGrain<IBingoGridGrain>(IBingoGridGrain.PrimaryKey(gameId, userId));
            return await grain.GetGrid();
        }

        [HttpPost("{gameId}/{key}/tentative")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "viewer,broadcaster,moderator")]
        public Task<BingoTentative> PostTentative(Guid gameId, ushort key)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
            if (userId == null)
            {
                throw new ArgumentOutOfRangeException("Missing user id");
            }
            var grain = _orleansClient.GetGrain<IBingoGridGrain>(IBingoGridGrain.PrimaryKey(gameId, userId));
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

        [HttpPost("{gameId}/{key}/notify")]
        [ProducesErrorResponseType(typeof(APIError))]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<IActionResult> PostNotify(Guid gameId, ushort key)
        {
            try
            {
                await _gameService.HandleNotifications(gameId, key);
                return new EmptyResult();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error triggering notifications for game {gameId} for key {key} by moderator {playerName}", gameId, key, User.Identity.Name);
                return new ConflictObjectResult(new APIError
                {
                    Error = ex.Message
                });
            }
        }

        [HttpGet("{gameId}/log")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task<BingoLogEntry[]> GetGameLog(Guid gameId)
        {
            return _gameService.GetGameLog(gameId);
        }
    }
}
