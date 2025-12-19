import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] flex items-center justify-center px-4 text-white">
      <mat-card class="w-full max-w-md bg-white/10! border! border-white/10! rounded-3xl! p-6">
        <h2 class="text-xl font-semibold">Account</h2>

        <div class="mt-4 text-white/80">
          <div><span class="text-white/60">Email:</span> {{ email() }}</div>
          <div class="mt-1"><span class="text-white/60">Roles:</span> {{ roles() }}</div>
        </div>

        <div class="mt-6 flex gap-2">
          <a routerLink="/" mat-stroked-button class="!border-white/15 !text-white !rounded-2xl">Home</a>
          <button mat-raised-button class="rounded-2xl!" (click)="logout()">Logout</button>
        </div>
      </mat-card>
    </div>
  `,
})
export class AccountPage {
  private auth = inject(AuthService);

  email = computed(() => this.auth.user()?.email ?? '');

  // ВИПРАВЛЕНО: user.roles замість user.role. Об'єднуємо в рядок, якщо їх декілька.
  roles = computed(() => this.auth.user()?.roles?.join(', ') ?? 'User');

  logout() { this.auth.logout(); }
}
