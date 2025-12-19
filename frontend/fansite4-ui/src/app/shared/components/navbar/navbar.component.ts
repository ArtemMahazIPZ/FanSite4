import { Component, OnDestroy, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Subscription, isObservable } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ArticleService } from '../../../core/services/article.service';
import { ArticleCategory } from '../../../core/models/enums';

@Component({
  standalone: true,
  selector: 'fs-navbar',
  imports: [
    RouterLink, NgIf, ReactiveFormsModule,
    MatButtonModule, MatMenuModule, MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="sticky top-0 z-50 bg-[#0B1020]/70 backdrop-blur border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">

        <a routerLink="/" class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-400 to-fuchsia-500"></div>
          <div class="text-white font-semibold text-lg">FanSite4</div>
        </a>

        <div class="hidden md:flex items-center gap-3 flex-1 mx-4">
          <select
            [formControl]="category"
            class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white outline-none hover:bg-white/15 min-w-[140px]"
            aria-label="Category"
          >
            <option value="All">{{ 'nav.filterAll' | translate }}</option>
            <option value="Person">{{ 'nav.filterPerson' | translate }}</option>
            <option value="Weapon">{{ 'nav.filterWeapon' | translate }}</option>
            <option value="Mission">{{ 'nav.filterMission' | translate }}</option>
          </select>

          <input
            [formControl]="q"
            type="text"
            class="w-full px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white outline-none placeholder:text-white/50 focus:border-white/20"
            [placeholder]="'nav.searchPlaceholder' | translate"
          />
        </div>

        <div class="flex-1 md:hidden"></div>

        <button mat-stroked-button class="rounded-2xl! text-white!" (click)="i18n.toggle()">
          {{ i18n.label }}
        </button>

        <a routerLink="/about" class="text-white/70 hover:text-white px-3 py-2">
          {{ 'nav.about' | translate }}
        </a>

        <ng-container *ngIf="auth.isAdmin()">
          <button mat-stroked-button class="rounded-2xl! text-white!"
                  [matMenuTriggerFor]="adminMenu">
            <mat-icon class="!text-white">shield</mat-icon>
            <span class="ml-2">{{ 'nav.admin' | translate }}</span>
            <mat-icon class="ml-1 !text-white">expand_more</mat-icon>
          </button>

          <mat-menu #adminMenu="matMenu">
            <button mat-menu-item (click)="go('/admin/articles/new')">
              <mat-icon>add</mat-icon>
              <span>{{ 'nav.newArticle' | translate }}</span>
            </button>
            <button mat-menu-item (click)="go('/admin/reports')">
              <mat-icon>flag</mat-icon>
              <span>{{ 'nav.reports' | translate }}</span>
            </button>
            <button mat-menu-item (click)="go('/admin/articles')">
              <mat-icon>list</mat-icon>
              <span>{{ 'nav.articles' | translate }}</span>
            </button>
          </mat-menu>
        </ng-container>

        <button mat-icon-button class="!text-white" [matMenuTriggerFor]="accountMenu" aria-label="Account">
          <mat-icon class="!text-white">account_circle</mat-icon>
        </button>

        <mat-menu #accountMenu="matMenu">
          <ng-container *ngIf="!auth.isLoggedIn(); else loggedBlock">
            <button mat-menu-item (click)="go('/login')">
              <mat-icon>login</mat-icon>
              <span>{{ 'nav.login' | translate }}</span>
            </button>
            <button mat-menu-item (click)="go('/register')">
              <mat-icon>person_add</mat-icon>
              <span>{{ 'nav.register' | translate }}</span>
            </button>
          </ng-container>

          <ng-template #loggedBlock>
            <button mat-menu-item (click)="go('/account')">
              <mat-icon>manage_accounts</mat-icon>
              <span>{{ 'nav.account' | translate }}</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>{{ 'nav.logout' | translate }}</span>
            </button>
          </ng-template>
        </mat-menu>

      </div>

      <div class="md:hidden px-4 pb-3 flex gap-3">
        <select
          [formControl]="category"
          class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white outline-none hover:bg-white/15"
        >
          <option value="All">{{ 'nav.filterAll' | translate }}</option>
          <option value="Person">{{ 'nav.filterPerson' | translate }}</option>
          <option value="Weapon">{{ 'nav.filterWeapon' | translate }}</option>
          <option value="Mission">{{ 'nav.filterMission' | translate }}</option>
        </select>

        <input
          [formControl]="q"
          class="w-full px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white outline-none placeholder:text-white/50"
          [placeholder]="'nav.searchPlaceholder' | translate"
        />
      </div>
    </div>
  `,
})
export class NavbarComponent implements OnDestroy {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);
  private articles = inject(ArticleService);

  readonly q = new FormControl<string>('', { nonNullable: true });
  readonly category = new FormControl<string>('All', { nonNullable: true });

  private sub = new Subscription();

  constructor() {
    this.sub.add(
      combineLatest([
        this.q.valueChanges.pipe(startWith(this.q.value), debounceTime(250), distinctUntilChanged()),
        this.category.valueChanges.pipe(startWith(this.category.value), distinctUntilChanged()),
      ]).subscribe(([q, cat]) => {
        const query = q?.trim() || undefined;
        const category = cat && cat !== 'All' ? (cat as ArticleCategory) : undefined;

        this.articles.search({ q: query, category, skip: 0, take: 12 });
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  go(url: string) {
    this.router.navigateByUrl(url);
  }

  logout() {
    // Безпечний виклик logout
    const result = this.auth.logout();

    // Якщо повернувся Observable (що найімовірніше)
    if (isObservable(result)) {
      result.subscribe({
        next: () => this.finalizeLogout(),
        error: () => this.finalizeLogout()
      });
    } else {
      // Якщо синхронно
      this.finalizeLogout();
    }
  }

  private finalizeLogout() {
    this.auth.clear(); // Очищаємо локальний стан
    this.go('/');      // Редірект
  }
}
