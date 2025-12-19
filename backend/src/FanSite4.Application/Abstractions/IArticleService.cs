using FanSite4.Application.DTOs.Articles;
using FanSite4.Domain.Enums;

namespace FanSite4.Application.Abstractions;

public interface IArticleService
{
    Task<(IReadOnlyList<ArticleDto> Items, int Total)> SearchAsync(
        string? q, ArticleCategory? category, int skip, int take, CancellationToken ct);

    Task<ArticleDto?> GetByIdAsync(int id, CancellationToken ct);

    Task<ArticleDto> CreateAsync(ArticleUpsertRequest request, CancellationToken ct);
    Task<ArticleDto?> UpdateAsync(int id, ArticleUpsertRequest request, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}
