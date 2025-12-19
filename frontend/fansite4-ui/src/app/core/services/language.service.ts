import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'uk' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private tr = inject(TranslateService);

  private readonly _lang = signal<AppLang>('uk');
  readonly lang = this._lang.asReadonly();

  init() {
    const saved = (localStorage.getItem('lang') as AppLang | null) ?? 'uk';
    this.set(saved);
  }

  set(l: AppLang) {
    this._lang.set(l);
    localStorage.setItem('lang', l);
    this.tr.use(l);
  }

  toggle() {
    this.set(this._lang() === 'uk' ? 'en' : 'uk');
  }

  label() {
    return this._lang() === 'uk' ? 'ua' : 'en';
  }
}
