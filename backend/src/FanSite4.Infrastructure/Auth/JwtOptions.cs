namespace FanSite4.Infrastructure.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "FanSite4";
    public string Audience { get; set; } = "FanSite4.Client";
    public string Key { get; set; } = "a6WZcGWhdv2vKI0VMW44Yvo4zQjgHkHcYf5PddWnSp458mgeaChYyx4uP3Lh3i7Y";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
