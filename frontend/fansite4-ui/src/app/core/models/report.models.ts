export interface ReportDto {
  id: number;
  articleId: number;
  articleTitle?: string | null;
  reason: string;
  createdAtUtc: string;
  reporterEmail?: string | null;
}

export interface CreateReportRequest {
  articleId: number;
  reason: string;
}
