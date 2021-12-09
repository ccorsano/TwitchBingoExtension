namespace BingoGrain.Configuration
{
    public class BingoServiceOptions
    {
        public TimeSpan DefaultConfirmationThreshold { get; set; } = TimeSpan.FromMinutes(2);
        public string Version { get; set; } = "0.0.1";
        public bool EnableChatBot { get; set; } = false;
    }
}
