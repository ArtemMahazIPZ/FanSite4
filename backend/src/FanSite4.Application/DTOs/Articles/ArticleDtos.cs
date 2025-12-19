using FanSite4.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace FanSite4.Application.DTOs.Articles;

public sealed class ArticleDto
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Content { get; init; }
    public string? ImageUrl { get; init; }
    public ArticleCategory Category { get; init; }
    public DateTime CreatedAt { get; init; }

    public int LikeCount { get; init; }
    public int SmileCount { get; init; }
    public int SadCount { get; init; }
}

public sealed class ArticleUpsertRequest
{
    [Required, MinLength(3), MaxLength(180)]
    public string Title { get; set; } = string.Empty;

    [Required, MinLength(10)]
    public string Content { get; set; } = string.Empty;

    [Url]
    public string? ImageUrl { get; set; }

    [Required]
    public ArticleCategory Category { get; set; }
}
