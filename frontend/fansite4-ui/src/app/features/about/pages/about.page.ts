import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
    <div class="max-w-4xl mx-auto px-4 py-10">
      <h1 class="text-3xl font-semibold">About FanSite4</h1>
      <p class="text-white/70 mt-2">Course project — Clean Architecture + Premium UI.</p>

      <div class="mt-8 grid gap-4">
        <div class="rounded-3xl bg-white/10 border border-white/10 p-6">
          <h2 class="text-xl font-semibold">Backend</h2>
          <ul class="mt-2 text-white/80 list-disc pl-5">
            <li>ASP.NET Core Web API (.NET 10)</li>
            <li>EF Core Code-First + SQL Server</li>
            <li>Identity + JWT (Access/Refresh)</li>
            <li>Reactions toggle (composite key UserId + ArticleId)</li>
            <li>Reports admin workflow (Dismiss/Resolve)</li>
          </ul>
        </div>

        <div class="rounded-3xl bg-white/10 border border-white/10 p-6">
          <h2 class="text-xl font-semibold">Frontend</h2>
          <ul class="mt-2 text-white/80 list-disc pl-5">
            <li>Angular Standalone Components</li>
            <li>Signals for UI state + optimistic updates</li>
            <li>Angular Material + Tailwind (premium layout)</li>
            <li>Functional Interceptors/Guards</li>
          </ul>
        </div>

        <a routerLink="/" class="text-white/70 hover:text-white">← Back to catalog</a>
      </div>
    </div>
  </div>
  `,
})
export class AboutPage {}
