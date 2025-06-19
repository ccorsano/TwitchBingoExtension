using System.IdentityModel.Tokens.Jwt;

namespace TwitchBingoService.Security
{
    public class TwitchApplicationJwtTokenHandler : JwtSecurityTokenHandler
    {
        public override bool CanReadToken(string token)
        {
            return base.CanReadToken(token);
        }
    }
}
