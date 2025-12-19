import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../tokens';
import { finalize, Observable, map } from 'rxjs';

import { ArticleCategory } from '../models/enums';
import { ArticleDto, ArticleUpsertRequest } from '../models/article.models';
import { CommentDto, CreateCommentRequest } from '../models/comment.models';

export type Paged<T> = { items: T[]; total: number };
export type ArticleSearchParams = { q?: string; category?: ArticleCategory; skip?: number; take?: number };
export type UploadImageResponse = { url: string };

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  // ✅ сигнали для каталогу
  readonly items = signal<ArticleDto[]>([]);
  readonly total = signal<number>(0);
  readonly loading = signal<boolean>(false);

  private lastParams: ArticleSearchParams = { skip: 0, take: 12 };

  private toHttpParams(p: ArticleSearchParams): HttpParams {
    let params = new HttpParams();
    if (p.q) params = params.set('q', p.q);
    if (p.category) params = params.set('category', String(p.category));
    if (typeof p.skip === 'number') params = params.set('skip', String(p.skip));
    if (typeof p.take === 'number') params = params.set('take', String(p.take));
    return params;
  }

  // ===== SEARCH =====
  search$(params: ArticleSearchParams): Observable<Paged<ArticleDto>> {
    return this.http.get<Paged<ArticleDto>>(`${this.apiBase}/api/articles`, {
      params: this.toHttpParams(params ?? {}),
    });
  }

  search(params: ArticleSearchParams): void {
    this.lastParams = params ?? this.lastParams;

    this.loading.set(true);
    this.search$(this.lastParams)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.items.set(res?.items ?? []);
          this.total.set(res?.total ?? 0);
        },
        error: () => {
          this.items.set([]);
          this.total.set(0);
        },
      });
  }

  reload(): void {
    this.search(this.lastParams);
  }

  // ===== CRUD =====
  getById(id: number): Observable<ArticleDto> {
    return this.http.get<ArticleDto>(`${this.apiBase}/api/articles/${id}`);
  }

  create(req: ArticleUpsertRequest): Observable<ArticleDto> {
    return this.http.post<ArticleDto>(`${this.apiBase}/api/articles`, req);
  }

  update(id: number, req: ArticleUpsertRequest): Observable<ArticleDto> {
    return this.http.put<ArticleDto>(`${this.apiBase}/api/articles/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/api/articles/${id}`);
  }

  // ===== COMMENTS =====
  getComments(articleId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.apiBase}/api/articles/${articleId}/comments`);
  }

  addComment(articleId: number, req: CreateCommentRequest): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.apiBase}/api/articles/${articleId}/comments`, req);
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/api/comments/${id}`);
  }

  // ===== UPLOAD IMAGE =====
  uploadImage(file: File): Observable<UploadImageResponse> {
    const fd = new FormData();
    fd.append('file', file, file.name);

    return this.http
      .post<any>(`${this.apiBase}/api/uploads/images`, fd, { withCredentials: true })
      .pipe(
        map((r) => ({
          url: r?.url ?? r?.imageUrl ?? r?.path ?? r?.data?.url ?? '',
        }))
      );
  }
}
