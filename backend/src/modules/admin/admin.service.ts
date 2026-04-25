import { ApplicationError } from '../../shared/utils/application-error.js';
import { AdminRepository } from './admin.repository.js';
import { AdminListQuery, AdminPaymentListQuery, ListAuditLogsQuery, UpdateTenantAdminDto } from './admin.schema.js';
import { env } from '../../shared/utils/env.js';
import { readdir, stat } from 'fs/promises';
import { resolve } from 'path';
import type { BillingRepository } from '../billing/billing.repository.js';

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly appStartedAt: Date,
    private readonly billingRepository: BillingRepository
  ) {}

  async listAuditLogs(tenantId: string, query: ListAuditLogsQuery) {
    const [rows, total] = await Promise.all([
      this.adminRepository.listAuditLogs(tenantId, query),
      this.adminRepository.countAuditLogs(tenantId, query),
    ]);
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);

    return {
      data: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        userId: row.user_id,
        metadata: row.metadata ?? {},
        timestamp: row.created_at.toISOString(),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  async getTenantManagement(tenantId: string) {
    const tenant = await this.adminRepository.getTenant(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }
    const stats = await this.adminRepository.getTenantStats(tenantId);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      isActive: tenant.is_active,
      createdAt: tenant.created_at.toISOString(),
      updatedAt: tenant.updated_at.toISOString(),
      stats,
    };
  }

  async updateTenantManagement(
    tenantId: string,
    actorUserId: string,
    data: UpdateTenantAdminDto
  ) {
    const existing = await this.adminRepository.getTenant(tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Tenant');
    }

    const updated = await this.adminRepository.updateTenant(tenantId, {
      name: data.name,
      plan: data.plan,
    });

    await this.adminRepository.insertAuditLog({
      tenantId,
      action: 'TENANT_UPDATED',
      entity: 'TENANT',
      userId: actorUserId,
      metadata: {
        before: { name: existing.name, plan: existing.plan },
        after: { name: updated.name, plan: updated.plan },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      plan: updated.plan,
      isActive: updated.is_active,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };
  }

  async deactivateTenant(tenantId: string, actorUserId: string) {
    const existing = await this.adminRepository.getTenant(tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Tenant');
    }

    await this.adminRepository.deactivateTenant(tenantId);
    await this.adminRepository.insertAuditLog({
      tenantId,
      action: 'TENANT_DEACTIVATED',
      entity: 'TENANT',
      userId: actorUserId,
      metadata: { tenantId },
    });
  }

  async getSystemHealth() {
    const dbOk = await this.adminRepository.dbPing();
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      now: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.appStartedAt.getTime()) / 1000),
    };
  }

  async getSystemStats(tenantId: string) {
    const stats = await this.adminRepository.getTenantStats(tenantId);
    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      stats,
    };
  }

  async getBackupStatus() {
    const backupDir = resolve(process.cwd(), env.BACKUP_PATH);
    let lastBackupAt: string | null = null;
    try {
      const files = await readdir(backupDir);
      const dumpFiles = files.filter((f) => f.endsWith('.dump'));
      if (dumpFiles.length > 0) {
        let latestMs = 0;
        for (const file of dumpFiles) {
          const fileStat = await stat(resolve(backupDir, file));
          latestMs = Math.max(latestMs, fileStat.mtimeMs);
        }
        if (latestMs > 0) {
          lastBackupAt = new Date(latestMs).toISOString();
        }
      }
    } catch {
      lastBackupAt = null;
    }

    return {
      lastBackupAt,
      backupPath: env.BACKUP_PATH,
    };
  }

  async getDashboardSummary() {
    const stats = await this.adminRepository.getDashboardStats();
    return {
      totalTenants: stats.total_tenants,
      activeSubscriptions: stats.active_subscriptions,
      pendingPayments: stats.pending_payments,
      mrr: stats.mrr,
    };
  }

  async listPayments(query: AdminPaymentListQuery) {
    const { rows, total } = await this.adminRepository.listPaymentRequests(
      query.status,
      query.page,
      query.limit
    );
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);
    return {
      data: rows.map((row) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        tenant: row.tenant_name,
        plan_id: row.plan_id,
        plan: row.plan_name,
        status: row.status,
        created_at: row.created_at.toISOString(),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  async listSubscriptions(query: AdminListQuery) {
    const { rows, total } = await this.adminRepository.listSubscriptions(query.page, query.limit);
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);
    return {
      data: rows.map((row) => ({
        tenant_id: row.tenant_id,
        tenant: row.tenant_name,
        status: row.status,
        plan: row.plan_name,
        limits: row.limits,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  async listTenants(query: AdminListQuery) {
    const { rows, total } = await this.adminRepository.listTenants(query.page, query.limit);
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        is_active: row.is_active,
        billing_status: row.billing_status,
        created_at: row.created_at.toISOString(),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  async suspendTenant(tenantId: string) {
    const ok = await this.adminRepository.setTenantActiveState(tenantId, false);
    if (!ok) throw ApplicationError.notFound('Tenant');
    return { ok: true };
  }

  async activateTenant(tenantId: string) {
    const ok = await this.adminRepository.setTenantActiveState(tenantId, true);
    if (!ok) throw ApplicationError.notFound('Tenant');
    return { ok: true };
  }

  async forceChangeTenantPlan(tenantId: string, plan: 'basic' | 'pro' | 'business' | 'enterprise') {
    const tenant = await this.adminRepository.getTenant(tenantId);
    if (!tenant) throw ApplicationError.notFound('Tenant');
    const { updated } = await this.billingRepository.upgradeSubscriptionToPlan(tenantId, plan);
    if (!updated) {
      throw ApplicationError.badRequest('Could not change tenant plan');
    }
    return { ok: true };
  }

  async listUsers(query: AdminListQuery) {
    const { rows, total } = await this.adminRepository.listUsers(query.page, query.limit);
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);
    return {
      data: rows.map((row) => ({
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        system_role: row.system_role,
        tenant_role: row.tenant_role,
        role: row.role,
        tenant_id: row.tenant_id,
        tenant_name: row.tenant_name,
        is_active: row.is_active,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') {
    const user = await this.adminRepository.getUserById(userId);
    if (!user) throw ApplicationError.notFound('User');
    if (user.system_role === 'super_admin') {
      throw ApplicationError.forbidden('Cannot change role for super admin accounts');
    }
    if (!user.tenant_id) {
      throw ApplicationError.forbidden('Cannot change role for platform accounts');
    }
    const ok = await this.adminRepository.updateUserRole(userId, role);
    if (!ok) throw ApplicationError.badRequest('Could not update user role');
    const tenantRole = role === 'ADMIN' ? 'owner' : role === 'MANAGER' ? 'manager' : 'employee';
    await this.adminRepository.upsertTenantRoleForUser(userId, user.tenant_id, tenantRole);
    return { ok: true };
  }

  async banUser(userId: string) {
    const user = await this.adminRepository.getUserById(userId);
    if (!user) throw ApplicationError.notFound('User');
    if (user.system_role === 'super_admin') {
      throw ApplicationError.forbidden('Cannot ban super admin accounts');
    }
    const ok = await this.adminRepository.banUser(userId);
    if (!ok) throw ApplicationError.badRequest('Could not ban user');
    return { ok: true };
  }
}
