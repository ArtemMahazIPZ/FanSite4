import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToggleReactionRequest } from '../models/reaction.models';
import { ReactionType } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class ReactionService {
  private http = inject(HttpClient);

  toggle(req: ToggleReactionRequest) {
    return this.http.post<void>(`${environment.apiBaseUrl}/reactions/toggle`, req);
  }

  mine(articleId: number) {
    return this.http.get<{ articleId: number; reaction: ReactionType | null }>(
      `${environment.apiBaseUrl}/reactions/mine/${articleId}`
    );
  }
}
