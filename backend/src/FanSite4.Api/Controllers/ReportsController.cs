using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FanSite4.Api.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports)
    {
        _reports = reports;
    }

    // User creates report
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        await _reports.CreateAsync(userId, req, ct);
        return Ok();
    }

    // Admin reads pending reports (paged)
    [Authorize(Roles = "Admin")]
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending([FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        if (skip < 0) skip = 0;
        if (take <= 0) take = 50;
        if (take > 200) take = 200;

        var (items, total) = await _reports.GetPendingAsync(skip, take, ct);
        return Ok(new { items, total, skip, take });
    }

    // Admin dismisses report (false alarm)
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/dismiss")]
    public async Task<IActionResult> Dismiss(int id, CancellationToken ct)
    {
        await _reports.DismissAsync(id, ct);
        return NoContent();
    }

    // Admin resolves report (action taken)
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id, CancellationToken ct)
    {
        await _reports.ResolveAsync(id, ct);
        return NoContent();
    }
}
