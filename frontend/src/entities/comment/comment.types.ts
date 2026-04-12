export interface CommentApiDto {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  parentCommentId: string | null;
  body: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponse {
  data: CommentApiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCommentPayload {
  body: string;
  parentCommentId?: string;
}

export interface UpdateCommentPayload {
  body: string;
}
