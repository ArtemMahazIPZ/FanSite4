using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Articles;
using FanSite4.Domain.Enums;
using FanSite4.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Infrastructure.Services;

public sealed class ArticleService(ApplicationDbContext db) : IArticleService
{
    public async Task<(IReadOnlyList<ArticleDto> Items, int Total)> SearchAsync(
        string? q, ArticleCategory? category, int skip, int take, CancellationToken ct)
    {
        var query = db.Articles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(a => a.Title.Contains(q) || a.Content.Contains(q));

        if (category is not null)
            query = query.Where(a => a.Category == category);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                ImageUrl = a.ImageUrl,
                Category = a.Category,
                CreatedAt = a.CreatedAt,
                LikeCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Like),
                SmileCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Smile),
                SadCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Sad),
            })
            .ToListAsync(ct);

        return (items, total);
    }

    public Task<ArticleDto?> GetByIdAsync(int id, CancellationToken ct)
        => db.Articles.AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                ImageUrl = a.ImageUrl,
                Category = a.Category,
                CreatedAt = a.CreatedAt,
                LikeCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Like),
                SmileCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Smile),
                SadCount = a.Reactions.Count(r => r.Type == FanSite4.Domain.Enums.ReactionType.Sad),
            })
            .FirstOrDefaultAsync(ct);

    public async Task<ArticleDto> CreateAsync(ArticleUpsertRequest request, CancellationToken ct)
    {
        var entity = new FanSite4.Domain.Entities.Article
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            ImageUrl = request.ImageUrl,
            Category = request.Category,
            CreatedAt = DateTime.UtcNow
        };

        db.Articles.Add(entity);
        await db.SaveChangesAsync(ct);

        return (await GetByIdAsync(entity.Id, ct))!;
    }

    public async Task<ArticleDto?> UpdateAsync(int id, ArticleUpsertRequest request, CancellationToken ct)
    {
        var entity = await db.Articles.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return null;

        entity.Title = request.Title.Trim();
        entity.Content = request.Content.Trim();
        entity.ImageUrl = request.ImageUrl;
        entity.Category = request.Category;

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await db.Articles.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return false;

        db.Articles.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
