import { ArticleCategory } from './enums';

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface ArticleDto {
  id: number;
  title: string;
  content: string;
  category: ArticleCategory;
  imageUrl?: string | null;
  createdAt?: string;

  likeCount?: number;
  smileCount?: number;
  sadCount?: number;
}

export interface ArticleUpsertRequest {
  title: string;
  category: ArticleCategory;
  imageUrl: string;
  content: string;
}

export interface SearchArticlesRequest {
  q?: string;
  category?: ArticleCategory | 'All';
  skip: number;
  take: number;
}
