using System.ComponentModel.DataAnnotations;

namespace FanSite4.Application.DTOs.Auth;

public sealed class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
