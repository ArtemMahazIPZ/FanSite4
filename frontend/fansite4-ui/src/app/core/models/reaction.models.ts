import { ReactionType } from './enums';

export interface ToggleReactionRequest {
  articleId: number;
  type: ReactionType;
}
