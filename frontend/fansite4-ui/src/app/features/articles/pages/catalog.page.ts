import { Component, computed, effect, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { ArticleService } from '../../../core/services/article.service';
import { CatalogStateService } from '../../../core/services/catalog-state.service';
import { ArticleDto } from '../../../core/models/article.models';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, TranslateModule],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-6xl mx-auto px-4 py-10">
        <div>
          <h1 class="text-3xl font-semibold">{{ 'catalog.title' | translate }}</h1>
          <p class="text-white/70 mt-2">{{ 'catalog.subtitle' | translate }}</p>
        </div>

        <div *ngIf="loading()" class="mt-8 text-white/70">{{ 'catalog.loading' | translate }}</div>

        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!loading()">
          <a *ngFor="let a of items(); trackBy: trackById"
             [routerLink]="['/articles', a.id]"
             class="rounded-3xl overflow-hidden bg-white/10 border border-white/10 hover:border-white/20 transition">
            <div class="h-56 bg-black/20">
              <img *ngIf="a.imageUrl; else noimg" [src]="a.imageUrl" alt=""
                   class="h-56 w-full object-cover" loading="lazy"/>
              <ng-template #noimg>
                <div class="h-56 w-full"></div>
              </ng-template>
            </div>

            <div class="p-5">
              <div class="text-white/60 text-xs">{{ a.category }} • {{ a.createdAt | date:'mediumDate' }}</div>
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
          {{ 'catalog.empty' | translate }}
        </div>
      </div>
    </div>
  `
})
export class CatalogPage {
  private articles = inject(ArticleService);
  private state = inject(CatalogStateService);

  readonly items = computed(() => this.articles.items());
  readonly loading = computed(() => this.articles.loading());

  constructor() {
    effect(() => {
      const q = this.state.query().trim();
      const cat = this.state.category() || undefined;

      this.articles.search({
        q: q ? q : undefined,
        category: cat as any,
        skip: 0,
        take: 12
      });
    });
  }

  excerpt(s: string) {
    const t = (s ?? '').trim().replace(/\s+/g, ' ');
    return t.length > 90 ? t.slice(0, 90) + '…' : t;
  }

  trackById(_: number, a: ArticleDto) {
    return a.id;
  }
}
