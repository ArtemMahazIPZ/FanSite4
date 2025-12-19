import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { I18nService } from './core/i18n/i18n.service';
import { AuthService } from './core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <fs-navbar></fs-navbar>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  private i18n = inject(I18nService);
  private auth = inject(AuthService);

  constructor() {
    this.i18n.init();
    this.auth.hydrate();
  }
}
