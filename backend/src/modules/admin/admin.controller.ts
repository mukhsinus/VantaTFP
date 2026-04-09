import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import { AdminRepository } from './admin.repository.js';
import { AdminService } from './admin.service.js';
import { listAuditLogsQuerySchema, updateTenantAdminSchema } from './admin.schema.js';

const APP_STARTED_AT = new Date();

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminRepository = new AdminRepository(app.db);
  const adminService = new AdminService(adminRepository, APP_STARTED_AT);
  const authenticate = app.authenticate;

  app.get(
    '/audit-logs',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listAuditLogsQuerySchema.parse(request.query);
      const result = await adminService.listAuditLogs(request.user.tenantId, query);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/tenant',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await adminService.getTenantManagement(request.user.tenantId);
      return sendSuccess(reply, tenant);
    }
  );

  app.patch(
    '/tenant',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateTenantAdminSchema.parse(request.body);
      const tenant = await adminService.updateTenantManagement(
        request.user.tenantId,
        request.user.userId,
        body
      );
      return sendSuccess(reply, tenant);
    }
  );

  app.post(
    '/tenant/deactivate',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await adminService.deactivateTenant(request.user.tenantId, request.user.userId);
      return sendNoContent(reply);
    }
  );

  app.get(
    '/backup-status',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const status = await adminService.getBackupStatus();
      return sendSuccess(reply, status);
    }
  );

  app.get(
    '/monitoring/health',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const health = await adminService.getSystemHealth(request.user.tenantId);
      return sendSuccess(reply, health);
    }
  );

  app.get(
    '/monitoring/stats',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const stats = await adminService.getSystemStats(request.user.tenantId);
      return sendSuccess(reply, stats);
    }
  );
}
