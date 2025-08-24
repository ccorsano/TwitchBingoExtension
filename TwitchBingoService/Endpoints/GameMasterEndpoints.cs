using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using TwitchBingoService.Model;
using TwitchBingoService.Services;

namespace TwitchBingoService.Endpoints
{
    public static class GameMasterEndpoints
    {
        public static void MapGameMasterEndpoints(this WebApplication app)
        {
            app.MapPost("/game", (
                HttpRequest request,
                [FromServices] BingoService gameService,
                [FromBody] BingoGameCreationParams gameParams) =>
            {
                var channelClaim = request.HttpContext.User.Claims.First(c => c.Type == "channel_id");
                return gameService.CreateGame(channelClaim.Value, gameParams);
            }).RequireAuthorization("gamemaster");

            app.MapDelete("/game/{gameId}", (
                HttpRequest request,
                [FromServices] BingoService gameService,
                Guid gameId
                ) =>
            {
                return gameService.DeleteGame(gameId);
            }).RequireAuthorization("gamemaster");
        }
    }
}
