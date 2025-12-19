import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';

import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/tokens';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

class AssetsTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get<TranslationObject>(`/assets/i18n/${lang}.json`);
  }
}

export function translateLoaderFactory(http: HttpClient) {
  return new AssetsTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideAnimations(),

    { provide: API_BASE_URL, useValue: 'http://localhost:5183' },

    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    importProvidersFrom(
      MatSnackBarModule,
      TranslateModule.forRoot({
        // ❌ ВИДАЛЕНО: defaultLang та fallbackLang тут не потрібні й викликають помилку.
        // ✅ Цю логіку вже виконує твій I18nService у методі init()
        loader: {
          provide: TranslateLoader,
          useFactory: translateLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
