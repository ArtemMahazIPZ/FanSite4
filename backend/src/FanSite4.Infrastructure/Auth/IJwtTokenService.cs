using FanSite4.Domain.Entities;

namespace FanSite4.Infrastructure.Auth;

public interface IJwtTokenService
{
    (string token, int expiresInSeconds) CreateAccessToken(ApplicationUser user);
    string CreateRefreshToken();
}
