using Conceptoire.Twitch.API;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using System.Web;
using TwitchAchievementTrackerBackend.Configuration;

namespace TwitchBingoService.Services
{
    public class TwitchEBSService
    {
        static readonly DateTimeOffset EPOCH = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
        private readonly ITwitchAPIClient _apiClient;
        private readonly TwitchOptions _options;
        private readonly ILogger _logger;
        private HttpClient _twitchExtensionClient;
        private SigningCredentials _jwtSigningCredentials;

        public TwitchEBSService(IHttpClientFactory httpClientFactory, ITwitchAPIClient apiClient, IOptions<TwitchOptions> options, ILogger<TwitchEBSService> logger)
        {
            _options = options.Value;
            _logger = logger;
            _twitchExtensionClient = httpClientFactory.CreateClient("twitchExt");
            _twitchExtensionClient.BaseAddress = new Uri("https://api.twitch.tv/helix/extensions/");
            _twitchExtensionClient.DefaultRequestHeaders.Add("client-id", _options.ExtensionId);
            _apiClient = apiClient;

            var securityKey = new SymmetricSecurityKey(Convert.FromBase64String(_options.ExtensionSecret!));
            _jwtSigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        }

        public async Task<HelixChannelInfo> GetChannelInfo(string channelId)
        {
            return await _apiClient.GetChannelInfoAsync(channelId, CancellationToken.None);
        }

