export interface CommentDto {
  id: number;
  authorEmail: string;
  text: string;
  createdAtUtc: string;

  canDelete?: boolean;
}

export interface CreateCommentRequest {
  text: string;
}
