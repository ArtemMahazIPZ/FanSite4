using FanSite4.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace FanSite4.Application.DTOs.Reactions;

public sealed class ToggleReactionRequest
{
    [Required]
    public int ArticleId { get; set; }

    [Required]
    public ReactionType Type { get; set; }
}
