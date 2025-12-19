import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-linear-to-b from-[#0B1020] to-[#070A14] flex items-center justify-center px-4">
      <mat-card class="w-full max-w-md bg-white/10! border! border-white/10! rounded-3xl! p-6 text-white">
        <h2 class="text-xl font-semibold">Create account</h2>

        <form class="mt-5 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" autocomplete="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
          </mat-form-field>

          <button mat-raised-button type="submit"
                  [disabled]="loading() || form.invalid"
                  class="rounded-2xl!">
            {{ loading() ? 'Creating...' : 'Register' }}
          </button>

          <div class="text-sm text-white/70">
            Already have an account?
            <a routerLink="/login" class="text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
              Sign in
            </a>
          </div>
        </form>
      </mat-card>
    </div>
  `,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  submit() {
    if (this.form.invalid) return;

    this.loading.set(true);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Account created!');
        this.router.navigateByUrl('/login');
      },
      error: (e: HttpErrorResponse) => {
        const msg = (e?.error as any)?.message ?? 'Registration failed';
        this.toast.error(msg);
      },
      complete: () => this.loading.set(false),
    });
  }
}
