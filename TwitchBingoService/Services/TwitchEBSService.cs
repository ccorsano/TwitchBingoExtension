using Conceptoire.Twitch.API;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Buffers.Text;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
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

            var securityKey = new SymmetricSecurityKey(Convert.FromBase64String(_options.ExtensionSecret));
            _jwtSigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        }

        public async Task<HelixChannelInfo> GetChannelInfo(string channelId)
        {
            return await _apiClient.GetChannelInfoAsync(channelId, CancellationToken.None);
        }

        public class TwitchExtError
        {
            public string error { get; set; }
            public int status { get; set; }
            public string message { get; set; }
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

        public Task<bool> TryWhisperJson(string channelId, string[] userIds, object payload)
        {
            // https://discord.com/channels/504015559252377601/523676096277905419/776561330110857236
            var jsonPayload = JsonSerializer.Serialize(payload);
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

        public async Task BroadcastJson(string channelId, object payload)
        {
            var contentStr = JsonSerializer.Serialize(payload);
            await BroadcastJson(channelId, contentStr);
        }

        public async Task<bool> BroadcastExtensionJson(string channelId, string[] targets, string jsonPayload, bool throwOnError)
        {
            var token = GetJWTToken(channelId);
            var requestBody = new
            {
                content_type = "application/json",
                message = jsonPayload,
                target = targets,
                broadcaster_id = channelId
            };
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var message = new HttpRequestMessage(HttpMethod.Post, "pubsub");
            message.Content = content;
            message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var response = await _twitchExtensionClient.SendAsync(message);
            if (! response.IsSuccessStatusCode)
            {
                var error  = JsonSerializer.Deserialize<TwitchExtError>(await response.Content.ReadAsByteArrayAsync());
                _logger.LogError($"Could not broadcast message: {error.error} - {error.message} ({error.status})");
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
            var payload = new
            {
                text = message,
                extension_id = _options.ExtensionId,
                extension_version = version,
            };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var httpMessage = new HttpRequestMessage(HttpMethod.Post, $"https://api.twitch.tv/helix/extensions/chat?broadcaster_id={HttpUtility.UrlEncode(channelId)}");

            httpMessage.Content = content;
            httpMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            httpMessage.Headers.Add("Client-Id", _options.ExtensionId);
            var response = await _twitchExtensionClient.SendAsync(httpMessage);
            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<TwitchExtError>(await response.Content.ReadAsByteArrayAsync());
                _logger.LogError($"Could not send chat message: {error.error} - {error.message} ({error.status})");
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
            return (await _apiClient.GetUsersByIdAsync(new string[] { userId })).FirstOrDefault()?.DisplayName;
        }
    }
}
