import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../tokens';

export type AuthUser = {
  id?: string | number;
  email?: string;
  roles?: string[];
};

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { email: string; password: string };

// ВИПРАВЛЕНО: Використовуємо 'any', щоб не було помилок TS4111 (доступ через крапку)
type AnyObj = any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  private readonly LS_TOKEN = 'fs4.accessToken';
  private readonly LS_USER = 'fs4.user';

  readonly user = signal<AuthUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly loading = signal(false);

  readonly isLoggedIn = computed(() => !!this.user() || !!this.accessToken());
  readonly isAdmin = computed(() => {
    const roles = this.user()?.roles ?? [];
    return roles.some(r => String(r).toLowerCase() === 'admin');
  });

  constructor() {
    this.hydrate();
    if (!this.user()) {
      this.me().subscribe({ next: () => {}, error: () => {} });
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  clear(): void {
    this.user.set(null);
    this.accessToken.set(null);
    localStorage.removeItem(this.LS_TOKEN);
    localStorage.removeItem(this.LS_USER);
  }

  hydrate(): void {
    try {
      const token = localStorage.getItem(this.LS_TOKEN);
      const userJson = localStorage.getItem(this.LS_USER);

      if (token) this.accessToken.set(token);

      if (userJson) {
        const u = JSON.parse(userJson) as AuthUser;
        this.user.set(u);
      }
    } catch {
      this.clear();
    }
  }

  login(req: LoginRequest): Observable<AuthUser> {
    this.loading.set(true);

    const urls = [
      `${this.apiBase}/auth/login`,
      `${this.apiBase}/api/auth/login`,
    ];

    return this.tryPostAny(urls, req).pipe(
      map(res => this.normalizeAuth(res)),
      tap(({ token, user }) => this.applyAuth(token, user)),
      map(({ user }) => user ?? {}),
      catchError((e: HttpErrorResponse) => throwError(() => e)),
      finalize(() => this.loading.set(false))
    );
  }

  register(req: RegisterRequest): Observable<AuthUser> {
    this.loading.set(true);

    const urls = [
      `${this.apiBase}/auth/register`,
      `${this.apiBase}/api/auth/register`,
    ];

    return this.tryPostAny(urls, req).pipe(
      map(res => this.normalizeAuth(res)),
      tap(({ token, user }) => this.applyAuth(token, user)),
      map(({ user }) => user ?? {}),
      catchError((e: HttpErrorResponse) => throwError(() => e)),
      finalize(() => this.loading.set(false))
    );
  }

  logout(): Observable<void> {
    this.loading.set(true);

    const urls = [
      `${this.apiBase}/auth/logout`,
      `${this.apiBase}/api/auth/logout`,
    ];

    return this.tryPostAny(urls, {}).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      finalize(() => {
        this.clear();
        this.loading.set(false);
      })
    );
  }

  me(): Observable<AuthUser | null> {
    const urls = [
      `${this.apiBase}/auth/me`,
      `${this.apiBase}/api/auth/me`,
      `${this.apiBase}/account/me`,
      `${this.apiBase}/me`,
    ];

    return this.tryGetAny(urls).pipe(
      map(res => this.normalizeUser(res)),
      tap(user => {
        if (user && user.email) {
          this.user.set(user);
          localStorage.setItem(this.LS_USER, JSON.stringify(user));
        }
      }),
      catchError(() => of(null))
    );
  }

  // ===== helpers =====

  private applyAuth(token: string | null, user: AuthUser | null): void {
    if (token) {
      this.accessToken.set(token);
      localStorage.setItem(this.LS_TOKEN, token);
    }

    if (user && (user.email || user.roles?.length)) {
      this.user.set(user);
      localStorage.setItem(this.LS_USER, JSON.stringify(user));
    }
  }

  private normalizeAuth(res: AnyObj): { token: string | null; user: AuthUser | null } {
    const token =
      res?.accessToken ??
      res?.token ??
      res?.jwt ??
      res?.data?.accessToken ??
      res?.data?.token ??
      null;

    const userRaw =
      res?.user ??
      res?.profile ??
      res?.me ??
      res?.data?.user ??
      res?.data?.profile ??
      res?.data ??
      null;

    return { token: token ? String(token) : null, user: this.normalizeUser(userRaw) };
  }

  private normalizeUser(raw: any): AuthUser | null {
    if (!raw || typeof raw !== 'object') return null;

    const email = raw?.email ?? raw?.userEmail ?? raw?.username ?? raw?.login ?? null;

    // ВИПРАВЛЕНО: type 'any', бо бекенд може повернути string або array
    let roles: any = raw?.roles ?? raw?.role ?? raw?.claims?.roles ?? [];

    // Якщо прийшов рядок "Admin", робимо з нього ["Admin"]
    if (typeof roles === 'string') roles = [roles];

    return {
      id: raw?.id ?? raw?.userId ?? raw?.sub ?? undefined,
      email: email ? String(email) : undefined,
      roles: Array.isArray(roles) ? roles.map(r => String(r)) : [],
    };
  }

  private tryPostAny(urls: string[], body: any): Observable<any> {
    const [first, ...rest] = urls;
    return this.http.post<any>(first, body).pipe(
      catchError((e: HttpErrorResponse) => {
        if ((e.status === 404 || e.status === 405) && rest.length) {
          return this.tryPostAny(rest, body);
        }
        return throwError(() => e);
      })
    );
  }

  private tryGetAny(urls: string[]): Observable<any> {
    const [first, ...rest] = urls;
    return this.http.get<any>(first).pipe(
      catchError((e: HttpErrorResponse) => {
        if ((e.status === 404 || e.status === 405) && rest.length) {
          return this.tryGetAny(rest);
        }
        return throwError(() => e);
      })
    );
  }
}
