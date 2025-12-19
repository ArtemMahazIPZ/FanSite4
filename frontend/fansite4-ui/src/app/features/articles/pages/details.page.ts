import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TranslateModule } from '@ngx-translate/core';

import { ArticleService } from '../../../core/services/article.service';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

import { ArticleDto } from '../../../core/models/article.models';
import { CommentDto } from '../../../core/models/comment.models';

import { ReactionSelectorComponent } from '../../../shared/components/reaction-selector/reaction-selector.component';
import { ReportDialogComponent } from '../../../shared/components/report-dialog/report-dialog.component';

@Component({
  standalone: true,
  imports: [
    NgIf, NgFor, RouterLink, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    ReactionSelectorComponent,
    TranslateModule,
  ],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-4xl mx-auto px-4 py-8">

        <div class="flex items-center justify-between gap-3 flex-wrap">
          <a routerLink="/" class="text-white/70 hover:text-white">← {{ 'common.back' | translate }}</a>

          <div class="flex items-center gap-2" *ngIf="article() as a">
            <ng-container *ngIf="isAdmin()">
              <button mat-stroked-button class="border-white/15! text-white! rounded-2xl!"
                      (click)="goEdit(a.id)">
                <mat-icon>edit</mat-icon>
                <span class="ml-2">{{ 'admin.edit' | translate }}</span>
              </button>

              <button mat-stroked-button class="border-white/15! text-white! rounded-2xl!"
                      (click)="deleteArticle(a.id)">
                <mat-icon>delete</mat-icon>
                <span class="ml-2">{{ 'admin.delete' | translate }}</span>
              </button>
            </ng-container>

            <button mat-stroked-button class="border-white/15! text-white! rounded-2xl!"
                    (click)="openReport(a.id)" [disabled]="!isLoggedIn()">
              <mat-icon>flag</mat-icon>
              <span class="ml-2">{{ 'common.report' | translate }}</span>
            </button>
          </div>
        </div>

        <div *ngIf="loading()" class="mt-6 text-white/70">Loading...</div>

        <div *ngIf="!loading() && !article()" class="mt-8 rounded-3xl bg-white/10 border border-white/10 p-6">
          <h2 class="text-xl font-semibold">Article not found</h2>
          <p class="text-white/70 mt-2">Maybe it was deleted.</p>
        </div>

        <ng-container *ngIf="!loading() && article() as a">
          <div class="mt-6 rounded-3xl overflow-hidden bg-white/10 border border-white/10">

            <div class="bg-black/20">
              <img *ngIf="a.imageUrl"
                   [src]="a.imageUrl"
                   class="w-full max-h-[420px] object-contain"
                   alt=""/>
            </div>

            <div class="p-6">
              <div class="text-white/70 text-xs">{{ a.category }} • {{ a.createdAt | date:'medium' }}</div>
              <h1 class="mt-2 text-2xl font-semibold">{{ a.title }}</h1>
              <p class="mt-4 text-white/80 whitespace-pre-line">{{ a.content }}</p>

              <div class="mt-6 flex flex-wrap items-center gap-3">
                <fs-reaction-selector
                  [articleId]="a.id"
                  [counts]="{
                    like: (a.likeCount ?? 0),
                    smile: (a.smileCount ?? 0),
                    sad: (a.sadCount ?? 0)
                  }">
                </fs-reaction-selector>

                <div class="text-white/60 text-sm" *ngIf="!isLoggedIn()">
                  Sign in to react or report.
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 rounded-3xl bg-white/10 border border-white/10 p-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">{{ 'comments.title' | translate }}</h2>
              <div class="text-white/60 text-sm">{{ comments().length }}</div>
            </div>

            <div class="mt-4" *ngIf="isLoggedIn(); else loginHint">
              <textarea
                [formControl]="commentText"
                rows="3"
                [placeholder]="'comments.placeholder' | translate"
                class="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white outline-none placeholder:text-white/40"
              ></textarea>

              <div class="mt-3 flex justify-end">
                <button mat-stroked-button class="border-white/15! text-white! rounded-2xl!"
                        [disabled]="sending() || !commentText.value.trim()"
                        (click)="sendComment(a.id)">
                  <mat-icon>send</mat-icon>
                  <span class="ml-2">{{ 'comments.send' | translate }}</span>
                </button>
              </div>
            </div>

            <ng-template #loginHint>
              <div class="mt-4 text-white/60">Sign in to comment.</div>
            </ng-template>

            <div class="mt-6 space-y-3">
              <div *ngFor="let c of comments(); trackBy: trackByCommentId"
                   class="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-white/80 font-semibold">{{ c.authorEmail }}</div>
                    <div class="text-white/50 text-xs">{{ c.createdAtUtc | date:'medium' }}</div>
                  </div>

                  <button *ngIf="canDeleteComment(c)"
                          mat-icon-button
                          class="text-white/80"
                          (click)="deleteComment(c.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <div class="mt-3 text-white/80 whitespace-pre-line">{{ c.text }}</div>
              </div>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
})
export class DetailsPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  private articles = inject(ArticleService);
  private reports = inject(ReportService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  readonly loading = signal(true);
  readonly article = signal<ArticleDto | null>(null);

  readonly comments = signal<CommentDto[]>([]);
  readonly sending = signal(false);

  readonly commentText = new FormControl<string>('', { nonNullable: true });

  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  readonly isAdmin = computed(() => this.auth.isAdmin());

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.loading.set(false);
      this.article.set(null);
      return;
    }

    this.articles.getById(id).subscribe({
      next: a => {
        this.article.set(a);
        this.loadComments(a.id);
      },
      error: () => this.article.set(null),
      complete: () => this.loading.set(false),
    });
  }

  private loadComments(articleId: number) {
    this.articles.getComments(articleId).subscribe({
      next: items => this.comments.set(items ?? []),
      error: () => this.comments.set([]),
    });
  }

  sendComment(articleId: number) {
    const text = this.commentText.value.trim();
    if (!text) return;

    this.sending.set(true);
    this.articles.addComment(articleId, { text }).subscribe({
      next: () => {
        this.commentText.setValue('');
        this.loadComments(articleId);
      },
      error: () => this.toast.error('Failed to send comment'),
      complete: () => this.sending.set(false),
    });
  }

  deleteComment(id: number) {
    const ok = confirm('Delete this comment?');
    if (!ok) return;

    this.articles.deleteComment(id).subscribe({
      next: () => {
        const a = this.article();
        if (a) this.loadComments(a.id);
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  canDeleteComment(c: CommentDto): boolean {
    if (this.isAdmin()) return true;

    const me = this.auth.user()?.email?.toLowerCase();
    const author = c.authorEmail?.toLowerCase();

    return !!me && !!author && me === author;
  }

  goEdit(id: number) {
    this.router.navigateByUrl(`/admin/articles/${id}/edit`);
  }

  deleteArticle(id: number) {
    const ok = confirm('Delete this article?');
    if (!ok) return;

    this.articles.delete(id).subscribe({
      next: () => {
        this.toast.success('Deleted');
        this.router.navigateByUrl('/');
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  openReport(articleId: number) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const ref = this.dialog.open(ReportDialogComponent, {
      data: { articleId },
      panelClass: 'rounded-3xl',
    });

    ref.afterClosed().subscribe((reason: string | null) => {
      if (!reason) return;

      this.reports.create({ articleId, reason }).subscribe({
        next: () => this.toast.success('Report sent. Admins will review it.'),
        error: (e: HttpErrorResponse) => {
          if (e.status === 401) {
            this.toast.error('Please sign in again.');
            this.router.navigateByUrl('/login');
            return;
          }
          this.toast.error('Failed to send report');
        },
      });
    });
  }

  trackByCommentId(_: number, c: CommentDto) {
    return c.id;
  }
}
