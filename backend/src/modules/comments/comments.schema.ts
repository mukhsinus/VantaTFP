import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  parentCommentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
