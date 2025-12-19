using FanSite4.Domain.Enums;
using System.Xml.Linq;

namespace FanSite4.Domain.Entities;

public class Article
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
    public ArticleCategory Category { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
