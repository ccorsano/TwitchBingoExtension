using BingoGrainInterfaces;
using BingoGrainInterfaces.Model;
using BingoServices.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Orleans;
using System;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Controllers
{
    [Route("/game")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class GameController : Controller
    {
        private readonly IClusterClient _orleansClient;
        private readonly TwitchEBSService _twitterEBSService;
        private readonly ILogger _logger;

        public GameController(
            IClusterClient orleansClient,
            TwitchEBSService twitchEBSService,
            ILogger<GameController> logger)
        {
            _orleansClient = orleansClient;
            _twitterEBSService = twitchEBSService;
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
                var gameGrain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
                await gameGrain.RegisterModerator(opaqueId, await _twitterEBSService.GetUserDisplayName(userId));
            }
            var gridKey = IBingoGridGrain.PrimaryKey(gameId, userId);
            var gridGrain = _orleansClient.GetGrain<IBingoGridGrain>(gridKey);
            await gridGrain.SetOpaqueId(opaqueId);
            return await gridGrain.GetGrid();
        }

        [HttpPost("{gameId}/{key}/tentative")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "viewer,broadcaster,moderator")]
        public async Task<BingoTentative> PostTentative(Guid gameId, ushort key)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
            if (userId == null)
            {
                throw new ArgumentOutOfRangeException("Missing user id");
            }
            var grain = _orleansClient.GetGrain<IBingoGridGrain>(IBingoGridGrain.PrimaryKey(gameId, userId));
            return await grain.AddTentative(key);
        }

        [HttpPost("{gameId}/{key}/confirm")]
        [ProducesDefaultResponseType(typeof(BingoGame))]
        [ProducesErrorResponseType(typeof(APIError))]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<IActionResult> PostConfirmation(Guid gameId, ushort key)
        {
            var grain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
            try
            {
                var opaqueId = User.Claims.First(c => c.Type == "opaque_user_id").Value;
                return new ObjectResult(await grain.Confirm(key, opaqueId));
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
                var gameGrain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
                await gameGrain.HandleNotifications(key);
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
            var grain = _orleansClient.GetGrain<IBingoGameGrain>(gameId);
            return grain.GetLog();

        }
    }
}
