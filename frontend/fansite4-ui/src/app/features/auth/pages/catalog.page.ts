import { Component, computed, effect, inject, DestroyRef } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ArticleService } from '../../../core/services/article.service';
import { CatalogStateService } from '../../../core/services/catalog-state.service';
import { ArticleDto } from '../../../core/models/article.models';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, TranslateModule],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-6xl mx-auto px-4 py-10">

        <!-- HERO -->
        <div class="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 class="text-3xl font-semibold">{{ 'CATALOG.TITLE' | translate }}</h1>
            <p class="text-white/70 mt-2">{{ 'CATALOG.SUBTITLE' | translate }}</p>
          </div>
        </div>

        <div *ngIf="loading()" class="text-white/70 mt-8">Loading...</div>

        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!loading()">
          <a *ngFor="let a of items(); trackBy: trackById"
             [routerLink]="['/articles', a.id]"
             class="rounded-3xl overflow-hidden bg-white/10 border border-white/10 hover:border-white/20 transition">

            <div class="h-56 bg-black/20">
              <img *ngIf="a.imageUrl; else noimg"
                   [src]="a.imageUrl"
                   alt=""
                   class="h-56 w-full object-cover"
                   loading="lazy"/>
              <ng-template #noimg>
                <div class="h-56 w-full"></div>
              </ng-template>
            </div>

            <div class="p-5">
              <div class="text-white/60 text-xs">
                {{ a.category }} • {{ a.createdAt | date:'mediumDate' }}
              </div>

              <div class="mt-2 text-lg font-semibold">{{ a.title }}</div>
              <div class="mt-2 text-white/70 text-sm">{{ excerpt(a.content) }}</div>

              <div class="mt-4 flex items-center gap-3 text-white/60 text-sm">
                <span>👍 {{ a.likeCount }}</span>
                <span>🙂 {{ a.smileCount }}</span>
                <span>😕 {{ a.sadCount }}</span>
              </div>
            </div>
          </a>
        </div>

        <div class="mt-10 text-white/50 text-sm" *ngIf="!loading() && items().length === 0">
          {{ 'CATALOG.EMPTY' | translate }}
        </div>
      </div>
    </div>
  `,
})
export class CatalogPage {
  private articles = inject(ArticleService);
  private state = inject(CatalogStateService);
  private destroyRef = inject(DestroyRef);

  readonly items = computed(() => this.articles.items());
  readonly loading = computed(() => this.articles.loading());

  private readonly take = 12;
  private sub?: Subscription;

  constructor() {
    // ✅ автоматично перезавантажуємо, коли navbar змінює query/category
    effect(() => {
      const q = (this.state.query() ?? '').trim();
      const category = this.state.category() || undefined;

      // ✅ скасовуємо попередній запит, щоб не було race-condition
      this.sub?.unsubscribe();
      this.sub = this.articles.search$({
        q: q ? q : undefined,
        category: category as any,
        skip: 0,
        take: this.take,
      }).subscribe({
        next: res => {
          this.articles.items.set(res.items);
          this.articles.total.set(res.total);
        },
        error: () => {
          // якщо хочеш — підключимо Toast тут, але без заморочок залишаю так
          this.articles.items.set([]);
          this.articles.total.set(0);
        },
      });
    });

    this.destroyRef.onDestroy(() => this.sub?.unsubscribe());
  }

  excerpt(s: string) {
    const t = (s ?? '').trim().replace(/\s+/g, ' ');
    return t.length > 90 ? t.slice(0, 90) + '…' : t;
  }

  trackById(_: number, a: ArticleDto) {
    return a.id;
  }
}
