// i18n.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

type Lang = 'uk' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private tr = inject(TranslateService);

  // Сигнал для поточної мови
  readonly lang = signal<Lang>('uk');

  init() {
    // Зчитуємо з localStorage або беремо 'uk'
    const saved = (localStorage.getItem('lang') as Lang) || 'uk';

    this.tr.addLangs(['uk', 'en']);
    this.tr.setDefaultLang('uk'); // Мова "за замовчуванням", якщо переклад не знайдено

    this.use(saved);
  }

  use(lang: Lang) {
    this.lang.set(lang);
    localStorage.setItem('lang', lang);
    this.tr.use(lang); // subscribe тут не обов'язковий, воно працює і так
  }

  toggle() {
    const newLang = this.lang() === 'uk' ? 'en' : 'uk';
    this.use(newLang);
  }

  // Для відображення на кнопці (UA / EN)
  get label() {
    return this.lang() === 'uk' ? 'UA' : 'EN';
  }
}
