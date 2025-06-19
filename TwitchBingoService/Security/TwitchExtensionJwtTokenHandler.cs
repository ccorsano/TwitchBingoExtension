using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace TwitchBingoService.Security
{
    public class TwitchExtensionJwtTokenHandler : JwtSecurityTokenHandler
    {
        private readonly SymmetricSecurityKey _symmetricSecurityKey;

        public TwitchExtensionJwtTokenHandler(SymmetricSecurityKey securityKey)
        {
            _symmetricSecurityKey = securityKey;
        }

        protected override SecurityKey ResolveIssuerSigningKey(string token, JwtSecurityToken jwtToken, TokenValidationParameters validationParameters)
        {
            return _symmetricSecurityKey;
        }

        public override bool CanReadToken(string token)
        {
            return base.CanReadToken(token);
        }
    }
}
