using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchBingoService.Model;

namespace TwitchBingoService.Storage.Azure
{
    public class BingoGameEntity : TableEntity
    {
        public BingoGameEntity()
        {

        }

        public BingoGameEntity(BingoGame game) : base(game.gameId.ToString(), "")
        {
            ChannelId = game.channelId;
            Game = game;
        }

        public override void ReadEntity(IDictionary<string, EntityProperty> properties, OperationContext operationContext)
        {
            base.ReadEntity(properties, operationContext);
            if (!string.IsNullOrEmpty(SerializedGame))
            {
                Game = System.Text.Json.JsonSerializer.Deserialize<BingoGame>(SerializedGame);
            }
            if (Game != null && !string.IsNullOrEmpty(SerializedModerators))
            {
                Game.moderators = System.Text.Json.JsonSerializer.Deserialize<string[]>(SerializedModerators);
            }
        }

        public override IDictionary<string, EntityProperty> WriteEntity(OperationContext operationContext)
        {
            SerializedGame = System.Text.Json.JsonSerializer.Serialize(Game);
            SerializedModerators = System.Text.Json.JsonSerializer.Serialize(Game.moderators);
            return base.WriteEntity(operationContext);
        }

        public string ChannelId { get; set; }
        public string SerializedGame { get; set; }
        public string SerializedModerators { get; set; }
        public BingoGame Game { get; set; }
    }
}
