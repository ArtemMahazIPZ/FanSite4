using FanSite4.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FanSite4.Infrastructure.Auth;

public sealed class JwtTokenService(JwtOptions options) : IJwtTokenService
{
    private const string KeyId = "fansite4";

    public (string token, int expiresInSeconds) CreateAccessToken(ApplicationUser user)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id),

            // IMPORTANT: Role claim used by [Authorize(Roles = "...")]
            new(ClaimTypes.Role, user.Role.ToString()),

            // optional "role" claim for frontend convenience
            new("role", user.Role.ToString())
        };

        if (string.IsNullOrWhiteSpace(options.Key) || options.Key.Length < 16)
            throw new InvalidOperationException("Jwt:Key must be set (>= 16 chars).");

        // ✅ set KeyId to avoid kid/key resolution issues in some environments
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key))
        {
            KeyId = KeyId
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: creds);

        var token = new JwtSecurityTokenHandler().WriteToken(jwt);
        var expiresIn = (int)(expires - now).TotalSeconds;

        return (token, expiresIn);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
