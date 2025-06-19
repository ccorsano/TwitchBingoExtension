namespace TwitchBingoService.Model
{
    public record TwitchConfigurationResponse(TwitchConfigurationSegment[] data);

    public record TwitchConfigurationSegment(
        string segment,
        string broadcaster_id,
        string content,
        string version
    );
}
