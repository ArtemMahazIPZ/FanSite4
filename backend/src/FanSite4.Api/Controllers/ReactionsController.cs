using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Reactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FanSite4.Api.Controllers;

[ApiController]
[Route("api/reactions")]
public sealed class ReactionsController(IReactionService reactions) : ControllerBase
{
    [Authorize]
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle(ToggleReactionRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await reactions.ToggleAsync(userId, request, ct);
        return NoContent();
    }

    [Authorize]
    [HttpGet("mine/{articleId:int}")]
    public async Task<IActionResult> Mine(int articleId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var my = await reactions.GetMyReactionAsync(userId, articleId, ct);
        return Ok(new { articleId, reaction = my });
    }
}
