import { z } from 'zod';

export const conversationIdParamSchema = z.object({ id: z.string().uuid() });
export const messageIdParamSchema = z.object({ messageId: z.string().uuid() });

export const createConversationSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
  name: z.string().max(255).optional(),
  type: z.enum(['direct', 'group']).default('direct'),
});

export const sendMessageSchema = z.object({
  body: z.string().max(4000).optional(),
  attachmentUrl: z.string().url().max(1000).optional(),
  attachmentName: z.string().max(255).optional(),
}).refine((d) => d.body || d.attachmentUrl, {
  message: 'Message must have a body or an attachment',
});

export const listMessagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateConversationBody = z.infer<typeof createConversationSchema>;
export type SendMessageBody = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
