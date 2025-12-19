namespace FanSite4.Application.DTOs.Auth;

public sealed class AuthResponse
{
    public required UserDto User { get; init; }
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required int ExpiresInSeconds { get; init; }
}
