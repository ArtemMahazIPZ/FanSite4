#nullable enable

namespace FanSite4.Domain.Entities;

public sealed class Comment
{
    public int Id { get; set; }

    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public string AuthorId { get; set; } = null!;
    public ApplicationUser Author { get; set; } = null!;

    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
