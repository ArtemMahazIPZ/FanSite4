using FanSite4.Application.DTOs.Reports;

namespace FanSite4.Application.Abstractions;

public interface IReportService
{
    Task CreateAsync(string userId, CreateReportRequest request, CancellationToken ct);

    Task<(IReadOnlyList<ReportDto> Items, int Total)> GetPendingAsync(int skip, int take, CancellationToken ct);

    Task DismissAsync(int reportId, CancellationToken ct);

    Task ResolveAsync(int reportId, CancellationToken ct);
}
