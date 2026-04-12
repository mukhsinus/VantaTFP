import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(100000).default(''),
  contentType: z.enum(['markdown', 'richtext']).default('markdown'),
  projectId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  icon: z.string().max(50).optional(),
  isTemplate: z.boolean().default(false),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().max(100000).optional(),
  icon: z.string().max(50).optional(),
  coverUrl: z.string().url().nullable().optional(),
  archived: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const listDocumentsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  archived: z.preprocess((v) => v === 'true', z.boolean()).optional(),
  isTemplate: z.preprocess((v) => v === 'true', z.boolean()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
