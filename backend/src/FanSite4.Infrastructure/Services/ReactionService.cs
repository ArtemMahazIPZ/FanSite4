using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Reactions;
using FanSite4.Domain.Enums;
using FanSite4.Domain.Entities;
using FanSite4.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Infrastructure.Services;

public sealed class ReactionService(ApplicationDbContext db) : IReactionService
{
    public async Task ToggleAsync(string userId, ToggleReactionRequest request, CancellationToken ct)
    {
        var existsArticle = await db.Articles.AnyAsync(a => a.Id == request.ArticleId, ct);
        if (!existsArticle) throw new InvalidOperationException("Article not found.");

        var reaction = await db.Reactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ArticleId == request.ArticleId, ct);

        if (reaction is null)
        {
            db.Reactions.Add(new Reaction
            {
                UserId = userId,
                ArticleId = request.ArticleId,
                Type = request.Type,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            if (reaction.Type == request.Type)
                db.Reactions.Remove(reaction);
            else
                reaction.Type = request.Type;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<ReactionType?> GetMyReactionAsync(string userId, int articleId, CancellationToken ct)
    {
        return await db.Reactions.AsNoTracking()
            .Where(r => r.UserId == userId && r.ArticleId == articleId)
            .Select(r => (ReactionType?)r.Type)
            .FirstOrDefaultAsync(ct);
    }
}
