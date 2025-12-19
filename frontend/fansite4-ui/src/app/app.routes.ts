import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/articles/pages/catalog.page').then(m => m.CatalogPage),
  },
  {
    path: 'articles/:id',
    loadComponent: () =>
      import('./features/articles/pages/details.page').then(m => m.DetailsPage),
  },

  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/pages/about.page').then(m => m.AboutPage),
  },

  // auth
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register.page').then(m => m.RegisterPage),
  },

  // account
  {
    path: 'account',
    loadComponent: () =>
      import('./features/account/pages/account.page').then(m => m.AccountPage),
  },

  // admin
  {
    path: 'admin/articles',
    loadComponent: () =>
      import('./features/admin/pages/articles.page').then(m => m.AdminArticlesPage),
  },
  {
    path: 'admin/articles/new',
    loadComponent: () =>
      import('./features/admin/pages/article-editor.page').then(m => m.ArticleEditorPage),
  },
  {
    path: 'admin/articles/:id/edit',
    loadComponent: () =>
      import('./features/admin/pages/article-editor.page').then(m => m.ArticleEditorPage),
  },
  {
    path: 'admin/reports',
    loadComponent: () =>
      import('./features/admin/pages/reports.page').then(m => m.AdminReportsPage),
  },

  // system
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/system/pages/access-denied.page').then(m => m.AccessDeniedPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/system/pages/not-found.page').then(m => m.NotFoundPage),
  },
];
