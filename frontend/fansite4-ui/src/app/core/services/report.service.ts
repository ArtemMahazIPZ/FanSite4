import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL } from '../tokens';
import { Observable, catchError, map, throwError } from 'rxjs';

export type CreateReportRequest = { articleId: number; reason: string };

export type ReportStatus = 'New' | 'InReview' | 'Resolved' | 'Rejected';

export type ReportDto = {
  id: number;
  articleId: number;
  reason: string;
  createdAtUtc: string;
  reporterEmail?: string;
  status?: ReportStatus | string;
};

type MaybePaged<T> =
  | T[]
  | { items?: T[]; total?: number }
  | { data?: T[] };

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  private normalize(res: MaybePaged<ReportDto> | null | undefined): ReportDto[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;

    if (typeof res === 'object' && res) {
      if ('items' in res && Array.isArray((res as any).items)) return (res as any).items as ReportDto[];
      if ('data' in res && Array.isArray((res as any).data)) return (res as any).data as ReportDto[];
    }
    return [];
  }

  // ===== USER =====
  create(req: CreateReportRequest): Observable<void> {
    const urls = [
      `${this.apiBase}/reports`,
      `${this.apiBase}/api/reports`,
    ];
    return this.tryPost<void>(urls, req);
  }

  // ===== ADMIN =====
  getAll(): Observable<ReportDto[]> {
    // ВИПРАВЛЕНО: Додано /pending, бо саме так чекає бекенд
    const urls = [
      `${this.apiBase}/reports/pending`,
      `${this.apiBase}/api/reports/pending`
    ];

    return this.tryGet<MaybePaged<ReportDto>>(urls).pipe(map(r => this.normalize(r)));
  }

  // Видалення (Dismiss)
  delete(id: number): Observable<void> {
    // ВИПРАВЛЕНО: Бекенд чекає POST на .../dismiss, а не DELETE
    // Тому ми використовуємо tryPost, а не tryDelete
    const urls = [
      `${this.apiBase}/reports/${id}/dismiss`,
      `${this.apiBase}/api/reports/${id}/dismiss`
    ];

    return this.tryPost<void>(urls, {});
  }

  // Зміна статусу (Resolve)
  setStatus(id: number, status: ReportStatus): Observable<void> {
    // ВИПРАВЛЕНО: Бекенд має специфічний ендпоінт для вирішення
    if (status === 'Resolved') {
      const urls = [
        `${this.apiBase}/reports/${id}/resolve`,
        `${this.apiBase}/api/reports/${id}/resolve`
      ];
      return this.tryPost<void>(urls, {});
    }

    // Якщо раптом треба просто видалити (Reject)
    if (status === 'Rejected') {
      return this.delete(id);
    }

    // Якщо статус не підтримується бекендом явно, просто повертаємо ОК (заглушка)
    return new Observable(obs => { obs.next(); obs.complete(); });
  }

  // ===== low-level helpers =====

  private tryGet<T>(urls: string[]): Observable<T> {
    const [first, ...rest] = urls;
    return this.http.get<T>(first).pipe(
      catchError((e: HttpErrorResponse) => {
        // Пробуємо наступний URL тільки якщо 404 (Not Found)
        if (e.status === 404 && rest.length) return this.tryGet<T>(rest);
        return throwError(() => e);
      })
    );
  }

  private tryPost<T>(urls: string[], body: any): Observable<T> {
    const [first, ...rest] = urls;
    return this.http.post<T>(first, body).pipe(
      catchError((e: HttpErrorResponse) => {
        if (e.status === 404 && rest.length) return this.tryPost<T>(rest, body);
        return throwError(() => e);
      })
    );
  }
}
