using FanSite4.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System.Xml.Linq;

namespace FanSite4.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public UserRole Role { get; set; } = UserRole.User;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
