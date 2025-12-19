namespace FanSite4.Application.DTOs.Auth;

public sealed class UserDto
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    public required string UserName { get; init; }
    public required string Role { get; init; }
}
