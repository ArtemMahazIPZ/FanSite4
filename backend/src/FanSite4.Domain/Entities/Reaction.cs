using FanSite4.Domain.Enums;

namespace FanSite4.Domain.Entities;

public class Reaction
{
    public int Id { get; set; }

    public ReactionType Type { get; set; }

    public string UserId { get; set; } = string.Empty;
    public int ArticleId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
    public Article? Article { get; set; }
}
