import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  uploadImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);

    const origin = new URL(environment.apiBaseUrl).origin;

    return this.http.post<{ url: string }>(`${origin}/api/uploads/images`, fd);
  }
}
