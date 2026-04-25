import { describe, expect, it } from 'vitest';
import { UsersService } from '../modules/users/users.service.js';
import { TasksService } from '../modules/tasks/tasks.service.js';
import { PaymentsService } from '../modules/payments/payments.service.js';
import type { UsersRepository } from '../modules/users/users.repository.js';
import type { EmployeesRepository } from '../modules/employees/employees.repository.js';
import type { BillingService } from '../modules/billing/billing.service.js';
import type { TasksRepository } from '../modules/tasks/tasks.repository.js';
import type { PaymentsRepository } from '../modules/payments/payments.repository.js';

describe('Revenue workflow integration', () => {
  it('covers employee creation, task lifecycle seed, and payment approval happy path', async () => {
    const usersStore = new Map<string, { id: string; email: string; role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' }>();
    const tasksStore = new Map<string, { id: string; tenant_id: string; title: string; status: string }>();
    const paymentsStore = new Map<
      string,
      { id: string; tenant_id: string; status: 'pending' | 'confirmed'; plan_name: string; amount: number }
    >();

    const billing = {
      runAtomicUserCreation: async (_tenantId: string, _opts: unknown, fn: (tx: unknown) => Promise<unknown>) =>
        fn({}),
      runAtomicTaskCreation: async (_tenantId: string, fn: (tx: unknown) => Promise<unknown>) => fn({}),
      createUpgradePaymentRequest: async (
        tenantId: string,
        _userId: string,
        plan: 'basic' | 'pro' | 'business' | 'enterprise'
      ) => {
        const id = 'payment-1';
        paymentsStore.set(id, {
          id,
          tenant_id: tenantId,
          status: 'pending',
          plan_name: plan,
          amount: 10,
        });
        return { id };
      },
      approvePaymentRequest: async (id: string) => {
        const row = paymentsStore.get(id);
        if (!row) throw new Error('missing payment');
        row.status = 'confirmed';
      },
    } as unknown as BillingService;

    const usersRepo = {
      findByEmail: async (email: string) => [...usersStore.values()].find((u) => u.email === email) ?? null,
      findByIdAndTenant: async () => null,
      create: async (payload: {
        tenant_id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
        manager_id: string | null;
        is_active: boolean;
      }) => {
        const id = 'employee-1';
        usersStore.set(id, { id, email: payload.email, role: payload.role });
        return {
          id,
          tenant_id: payload.tenant_id,
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          role: payload.role,
          manager_id: payload.manager_id,
          is_active: payload.is_active,
          created_at: new Date(),
        };
      },
    } as unknown as UsersRepository;

    const employeesRepo = {
      upsertTenantMembership: async () => {},
    } as unknown as EmployeesRepository;

    const tasksRepo = {
      existsAssigneeInTenant: async () => true,
      createWithExecutor: async (payload: {
        tenant_id: string;
        title: string;
        description: string | null;
        assignee_id: string | null;
        status: string;
        priority: string;
        deadline: Date | null;
        completed_at: Date | null;
        created_by: string;
      }) => {
        const id = 'task-1';
        tasksStore.set(id, { id, tenant_id: payload.tenant_id, title: payload.title, status: payload.status });
        return {
          id,
          tenant_id: payload.tenant_id,
          title: payload.title,
          description: payload.description,
          assignee_id: payload.assignee_id,
          status: payload.status,
          priority: payload.priority,
          deadline: payload.deadline,
          completed_at: payload.completed_at,
          created_by: payload.created_by,
          created_at: new Date(),
          updated_at: new Date(),
        };
      },
      createAuditLog: async () => {},
    } as unknown as TasksRepository;

    const paymentsRepo = {
      findById: async (id: string, tenantId?: string) => {
        const row = paymentsStore.get(id);
        if (!row) return null;
        if (tenantId && row.tenant_id !== tenantId) return null;
        return { ...row, amount: String(row.amount) };
      },
      listByTenant: async (tenantId: string) =>
        [...paymentsStore.values()]
          .filter((r) => r.tenant_id === tenantId)
          .map((r) => ({ ...r, amount: String(r.amount) })),
      listPending: async () =>
        [...paymentsStore.values()]
          .filter((r) => r.status === 'pending')
          .map((r) => ({ ...r, amount: String(r.amount) })),
      reject: async () => {
        throw new Error('not used in this test');
      },
    } as unknown as PaymentsRepository;

    const usersService = new UsersService(usersRepo, employeesRepo, billing);
    const tasksService = new TasksService(tasksRepo, billing);
    const paymentsService = new PaymentsService(paymentsRepo, billing);

    const employee = await usersService.createUser(
      'tenant-1',
      {
        email: 'worker@tenant.com',
        password: '1234',
        firstName: 'Worker',
        lastName: 'One',
        role: 'EMPLOYEE',
        managerId: undefined,
      },
      { actorUserId: 'owner-1', actorTenantRole: 'owner', actorSystemRole: 'user' }
    );

    const task = await tasksService.createTask('tenant-1', 'owner-1', {
      title: 'Install materials',
      description: 'Initial assignment',
      assigneeId: employee.id,
      priority: 'MEDIUM',
      deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const paymentRequest = await paymentsService.createPaymentRequest('tenant-1', 'owner-1', { plan: 'pro' });
    const approved = await paymentsService.confirmPayment(paymentRequest.id, 'super-admin-1');

    expect(employee.email).toBe('worker@tenant.com');
    expect(task.status).toBe('TODO');
    expect(approved.status).toBe('confirmed');
  });
});
