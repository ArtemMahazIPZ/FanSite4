import { Component, Input, computed, inject, signal } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ArticleDto } from '../../../core/models/article.models';
import { AuthService } from '../../../core/services/auth.service';
import { ArticleService } from '../../../core/services/article.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'fs-article-card',
  standalone: true,
  imports: [NgIf, RouterLink, DatePipe, MatButtonModule, MatIconModule],
  template: `
    <a
      class="group relative block rounded-3xl overflow-hidden bg-white/10 border border-white/10 shadow-xl
             transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
      [routerLink]="['/articles', article.id]">

      <!-- Admin actions -->
      <div *ngIf="isAdmin()" class="absolute top-3 right-3 z-10 flex gap-2">
        <button
          type="button"
          mat-icon-button
          class="bg-black/40! text-white! rounded-2xl! backdrop-blur"
          (click)="edit($event)"
          title="Edit">
          <mat-icon>edit</mat-icon>
        </button>

        <button
          type="button"
          mat-icon-button
          class="bg-black/40! text-white! rounded-2xl! backdrop-blur"
          (click)="remove($event)"
          title="Delete">
          <mat-icon>delete</mat-icon>
        </button>
      </div>

      <div class="h-44 w-full bg-white/5">
        <img
          *ngIf="article.imageUrl"
          [src]="article.imageUrl"
          class="h-44 w-full object-cover"
          loading="lazy"
          (error)="imgFailed.set(true)" />

        <div *ngIf="!article.imageUrl || imgFailed()" class="h-44 w-full flex items-center justify-center text-white/30">
          <mat-icon>image</mat-icon>
        </div>
      </div>

      <div class="p-5">
        <div class="text-white/70 text-xs">
          {{ article.category }} • {{ article.createdAt | date:'mediumDate' }}
        </div>

        <h3 class="mt-2 text-white text-lg font-semibold leading-snug">
          {{ article.title }}
        </h3>

        <p class="mt-2 text-white/70 text-sm"
           style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
          {{ article.content }}
        </p>

        <div class="mt-3 text-white/70 text-xs">
          👍 {{ article.likeCount }} &nbsp; 🙂 {{ article.smileCount }} &nbsp; 😢 {{ article.sadCount }}
        </div>
      </div>
    </a>
  `,
})
export class ArticleCardComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private api = inject(ArticleService);
  private toast = inject(ToastService);

  @Input({ required: true }) article!: ArticleDto;

  readonly imgFailed = signal(false);
  readonly isAdmin = computed(() => this.auth.isAdmin());

  edit(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.router.navigateByUrl(`/admin/articles/${this.article.id}/edit`);
  }

  remove(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    const ok = confirm(`Delete "${this.article.title}"?`);
    if (!ok) return;

    this.api.delete(this.article.id).subscribe({
      next: () => {
        this.toast.success('Deleted');
        this.api.reload();
      },
      error: () => this.toast.error('Delete failed'),
    });
  }
}
