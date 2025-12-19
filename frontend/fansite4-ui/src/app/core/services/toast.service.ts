import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);

  success(msg: string) {
    this.snack.open(msg, 'OK', { duration: 2500 });
  }
  error(msg: string) {
    this.snack.open(msg, 'OK', { duration: 4000 });
  }
}
