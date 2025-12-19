using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Articles;
using FanSite4.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FanSite4.Api.Controllers;

[ApiController]
[Route("api/articles")]
public sealed class ArticlesController(IArticleService articles) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] ArticleCategory? category,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 12,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);

        var (items, total) = await articles.SearchAsync(q, category, skip, take, ct);
        return Ok(new { items, total });
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var item = await articles.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public Task<ArticleDto> Create(ArticleUpsertRequest request, CancellationToken ct)
        => articles.CreateAsync(request, ct);

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ArticleUpsertRequest request, CancellationToken ct)
    {
        var updated = await articles.UpdateAsync(id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await articles.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
