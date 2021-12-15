using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BingoGrain.Configuration
{
    public class TimeSpanConverter : JsonConverter<TimeSpan>
    {
        public override bool CanConvert(Type typeToConvert)
        {
            return typeToConvert == typeof(TimeSpan);
        }

        public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.String)
            {
                throw new FormatException("Unexpected JSON token for a TimeSpan value");
            }
            var timespan = reader.GetString();
#pragma warning disable CS8604 // Cannot be null if JsonTokenType == JsonTokenType.String
            return TimeSpan.ParseExact(timespan, "c", CultureInfo.InvariantCulture);
#pragma warning restore CS8604 // Cannot be null if JsonTokenType == JsonTokenType.String
        }

        public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("c", CultureInfo.InvariantCulture));
        }
    }
}
