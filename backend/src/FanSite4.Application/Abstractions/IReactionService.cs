using FanSite4.Application.DTOs.Reactions;
using FanSite4.Domain.Enums;

namespace FanSite4.Application.Abstractions;

public interface IReactionService
{
   
    Task ToggleAsync(string userId, ToggleReactionRequest request, CancellationToken ct);

    Task<ReactionType?> GetMyReactionAsync(string userId, int articleId, CancellationToken ct);
}
