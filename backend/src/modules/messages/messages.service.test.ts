import { describe, expect, it, vi } from 'vitest';
import { MessagesService } from './messages.service.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

describe('MessagesService tenant-scoped membership checks', () => {
  it('checks membership using tenant scope before listing messages', async () => {
    const repo = {
      isMember: vi.fn(async () => false),
      listMessages: vi.fn(async () => []),
    } as unknown as {
      isMember: (tenantId: string, conversationId: string, userId: string) => Promise<boolean>;
      listMessages: (
        tenantId: string,
        conversationId: string,
        limit: number,
        before?: string
      ) => Promise<unknown[]>;
    };

    const service = new MessagesService(repo as never);

    await expect(
      service.listMessages('tenant-1', 'conv-1', 'user-1', { limit: 20 })
    ).rejects.toBeInstanceOf(ApplicationError);

    expect(repo.isMember).toHaveBeenCalledWith('tenant-1', 'conv-1', 'user-1');
    expect(repo.listMessages).not.toHaveBeenCalled();
  });
});
