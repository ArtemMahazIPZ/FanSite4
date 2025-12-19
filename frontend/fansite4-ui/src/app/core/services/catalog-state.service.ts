import { Injectable, signal } from '@angular/core';
import { ArticleCategory } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class CatalogStateService {
  private _query = signal<string>('');
  private _category = signal<ArticleCategory | ''>('');

  query() { return this._query(); }
  category() { return this._category(); }

  setQuery(v: string) { this._query.set(v ?? ''); }
  setCategory(v: ArticleCategory | '') { this._category.set(v ?? ''); }

  reset() {
    this._query.set('');
    this._category.set('');
  }
}
