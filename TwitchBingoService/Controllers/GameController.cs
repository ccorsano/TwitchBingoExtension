using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Controllers
{
    [Route("/game")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class GameController : Controller
    {
        [HttpPost("")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public Task<BingoGame> PostGame([FromBody] BingoGameCreationParams gameParams)
        {
            var game = new BingoGame
            {
                gameId = Guid.NewGuid(),
                entries = gameParams.entries,
                rows = gameParams.rows,
                columns = gameParams.columns,
            };

            return Task.FromResult(game);
        }

        [HttpPost("{gameId}/{key}/tentative")]
        public async Task<BingoTentative> PostTentativeAsync(string gameId, string key)
        {
            throw new NotImplementedException();
        }

        [HttpPost("{gameId}/{key}/confirm")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "broadcaster,moderator")]
        public async Task<BingoEntry> PostConfirmationAsync(string gameId, string key)
        {
            throw new NotImplementedException();
        }
    }
}
