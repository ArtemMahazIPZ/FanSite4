using System.ComponentModel.DataAnnotations;

namespace FanSite4.Application.DTOs.Auth;

public sealed class RefreshRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
