using System.Text.Json.Serialization;

namespace TwitchBingoService.Model
{
    [JsonSerializable(typeof(BingoEntry))]
    [JsonSerializable(typeof(BingoGame))]
    [JsonSerializable(typeof(BingoGameCreationParams))]
    [JsonSerializable(typeof(BingoGrid))]
    [JsonSerializable(typeof(BingoGridCell))]
    [JsonSerializable(typeof(BingoLogEntry))]
    [JsonSerializable(typeof(BingoNotification))]
    [JsonSerializable(typeof(BingoParticipant))]
    [JsonSerializable(typeof(BingoPendingConfirmation))]
    [JsonSerializable(typeof(BingoTentative))]
    [JsonSerializable(typeof(NotificationType))]
    internal partial class JsonContext : JsonSerializerContext
    {
    }
}
