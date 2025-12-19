import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ArticleService } from '../../../core/services/article.service';
import { ToastService } from '../../../core/services/toast.service';
import { ArticleDto, Paged } from '../../../core/models/article.models';
import { ArticleCategory } from '../../../core/models/enums';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
  ],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 class="text-2xl font-semibold">Articles (Admin)</h1>
            <p class="text-white/70 mt-1">Search, filter, edit and delete.</p>
          </div>

          <a routerLink="/admin/articles/new" mat-raised-button class="rounded-2xl!">
            <mat-icon>add</mat-icon>
            <span class="ml-2">Create</span>
          </a>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-white/10 border border-white/10 rounded-3xl p-4 md:col-span-2">
            <label class="text-white/70 text-xs">Search</label>
            <input [formControl]="q" placeholder="Title or content..."
                   class="mt-2 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none" />
          </div>

          <div class="bg-white/10 border border-white/10 rounded-3xl p-4">
            <label class="text-white/70 text-xs">Category</label>
            <select [formControl]="category"
                    class="mt-2 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none">
              <option value="">All</option>
              <option value="Person">Person</option>
              <option value="Weapon">Weapon</option>
              <option value="Mission">Mission</option>
            </select>
          </div>
        </div>

        <div class="mt-6 bg-white/10 border border-white/10 rounded-3xl overflow-hidden">
          <table mat-table [dataSource]="ds" matSort class="w-full">

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
              <td mat-cell *matCellDef="let a">{{ a.createdAt | date:'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
              <td mat-cell *matCellDef="let a">{{ a.category }}</td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let a">{{ a.title }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let a" class="flex gap-2 py-2">
                <a [routerLink]="['/admin/articles', a.id, 'edit']" mat-stroked-button
                   class="border-white/15! text-white! rounded-2xl!">
                  Edit
                </a>
                <button mat-stroked-button type="button" (click)="remove(a)"
                        class="border-white/15! text-white! rounded-2xl!">
                  Delete
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>

          <mat-paginator [length]="total()" [pageSize]="pageSize()" [pageSizeOptions]="[10,20,50]"></mat-paginator>
        </div>
      </div>
    </div>
  `,
})
export class AdminArticlesPage implements AfterViewInit {
  private api = inject(ArticleService);
  private toast = inject(ToastService);

  cols = ['createdAt', 'category', 'title', 'actions'];
  ds = new MatTableDataSource<ArticleDto>([]);

  total = signal(0);
  pageSize = signal(20);
  pageIndex = signal(0);

  q = new FormControl<string>('', { nonNullable: true });
  category = new FormControl<ArticleCategory | ''>('', { nonNullable: true });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.ds.paginator = this.paginator;
    this.ds.sort = this.sort;

    this.paginator.page.subscribe((e: PageEvent) => {
      this.pageIndex.set(e.pageIndex);
      this.pageSize.set(e.pageSize);
      this.load();
    });

    this.q.valueChanges.pipe(debounceTime(250)).subscribe(() => {
      this.pageIndex.set(0);
      this.paginator.firstPage();
      this.load();
    });

    this.category.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.paginator.firstPage();
      this.load();
    });

    this.load();
  }

  load() {
    const skip = this.pageIndex() * this.pageSize();
    const take = this.pageSize();

    this.api.search$({
      q: this.q.value?.trim() || undefined,
      category: (this.category.value || undefined) as ArticleCategory | undefined,
      skip,
      take,
    }).subscribe({
      next: (res: Paged<ArticleDto>) => {
        this.ds.data = res.items;
        this.total.set(res.total);
      },
      error: () => this.toast.error('Failed to load articles'),
    });
  }

  remove(a: ArticleDto) {
    if (!confirm(`Delete "${a.title}"?`)) return;

    this.api.delete(a.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.load(); },
      error: () => this.toast.error('Delete failed'),
    });
  }
}
