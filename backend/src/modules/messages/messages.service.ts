import { MessagesRepository } from './messages.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import type { CreateConversationBody, SendMessageBody, ListMessagesQuery } from './messages.schema.js';

export class MessagesService {
  constructor(
    private readonly repo: MessagesRepository,
    private readonly wsEmit?: (event: string, room: string, data: unknown) => void
  ) {}

  async createConversation(tenantId: string, userId: string, body: CreateConversationBody) {
    return this.repo.createConversation({
      tenantId,
      createdBy: userId,
      name: body.name,
      type: body.type,
      memberIds: body.memberIds,
    });
  }

  async listConversations(tenantId: string, userId: string) {
    return this.repo.listConversationsForUser(tenantId, userId);
  }

  async sendMessage(
    tenantId: string,
    conversationId: string,
    senderId: string,
    body: SendMessageBody
  ) {
    const isMember = await this.repo.isMember(conversationId, senderId);
    if (!isMember) {
      throw ApplicationError.forbidden('You are not a member of this conversation');
    }

    const message = await this.repo.sendMessage({
      tenantId,
      conversationId,
      senderId,
      body: body.body,
      attachmentUrl: body.attachmentUrl,
      attachmentName: body.attachmentName,
    });

    // Push real-time notification to conversation room via WebSocket
    if (this.wsEmit) {
      this.wsEmit('message:new', `conversation:${conversationId}`, message);
    }

    return message;
  }

  async listMessages(conversationId: string, userId: string, query: ListMessagesQuery) {
    const isMember = await this.repo.isMember(conversationId, userId);
    if (!isMember) {
      throw ApplicationError.forbidden('You are not a member of this conversation');
    }
    return this.repo.listMessages(conversationId, query.limit, query.before);
  }

  async markRead(conversationId: string, userId: string) {
    const isMember = await this.repo.isMember(conversationId, userId);
    if (!isMember) {
      throw ApplicationError.forbidden('You are not a member of this conversation');
    }
    return this.repo.markRead(conversationId, userId);
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.repo.deleteMessage(messageId, userId);
  }
}
