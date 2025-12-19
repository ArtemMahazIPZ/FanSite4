import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ВИПРАВЛЕНО: Прибрали LoginResponse
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <mat-card class="glass-strong soft-border rounded-[28px] w-full max-w-md overflow-hidden">
        <div class="p-6 sm:p-8">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400"></div>
            <div>
              <div class="text-xl font-semibold">Sign in</div>
              <div class="text-white/60 text-sm">Admin: admin&#64;fansite4.local</div>
            </div>
          </div>

          <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" autocomplete="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input matInput [type]="hide() ? 'password' : 'text'"
                     formControlName="password" autocomplete="current-password" />
              <button type="button" mat-icon-button matSuffix (click)="hide.set(!hide())">
                <mat-icon>{{ hide() ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-flat-button color="primary"
                    class="!rounded-2xl !py-6"
                    [disabled]="loading() || form.invalid">
              <span *ngIf="!loading()">Login</span>
              <span *ngIf="loading()" class="inline-flex items-center gap-2">
              <mat-spinner diameter="18"></mat-spinner>
              Signing in...
            </span>
            </button>

            <div class="text-sm text-white/70">
              No account?
              <a routerLink="/register" class="text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
                Create one
              </a>
            </div>
          </form>
        </div>
      </mat-card>
    </div>
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly hide = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('admin@fansite4.local', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('Admin123!', [Validators.required, Validators.minLength(6)]),
  });

  submit() {
    if (this.form.invalid) {
      this.toast.error('Please fill email and password.');
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user: AuthUser) => {
        // ВИПРАВЛЕНО: completeLogin не потрібен, сервіс вже зберіг токен
        // просто перенаправляємо
        this.router.navigateByUrl('/');
        this.toast.success(`Welcome back, ${user.email}!`);
      },
      error: (err: HttpErrorResponse) => {
        const msg = extractHttpMessage(err) ?? 'Invalid credentials.';
        this.toast.error(msg);
      },
      complete: () => this.loading.set(false),
    });
  }
}

function extractHttpMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && err !== null && 'error' in err) {
    const e = err as any;
    return e?.error?.message || e?.error?.title || e?.message || null;
  }
  return null;
}
