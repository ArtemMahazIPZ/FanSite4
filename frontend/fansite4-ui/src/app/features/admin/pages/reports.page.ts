import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReportDto, ReportService, ReportStatus } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-6xl mx-auto px-4 py-10">

        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div class="text-white/60 text-sm">Admin</div>
            <h1 class="text-3xl font-semibold mt-1">Reports</h1>
            <p class="text-white/70 mt-2">All reports sent by users.</p>
          </div>

          <div class="flex items-center gap-2">
            <a routerLink="/admin/articles"
               class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">
              ← Articles
            </a>

            <a routerLink="/admin/articles/new"
               class="px-4 py-2 rounded-2xl bg-white/15 border border-white/15 hover:bg-white/20 inline-flex items-center gap-2">
              <mat-icon>add</mat-icon>
              <span>New Article</span>
            </a>
          </div>
        </div>

        <div class="mt-8 rounded-3xl bg-white/10 border border-white/10 overflow-hidden">
          <div class="p-5 flex items-center justify-between">
            <div class="text-white/80">Total: {{ items().length }}</div>
            <button mat-stroked-button class="rounded-2xl! border-white/15! text-white!"
                    (click)="load()">
              Refresh
            </button>
          </div>

          <div *ngIf="loading()" class="px-5 pb-5 text-white/70">Loading...</div>

          <div *ngIf="!loading() && items().length === 0" class="px-5 pb-5 text-white/60">
            No reports.
          </div>

          <div *ngIf="!loading() && items().length > 0" class="divide-y divide-white/10">
            <div *ngFor="let r of items(); trackBy: trackById" class="p-5 flex gap-4 justify-between">
              <div class="min-w-0">
                <div class="text-white/80 font-semibold">
                  Article #{{ r.articleId }}
                  <a [routerLink]="['/articles', r.articleId]" class="text-cyan-300 hover:text-cyan-200 ml-2">
                    open
                  </a>
                </div>

                <div class="text-white/70 mt-2 whitespace-pre-line">{{ r.reason }}</div>

                <div class="text-white/50 text-xs mt-3">
                  {{ r.createdAtUtc | date:'short' }}
                  <span *ngIf="r.reporterEmail">• {{ r.reporterEmail }}</span>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <div class="text-white/60 text-sm">Status:</div>
                  <select
                    class="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-white outline-none"
                    [value]="r.status ?? 'New'"
                    (change)="changeStatus(r, $any($event.target).value)"
                  >
                    <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                  </select>
                </div>
              </div>

              <div class="shrink-0 flex items-center gap-2">
                <button mat-stroked-button class="rounded-2xl! border-white/15! text-white!"
                        (click)="remove(r.id)">
                  <mat-icon>delete</mat-icon>
                  <span class="ml-2">Delete</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class AdminReportsPage {
  private reports = inject(ReportService);
  private toast = inject(ToastService);

  readonly loading = signal(false);
  readonly items = signal<ReportDto[]>([]);

  readonly statuses: ReportStatus[] = ['New', 'InReview', 'Resolved', 'Rejected'];

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.reports.getAll().subscribe({
      next: (res) => this.items.set(res ?? []),
      error: (e) => this.toast.error(`Failed to load reports (${e.status})`),
      complete: () => this.loading.set(false),
    });
  }

  remove(id: number) {
    if (!confirm('Delete this report?')) return;

    this.reports.delete(id).subscribe({
      next: () => {
        this.items.update(arr => arr.filter(x => x.id !== id));
        this.toast.success('Deleted');
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  changeStatus(r: ReportDto, status: ReportStatus) {
    this.reports.setStatus(r.id, status).subscribe({
      next: () => {
        this.items.update(arr => arr.map(x => x.id === r.id ? ({ ...x, status }) : x));
        this.toast.success('Status updated');
      },
      error: (e) => this.toast.error(`Status update failed (${e.status})`),
    });
  }

  trackById(_: number, r: ReportDto) { return r.id; }
}
