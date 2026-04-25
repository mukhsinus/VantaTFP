import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import { AdminRepository } from './admin.repository.js';
import { AdminService } from './admin.service.js';
import {
  adminForceTenantPlanSchema,
  adminListQuerySchema,
  adminPaymentListQuerySchema,
  adminTenantScopeQuerySchema,
  adminTenantIdParamSchema,
  adminUserRoleBodySchema,
  listAuditLogsQuerySchema,
  updateTenantAdminSchema,
} from './admin.schema.js';
import { requireAuth, requireSuperAdmin } from '../../shared/middleware/rbac.middleware.js';
import { paymentRequestIdParamSchema } from '../payments/payments.schema.js';
import { PaymentsRepository } from '../payments/payments.repository.js';
import { PaymentsService } from '../payments/payments.service.js';
import { BillingRepository } from '../billing/billing.repository.js';
import { BillingService } from '../billing/billing.service.js';

const APP_STARTED_AT = new Date();

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminRepository = new AdminRepository(app.db);
  const billingRepository = new BillingRepository(app.db);
  const adminService = new AdminService(adminRepository, APP_STARTED_AT, billingRepository);
  const paymentsRepository = new PaymentsRepository(app.db);
  const billingService = new BillingService(billingRepository);
  const paymentsService = new PaymentsService(paymentsRepository, billingService);
  const authenticate = app.authenticate;
  const superOnly = [authenticate, requireAuth, requireSuperAdmin];
  const resolveTenantScope = (request: FastifyRequest) =>
    adminTenantScopeQuerySchema.parse(request.query ?? {}).tenantId;

  app.get(
    '/audit-logs',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listAuditLogsQuerySchema.parse(request.query);
      const tenantId = resolveTenantScope(request);
      const result = await adminService.listAuditLogs(tenantId, query);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/tenant',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await adminService.getTenantManagement(resolveTenantScope(request));
      return sendSuccess(reply, tenant);
    }
  );

  app.patch(
    '/tenant',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateTenantAdminSchema.parse(request.body);
      const tenantId = resolveTenantScope(request);
      const tenant = await adminService.updateTenantManagement(
        tenantId,
        request.user.userId,
        body
      );
      return sendSuccess(reply, tenant);
    }
  );

  app.post(
    '/tenant/deactivate',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = resolveTenantScope(request);
      await adminService.deactivateTenant(tenantId, request.user.userId);
      return sendNoContent(reply);
    }
  );

  app.get(
    '/backup-status',
    { preHandler: superOnly },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const status = await adminService.getBackupStatus();
      return sendSuccess(reply, status);
    }
  );

  app.get(
    '/monitoring/health',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const health = await adminService.getSystemHealth();
      return sendSuccess(reply, health);
    }
  );

  app.get(
    '/monitoring/stats',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = resolveTenantScope(request);
      const stats = await adminService.getSystemStats(tenantId);
      return sendSuccess(reply, stats);
    }
  );

  app.post(
    '/payments/:id/approve',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = paymentRequestIdParamSchema.parse(request.params);
      const approved = await paymentsService.confirmPayment(id, request.user.id);
      return sendSuccess(reply, approved);
    }
  );

  app.post(
    '/payments/:id/reject',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = paymentRequestIdParamSchema.parse(request.params);
      const rejected = await paymentsService.rejectPayment(id, request.user.id);
      return sendSuccess(reply, rejected);
    }
  );

  app.get(
    '/payments',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = adminPaymentListQuerySchema.parse(request.query ?? {});
      const result = await adminService.listPayments(query);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/dashboard',
    { preHandler: superOnly },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await adminService.getDashboardSummary();
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/subscriptions',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = adminListQuerySchema.parse(request.query ?? {});
      const result = await adminService.listSubscriptions(query);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/tenants',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = adminListQuerySchema.parse(request.query ?? {});
      const result = await adminService.listTenants(query);
      return sendSuccess(reply, result);
    }
  );

  app.patch(
    '/tenants/:id/suspend',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = adminTenantIdParamSchema.parse(request.params);
      const result = await adminService.suspendTenant(id);
      return sendSuccess(reply, result);
    }
  );

  app.patch(
    '/tenants/:id/activate',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = adminTenantIdParamSchema.parse(request.params);
      const result = await adminService.activateTenant(id);
      return sendSuccess(reply, result);
    }
  );

  app.post(
    '/tenants/:id/plan',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = adminTenantIdParamSchema.parse(request.params);
      const body = adminForceTenantPlanSchema.parse(request.body ?? {});
      const result = await adminService.forceChangeTenantPlan(id, body.plan);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/users',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = adminListQuerySchema.parse(request.query ?? {});
      const result = await adminService.listUsers(query);
      return sendSuccess(reply, result);
    }
  );

  app.post(
    '/users/:id/role',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = adminTenantIdParamSchema.parse(request.params);
      const body = adminUserRoleBodySchema.parse(request.body ?? {});
      const result = await adminService.updateUserRole(id, body.role);
      return sendSuccess(reply, result);
    }
  );

  app.post(
    '/users/:id/ban',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = adminTenantIdParamSchema.parse(request.params);
      const result = await adminService.banUser(id);
      return sendSuccess(reply, result);
    }
  );
}
