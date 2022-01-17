using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BingoServices.Services;
using NBomber.Plugins.Http;
using NBomber.Plugins.Http.CSharp;

namespace BingoBomber
{
    public class BingoRequestBuilder
    {
        private readonly TwitchEBSService _twitchEBSService;
        private string? _channelId;
        private string _role;
        private string _opaqueId;
        private string? _userId;
        private string? _targetMethod;
        private string? _targetUri;

        public BingoRequestBuilder(TwitchEBSService ebsService)
        {
            _twitchEBSService = ebsService;
            _channelId = null;
            _role = "none";
            _userId = null;
            _opaqueId = "U" + DateTime.UtcNow.Ticks;
        }

        public static BingoRequestBuilder CreateBroadcasterRequest(TwitchEBSService eBSService)
        {
            var request = new BingoRequestBuilder(eBSService);
            request._role = "broadcaster";
            return request;
        }

        public static BingoRequestBuilder CreateModeratorRequest(TwitchEBSService eBSService)
        {
            var request = new BingoRequestBuilder(eBSService);
            request._role = "moderator";
            return request;
        }

        public static BingoRequestBuilder CreateViewerRequest(TwitchEBSService eBSService)
        {
            var request = new BingoRequestBuilder(eBSService);
            request._role = "viewer";
            return request;
        }

        public BingoRequestBuilder WithChannelId(string channelId)
        {
            _channelId = channelId;
            if (_role == "broadcaster")
            {
                _userId = channelId;
            }
            return this;
        }

        public BingoRequestBuilder WithUserId(string userId)
        {
            _userId = userId;
            _opaqueId = $"U{userId}";
            if (_role == "broadcaster")
            {
                _channelId = userId;
            }
            return this;
        }

        public BingoRequestBuilder WithToken(string opaqueId, string channelId, string role, string? viewerId = null)
        {
            return this;
        }

        public BingoRequestBuilder WithTarget(string method, string uri, string path)
        {
            _targetMethod = method;
            _targetUri = $"{uri}{path}";
            return this;
        }

        public HttpRequestMessage BuildMessage()
        {
            if (_channelId == null)
            {
                throw new ArgumentNullException(nameof(_channelId));
            }
            if (_userId == null)
            {
                throw new ArgumentNullException(nameof(_userId));
            }
            if (_targetUri == null)
            {
                throw new ArgumentNullException(nameof(_targetUri));
            }
            var token = _twitchEBSService.GetUserJWTToken(_userId, _channelId, _role);
            var message = new HttpRequestMessage(new HttpMethod(_targetMethod ?? "GET"), _targetUri);
            message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return message;
        }

        public HttpRequest Build()
        {
            if (_channelId == null)
            {
                throw new ArgumentNullException(nameof(_channelId));
            }
            if (_userId == null)
            {
                throw new ArgumentNullException(nameof(_userId));
            }
            if (_targetUri == null)
            {
                throw new ArgumentNullException(nameof(_targetUri));
            }
            var token = _twitchEBSService.GetUserJWTToken(_userId, _channelId, _role);
            return Http.CreateRequest(_targetMethod, _targetUri)
                .WithHeader("Authorization", $"Bearer {token}");
        }
    }
}
