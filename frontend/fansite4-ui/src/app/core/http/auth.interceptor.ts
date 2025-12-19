import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../tokens';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = inject(API_BASE_URL);
  const auth = inject(AuthService);

  const isApi = req.url.startsWith(apiBase);

  let cloned = isApi ? req.clone({ withCredentials: true }) : req;

  const token = auth.getAccessToken(); // ✅ стабільно
  if (isApi && token) {
    cloned = cloned.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(cloned);
};
