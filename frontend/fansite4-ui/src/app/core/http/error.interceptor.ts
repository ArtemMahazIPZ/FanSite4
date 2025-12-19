import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401) {
        auth.clear();
        if (!router.url.startsWith('/login') && !router.url.startsWith('/register')) {
          toast.error('Unauthorized. Please sign in again.');
          router.navigateByUrl('/login');
        }
      } else if (e.status >= 500) {
        toast.error('Server error. Please try again.');
      }
      return throwError(() => e);
    })
  );
};
