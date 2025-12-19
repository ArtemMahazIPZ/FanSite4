import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] flex items-center justify-center px-4 text-white">
    <div class="max-w-lg w-full rounded-3xl bg-white/10 border border-white/10 p-8 text-center">
      <h1 class="text-2xl font-semibold">Access denied</h1>
      <p class="text-white/70 mt-2">You don’t have permission to view this page.</p>
      <a routerLink="/" class="inline-block mt-6 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20">
        Go to catalog
      </a>
    </div>
  </div>
  `,
})
export class AccessDeniedPage {}
