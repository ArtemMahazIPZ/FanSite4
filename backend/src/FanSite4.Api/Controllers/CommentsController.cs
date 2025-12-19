using System.Security.Claims;
using FanSite4.Api.Contracts.Comments;
using FanSite4.Domain.Entities;
using FanSite4.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CommentsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("articles/{articleId:int}/comments")]
    public async Task<ActionResult<List<CommentDto>>> GetForArticle(int articleId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var exists = await _db.Articles.AnyAsync(a => a.Id == articleId, ct);
        if (!exists) return NotFound();

        var items = await _db.Comments
            .AsNoTracking()
            .Where(c => c.ArticleId == articleId)
            .Include(c => c.Author)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CommentDto(
                c.Id,
                c.ArticleId,
                c.Text,
                c.CreatedAtUtc,
                c.Author.Email ?? c.Author.UserName ?? "user",
                isAdmin || (userId != null && c.AuthorId == userId)
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [Authorize]
    [HttpPost("articles/{articleId:int}/comments")]
    public async Task<ActionResult<CommentDto>> Create(int articleId, [FromBody] CreateCommentRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var text = (req.Text ?? "").Trim();
        if (text.Length < 1) return BadRequest(new { message = "Comment is empty." });
        if (text.Length > 4000) return BadRequest(new { message = "Comment is too long (max 4000)." });

        var articleExists = await _db.Articles.AnyAsync(a => a.Id == articleId, ct);
        if (!articleExists) return NotFound();

        var author = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (author is null) return Unauthorized();

        var c = new Comment
        {
            ArticleId = articleId,
            AuthorId = userId,
            Text = text,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Comments.Add(c);
        await _db.SaveChangesAsync(ct);

        var dto = new CommentDto(
            c.Id,
            c.ArticleId,
            c.Text,
            c.CreatedAtUtc,
            author.Email ?? author.UserName ?? "user",
            true
        );

        return Ok(dto);
    }

    [Authorize]
    [HttpDelete("comments/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var c = await _db.Comments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return NotFound();

        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && c.AuthorId != userId) return Forbid();

        _db.Comments.Remove(c);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
