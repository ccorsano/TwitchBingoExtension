using Microsoft.Extensions.Options;

namespace TwitchBingoService.Configuration
{
    public class StaticOptions<TOptions> : IOptionsSnapshot<TOptions>
    where TOptions : class
    {
        private readonly TOptions _options;

        public StaticOptions(TOptions options)
        {
            _options = options;
        }

        public TOptions Value
        {
            get
            {
                return _options;
            }
        }

        public TOptions Get(string? name)
        {
            return _options;
        }
    }
}
