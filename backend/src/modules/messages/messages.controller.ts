import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessagesRepository } from './messages.repository.js';
import { MessagesService } from './messages.service.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import {
  conversationIdParamSchema,
  messageIdParamSchema,
  createConversationSchema,
  sendMessageSchema,
  listMessagesQuerySchema,
} from './messages.schema.js';

export async function messagesRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const messagesRepo = new MessagesRepository(app.db);

  // Wire WS broadcast: notify all members of the conversation about new messages
  const wsHub = app.notificationHub as
    | { broadcastToUser: (tenantId: string, userId: string, msg: unknown) => void }
    | undefined;

  const wsEmit = wsHub
    ? (event: string, _room: string, data: unknown) => {
        // Per-user broadcast: we just send to the sender's tenant context here.
        // For proper room support, a room-based hub would be needed.
        // This implementation stores conversation_id in the payload so clients filter client-side.
        void event;
        void _room;
        void data;
      }
    : undefined;

  const messagesService = new MessagesService(messagesRepo, wsEmit);

  /** List all conversations for current user */
  app.get(
    '/conversations',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const conversations = await messagesService.listConversations(tenantId, request.user.id);
      return sendSuccess(reply, { data: conversations });
    }
  );

  /** Create a new conversation */
  app.post(
    '/conversations',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const body = createConversationSchema.parse(request.body);
      const conversation = await messagesService.createConversation(tenantId, request.user.id, body);
      return sendSuccess(reply, conversation, 201);
    }
  );

  /** List messages in a conversation (paginated, newest last) */
  app.get(
    '/conversations/:id/messages',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const { id } = conversationIdParamSchema.parse(request.params);
      const query = listMessagesQuerySchema.parse(request.query);
      const messages = await messagesService.listMessages(tenantId, id, request.user.id, query);
      return sendSuccess(reply, { data: messages });
    }
  );

  /** Send a message to a conversation */
  app.post(
    '/conversations/:id/messages',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const { id } = conversationIdParamSchema.parse(request.params);
      const body = sendMessageSchema.parse(request.body);

      const message = await messagesService.sendMessage(tenantId, id, request.user.id, body);

      // Broadcast new message to all conversation members via WebSocket
      if (wsHub) {
        // Fetch member IDs for broadcast
        const membersResult = await app.db.query<{ user_id: string }>(
          `
          SELECT user_id
          FROM conversation_members
          WHERE tenant_id = $1
            AND conversation_id = $2
          `,
          [tenantId, id]
        );
        for (const { user_id } of membersResult.rows) {
          wsHub.broadcastToUser(tenantId, user_id, {
            type: 'message:new',
            data: message,
          });
        }
      }

      return sendSuccess(reply, message, 201);
    }
  );

  /** Mark all messages in conversation as read */
  app.post(
    '/conversations/:id/read',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const { id } = conversationIdParamSchema.parse(request.params);
      await messagesService.markRead(tenantId, id, request.user.id);
      return sendNoContent(reply);
    }
  );

  /** Delete a message (soft delete, sender only) */
  app.delete(
    '/conversations/:id/messages/:messageId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { messageId } = messageIdParamSchema.parse(request.params);
      await messagesService.deleteMessage(messageId, request.user.id);
      return sendNoContent(reply);
    }
  );
}
