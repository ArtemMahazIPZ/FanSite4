using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Reports;
using FanSite4.Domain.Enums;
using FanSite4.Domain.Entities;
using FanSite4.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Infrastructure.Services;

public sealed class ReportService(ApplicationDbContext db) : IReportService
{
    public async Task CreateAsync(string userId, CreateReportRequest request, CancellationToken ct)
    {
        var exists = await db.Articles.AnyAsync(a => a.Id == request.ArticleId, ct);
        if (!exists) throw new InvalidOperationException("Article not found.");

        db.Reports.Add(new Report
        {
            UserId = userId,
            ArticleId = request.ArticleId,
            Reason = request.Reason.Trim(),
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
    }

    public async Task<(IReadOnlyList<ReportDto> Items, int Total)> GetPendingAsync(int skip, int take, CancellationToken ct)
    {
        var baseQuery = db.Reports.AsNoTracking()
            .Include(r => r.Article)
            .Include(r => r.User)
            .Where(r => r.Status == ReportStatus.Pending);

        var total = await baseQuery.CountAsync(ct);

        var items = await baseQuery
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(r => new ReportDto
            {
                Id = r.Id,
                Reason = r.Reason,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                ArticleId = r.ArticleId,
                ArticleTitle = r.Article!.Title,
                UserId = r.UserId,
                UserEmail = r.User!.Email!
            })
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task DismissAsync(int reportId, CancellationToken ct)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
        if (report is null) throw new InvalidOperationException("Report not found.");

        report.Status = ReportStatus.Dismissed;
        await db.SaveChangesAsync(ct);
    }

    public async Task ResolveAsync(int reportId, CancellationToken ct)
    {
        var report = await db.Reports
            .Include(r => r.Article)
            .FirstOrDefaultAsync(r => r.Id == reportId, ct);

        if (report?.Article is null) throw new InvalidOperationException("Report or article not found.");

        db.Articles.Remove(report.Article);
        report.Status = ReportStatus.Resolved;

        await db.SaveChangesAsync(ct);
    }
}
