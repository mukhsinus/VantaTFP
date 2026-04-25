import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service.js';
import type { TasksRepository } from './tasks.repository.js';
import type { BillingService } from '../billing/billing.service.js';

function createService() {
  const tasksRepository = {
    findByIdAndTenant: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    createAuditLog: vi.fn(),
    insertTaskHistory: vi.fn(),
  } as unknown as TasksRepository;

  const billing = {} as BillingService;
  const service = new TasksService(tasksRepository, billing);

  return {
    service,
    tasksRepository: tasksRepository as unknown as {
      findByIdAndTenant: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      createAuditLog: ReturnType<typeof vi.fn>;
      insertTaskHistory: ReturnType<typeof vi.fn>;
    },
  };
}

describe('TasksService tenant-scoped write operations', () => {
  it('rejects update when task is outside tenant scope', async () => {
    const { service, tasksRepository } = createService();
    tasksRepository.findByIdAndTenant.mockResolvedValue(null);

    await expect(
      service.updateTask(
        'task-1',
        'tenant-1',
        'owner-1',
        {
          title: 'Updated title',
          description: undefined,
          assigneeId: undefined,
          deadline: undefined,
          completedAt: undefined,
          priority: undefined,
          status: undefined,
        },
        { actingSuperAdmin: false }
      )
    ).rejects.toThrow('Task not found');
  });

  it('rejects delete when task is outside tenant scope', async () => {
    const { service, tasksRepository } = createService();
    tasksRepository.findByIdAndTenant.mockResolvedValue(null);

    await expect(
      service.deleteTask('task-1', 'tenant-1', 'owner-1', {
        actingSuperAdmin: false,
      })
    ).rejects.toThrow('Task not found');
    expect(tasksRepository.delete).not.toHaveBeenCalled();
  });

  it('blocks employee from updating someone else task', async () => {
    const { service, tasksRepository } = createService();
    tasksRepository.findByIdAndTenant.mockResolvedValue({
      id: 'task-1',
      tenant_id: 'tenant-1',
      title: 'Task',
      description: null,
      assignee_id: 'employee-2',
      status: 'TODO',
      priority: 'MEDIUM',
      deadline: null,
      completed_at: null,
      created_by: 'owner-1',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(
      service.updateTask(
        'task-1',
        'tenant-1',
        'employee-1',
        {
          title: undefined,
          description: undefined,
          assigneeId: undefined,
          deadline: undefined,
          completedAt: undefined,
          priority: undefined,
          status: 'IN_PROGRESS',
        },
        { actingSuperAdmin: false, actorTenantRole: 'employee' }
      )
    ).rejects.toThrow('Employees can only update their assigned tasks');
    expect(tasksRepository.update).not.toHaveBeenCalled();
  });

  it('blocks employee from editing non-status fields', async () => {
    const { service, tasksRepository } = createService();
    tasksRepository.findByIdAndTenant.mockResolvedValue({
      id: 'task-1',
      tenant_id: 'tenant-1',
      title: 'Task',
      description: null,
      assignee_id: 'employee-1',
      status: 'TODO',
      priority: 'MEDIUM',
      deadline: null,
      completed_at: null,
      created_by: 'owner-1',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(
      service.updateTask(
        'task-1',
        'tenant-1',
        'employee-1',
        {
          title: 'Edited by employee',
          description: undefined,
          assigneeId: undefined,
          deadline: undefined,
          completedAt: undefined,
          priority: undefined,
          status: undefined,
        },
        { actingSuperAdmin: false, actorTenantRole: 'employee' }
      )
    ).rejects.toThrow('Employees can only change task status');
    expect(tasksRepository.update).not.toHaveBeenCalled();
  });
});
