import { describe, expect, it } from 'vitest';
import { ReportsService } from './reports.service.js';
import type { ReportsRepository } from './reports.repository.js';

function createService() {
  const repo = {
    resolveAssigneeIds: async () => [],
    findUsersByIds: async () => [],
    getTaskSummaries: async () => [],
    insertHistory: async () => ({ id: 'history-1' }),
  } as unknown as ReportsRepository;

  return new ReportsService(repo);
}

describe('ReportsService access control', () => {
  it('prevents employee from requesting other user reports', async () => {
    const service = createService();

    await expect(
      service.generateReport(
        'tenant-1',
        { userId: 'employee-1', tenantRole: 'employee', systemRole: 'user' },
        {
          type: 'TASKS',
          dateFrom: '2026-04-01T00:00:00.000Z',
          dateTo: '2026-04-30T23:59:59.000Z',
          userId: 'employee-2',
        }
      )
    ).rejects.toThrow('You can only access your own reports');
  });

  it('prevents manager from querying another team', async () => {
    const service = createService();

    await expect(
      service.generateReport(
        'tenant-1',
        { userId: 'manager-1', tenantRole: 'manager', systemRole: 'user' },
        {
          type: 'KPI',
          dateFrom: '2026-04-01T00:00:00.000Z',
          dateTo: '2026-04-30T23:59:59.000Z',
          teamId: 'manager-2',
        }
      )
    ).rejects.toThrow('Managers can only access their own team');
  });
});
