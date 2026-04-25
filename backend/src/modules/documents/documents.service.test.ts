import { describe, expect, it, vi } from 'vitest';
import { DocumentsService } from './documents.service.js';
import type { DocumentsRepository } from './documents.repository.js';

function createService() {
  const repo = {
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as DocumentsRepository;

  const service = new DocumentsService(repo);

  return {
    service,
    repo: repo as unknown as {
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    },
  };
}

describe('DocumentsService tenant-scoped write operations', () => {
  it('rejects update when document is outside tenant scope', async () => {
    const { service, repo } = createService();
    repo.update.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', 'doc-1', 'owner-1', { title: 'New title' })
    ).rejects.toThrow('Document not found');
  });

  it('rejects delete when document is outside tenant scope', async () => {
    const { service, repo } = createService();
    repo.delete.mockResolvedValue(false);

    await expect(service.delete('tenant-1', 'doc-1')).rejects.toThrow('Document not found');
  });
});