        public string GetUserJWTToken(string userId, string channelId, string role)
        {
            var iat = DateTimeOffset.UtcNow - EPOCH;

            var token = new JwtSecurityToken(null, null, null, null, DateTime.UtcNow.AddDays(1), _jwtSigningCredentials);
            token.Payload["channel_id"] = channelId;
            token.Payload["role"] = role;
            token.Payload["opaque_user_id"] = userId;
            token.Payload["iat"] = (int) iat.TotalSeconds;
            token.Payload["pubsub_perms"] = new Dictionary<string, string[]>
            {
                { "listen", new string[] { "broadcast", "global" } }
            };

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GetJWTToken(string channelId)
        {
            var exp = DateTimeOffset.UtcNow - EPOCH;

            var token = new JwtSecurityToken(null, null, null, null, DateTime.UtcNow.AddDays(1), _jwtSigningCredentials);
            token.Payload["user_id"] = channelId;
            token.Payload["channel_id"] = channelId;
            token.Payload["role"] = "external";
            token.Payload["pubsub_perms"] = new Dictionary<string, string[]>
            {
                { "send", new string[] { "broadcast", "whisper-*" } }
            };

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GetChatJWTToken(string channelId)
        {
            var exp = DateTimeOffset.UtcNow - EPOCH;

            var token = new JwtSecurityToken(null, null, null, null, DateTime.UtcNow.AddHours(1), _jwtSigningCredentials);
            token.Payload["user_id"] = channelId;
            token.Payload["channel_id"] = channelId;
            token.Payload["role"] = "external";

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public Task<bool> TryWhisperJson<TPayloadType>(string channelId, string[] userIds, TPayloadType payload, JsonTypeInfo<TPayloadType> jsonTypeInfo)
        {
            // https://discord.com/channels/504015559252377601/523676096277905419/776561330110857236
            var jsonPayload = JsonSerializer.Serialize(payload, jsonTypeInfo);
            return TryWhisperJson(channelId, userIds, jsonPayload);
        }

        public Task<bool> TryWhisperJson(string channelId, string[] userIds, string jsonPayload)
        {
            return BroadcastExtensionJson(channelId, userIds.Select(t => "whisper-" + t).ToArray(), jsonPayload, false);
        }

        public Task BroadcastJson(string channelId, string jsonPayload)
        {
            return BroadcastExtensionJson(channelId, new string[] { "broadcast" }, jsonPayload, true);
        }

        public async Task<bool> BroadcastExtensionJson(string channelId, string[] targets, string jsonPayload, bool throwOnError)
        {
            var token = GetJWTToken(channelId);
            ExtensionPubSubMessage requestBody = new ("application/json", jsonPayload, targets, channelId);
            var content = new StringContent(JsonSerializer.Serialize(requestBody, EBSSerializerContext.Default.ExtensionPubSubMessage), Encoding.UTF8, "application/json");
            var message = new HttpRequestMessage(HttpMethod.Post, "pubsub");
            message.Content = content;
            message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var response = await _twitchExtensionClient.SendAsync(message);
            if (! response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<TwitchExtError>(await response.Content.ReadAsByteArrayAsync(), EBSSerializerContext.Default.TwitchExtError);
                _logger.LogError($"Could not broadcast message: {error?.error} - {error?.message} ({error?.status})");
            }
            if (throwOnError)
            {
                response.EnsureSuccessStatusCode();
            }
            return response.IsSuccessStatusCode;
        }

        private async Task<bool> SendChatMessageInternal(string channelId, string message, string version, bool throwOnError)
        {
            if (message.Length > 280)
            {
                throw new ArgumentOutOfRangeException("message", "Chat message must be 280 characters max");
            }
            _logger.LogInformation("Sending chat message for {channelId}: {message}", channelId, message);

            var token = GetChatJWTToken(channelId);
            ExtensionChatPayload payload = new (message, _options.ExtensionId!, version);
            var content = new StringContent(JsonSerializer.Serialize(payload, EBSSerializerContext.Default.ExtensionChatPayload), Encoding.UTF8, "application/json");
            var httpMessage = new HttpRequestMessage(HttpMethod.Post, $"https://api.twitch.tv/helix/extensions/chat?broadcaster_id={HttpUtility.UrlEncode(channelId)}");

            httpMessage.Content = content;
            httpMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            httpMessage.Headers.Add("Client-Id", _options.ExtensionId);
            var response = await _twitchExtensionClient.SendAsync(httpMessage);
            if (!response.IsSuccessStatusCode)
            {
                TwitchExtError? error = JsonSerializer.Deserialize(await response.Content.ReadAsByteArrayAsync(), EBSSerializerContext.Default.TwitchExtError);
                _logger.LogError($"Could not send chat message: {error?.error} - {error?.message} ({error?.status})");
            }
            return response.IsSuccessStatusCode;
        }

        public async Task SendChatMessage(string channelId, string message, string version)
        {
            await SendChatMessageInternal(channelId, message, version, throwOnError: true);
        }

        public Task<bool> TrySendChatMessage(string channelId, string message, string version)
        {
            return SendChatMessageInternal(channelId, message, version, throwOnError: false);
        }

        public async Task<string> GetUserDisplayName(string userId)
        {
            return (await _apiClient.GetUsersByIdAsync([userId])).FirstOrDefault()?.DisplayName ?? "Anonymous";
        }

        public async Task<string?> GetExtensionConfigurationBroadcasterSegment(string channelId)
        {
            var token = GetChatJWTToken(channelId);

            var httpMessage = new HttpRequestMessage(HttpMethod.Get, $"https://api.twitch.tv/helix/extensions/configurations?extension_id={_options.ExtensionId}&segment=broadcaster&broadcaster_id={channelId}");
            httpMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            httpMessage.Headers.Add("Client-Id", _options.ExtensionId);
            var response = await _twitchExtensionClient.SendAsync(httpMessage);
            response.EnsureSuccessStatusCode();
            ExtensionSegmentResponse? configurationResponse = await response.Content.ReadFromJsonAsync(EBSSerializerContext.Default.ExtensionSegmentResponse);

            return configurationResponse?.data?.FirstOrDefault()?.content;
        }

        public async Task SetExtensionConfigurationBroadcasterSegment(string channelId, string content)
        {
            var token = GetChatJWTToken(channelId);

            var httpMessage = new HttpRequestMessage(HttpMethod.Put, $"https://api.twitch.tv/helix/extensions/configurations?extension_id={_options.ExtensionId}&segment=broadcaster&broadcaster_id={channelId}");
            httpMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            httpMessage.Headers.Add("Client-Id", _options.ExtensionId);
            var response = await _twitchExtensionClient.SendAsync(httpMessage);
            response.EnsureSuccessStatusCode();
        }

    }

    public class TwitchExtError
    {
        public required string error { get; set; }
        public int status { get; set; }
        public required string message { get; set; }
    }

    record ExtensionPubSubMessage(string content_type, string message, string[] targets, string broadcaster_id);
    record ExtensionChatPayload(string text, string extension_id, string extension_version);
    record ExtensionConfigSegment(string segment, string broadcaster_id, string content, string version);
    record ExtensionSegmentResponse(ExtensionConfigSegment[] data);
    record ExtensionSegmentUpdate(string extension_id, string segment, string broadcaster_id, string version, string content);


    [JsonSerializable(typeof(ExtensionChatPayload))]
    [JsonSerializable(typeof(ExtensionPubSubMessage))]
    [JsonSerializable(typeof(ExtensionSegmentResponse))]
    [JsonSerializable(typeof(TwitchExtError))]
    internal partial class EBSSerializerContext : JsonSerializerContext { }
}
