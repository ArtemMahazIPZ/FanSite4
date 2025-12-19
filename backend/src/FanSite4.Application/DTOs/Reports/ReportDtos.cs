using FanSite4.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace FanSite4.Application.DTOs.Reports;

public sealed class CreateReportRequest
{
    [Required]
    public int ArticleId { get; set; }

    [Required, MinLength(5), MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class ReportDto
{
    public int Id { get; init; }
    public required string Reason { get; init; }
    public ReportStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }

    public int ArticleId { get; init; }
    public required string ArticleTitle { get; init; }

    public required string UserId { get; init; }
    public required string UserEmail { get; init; }
}
