import { ApplicationError } from '../../shared/utils/application-error.js';
import { AdminRepository } from './admin.repository.js';
import { ListAuditLogsQuery, UpdateTenantAdminDto } from './admin.schema.js';
import { env } from '../../shared/utils/env.js';
import { readdir, stat } from 'fs/promises';
import { resolve } from 'path';

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly appStartedAt: Date
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

  async getSystemHealth(tenantId: string) {
    const dbOk = await this.adminRepository.dbPing();
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      tenantId,
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
}
