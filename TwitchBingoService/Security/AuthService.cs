using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TwitchAchievementTrackerBackend.Configuration;
using TwitchBingoService.Model;

namespace TwitchBingoService.Security;


public class AuthService
{
    private readonly TwitchOptions _twitchOptions;

    public AuthService(IOptions<TwitchOptions> twitchOptions)
    {
        _twitchOptions = twitchOptions.Value;
    }

    public string GenerateToken(TwitchUser user)
    {
        JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = GenerateClaims(user),
            Expires = DateTime.UtcNow.AddDays(1),
            SigningCredentials = CreateCredentials(),
            IncludeKeyIdInHeader = true,
        };

        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }

    private SigningCredentials CreateCredentials()
    {
        var key = Convert.FromBase64String(_twitchOptions.ExtensionSecret);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256Signature);
        return credentials;
    }

    private static ClaimsIdentity GenerateClaims(TwitchUser user)
    {
        var claims = new ClaimsIdentity();
        claims.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id));
        claims.AddClaim(new Claim(ClaimTypes.Name, user.UserName));
        claims.AddClaim(new Claim("role", "broadcaster"));
        claims.AddClaim(new Claim("user_id", user.Id));
        claims.AddClaim(new Claim("channel_id", user.Id));

        return claims;
    }

    public string GenerateExternalToken(TwitchUser user)
    {
        JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();

        JwtSecurityToken jwt = new JwtSecurityToken(
            new JwtHeader(CreateCredentials())
            {
                {  "alg", "HS256" }
            },
            new JwtPayload(issuer: null, audience: null, claims: null, notBefore: null, expires: DateTime.UtcNow.AddDays(1))
            {
                { "role", "external" },
                { "user_id", user.Id },
            }
        );

        return handler.WriteToken(jwt);
    }
}