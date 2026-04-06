import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';
import { getTierFeatures, PlanType } from '../config/tier.config.js';

/**
 * Middleware to check if a tenant has access to a specific feature
 */
export function requireTierFeature(featurePath: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.user?.tenantId;
    const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

    if (!tenantId || !tenantPlan) {
      throw ApplicationError.unauthorized('Missing tenant context');
    }

    const features = getTierFeatures(tenantPlan);
    const keys = featurePath.split('.');
    let current: any = features;

    for (const key of keys) {
      if (current?.[key] === undefined) {
        throw ApplicationError.forbidden(
          `Feature '${featurePath}' not found in tier configuration`
        );
      }
      current = current[key];
    }

    if (current !== true) {
      throw ApplicationError.forbidden(
        `This feature is not available in your current plan. Please upgrade to access '${featurePath}'.`
      );
    }
  };
}

/**
 * Middleware to enforce user limits per tenant
 */
export function enforceUserLimit(db: any) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.user?.tenantId;
    const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

    if (!tenantId || !tenantPlan) return;

    const features = getTierFeatures(tenantPlan);
    const maxUsers = features.maxUsers;

    // Count current active users
    const result = await db.query(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE tenant_id = $1 AND is_active = TRUE
      `,
      [tenantId]
    );
    const currentUsers = parseInt(result.rows[0].count, 10);

    if (currentUsers >= maxUsers && request.method === 'POST' && request.url.includes('/users')) {
      throw ApplicationError.forbidden(
        `User limit (${maxUsers}) reached for your plan. Please upgrade to add more users.`
      );
    }

    // Note: currentUserCount and maxAllowedUsers are available for logging but not stored in request.user
  };
}

/**
 * Middleware to enforce task limits per tenant
 */
export function enforceTaskLimit(db: any) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.user?.tenantId;
    const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

    if (!tenantId || !tenantPlan) return;

    const features = getTierFeatures(tenantPlan);
    const maxTasks = features.maxTasks;

    // Count current active tasks
    const result = await db.query(
      `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE tenant_id = $1 AND is_deleted = FALSE
      `,
      [tenantId]
    );
    const currentTasks = parseInt(result.rows[0].count, 10);

    if (currentTasks >= maxTasks && request.method === 'POST' && request.url.includes('/tasks')) {
      throw ApplicationError.forbidden(
        `Task limit (${maxTasks}) reached for your plan. Please upgrade to create more tasks.`
      );
    }

    // Note: currentTaskCount and maxAllowedTasks are available for logging but not stored in request.user
  };
}

/**
 * Middleware to check if payroll CRUD is allowed (PRO/ENTERPRISE only)
 */
export function requirePayrollAccess(db: any) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

    if (!tenantPlan) {
      throw ApplicationError.unauthorized('Missing tenant plan');
    }

    const features = getTierFeatures(tenantPlan);

    // For POST/PATCH/DELETE operations, require PRO or ENTERPRISE
    if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
      if (!features.payroll.fullCrud) {
        throw ApplicationError.forbidden(
          'Payroll management requires PRO or ENTERPRISE plan'
        );
      }
    }
  };
}

/**
 * Middleware to check if custom RBAC is allowed (PRO/ENTERPRISE only)
 */
export function requireCustomRBAC(request: FastifyRequest) {
  const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

  if (!tenantPlan) {
    throw ApplicationError.unauthorized('Missing tenant plan');
  }

  const features = getTierFeatures(tenantPlan);

  if (!features.rbac.customRoles) {
    throw ApplicationError.forbidden(
      'Custom roles require PRO or ENTERPRISE plan'
    );
  }
}

/**
 * Middleware to check if audit logs are available (PRO/ENTERPRISE only)
 */
export function requireAuditLogs(request: FastifyRequest) {
  const tenantPlan = request.user?.tenantPlan as PlanType | undefined;

  if (!tenantPlan) {
    throw ApplicationError.unauthorized('Missing tenant plan');
  }

  const features = getTierFeatures(tenantPlan);

  if (!features.adminFeatures.auditLogs) {
    throw ApplicationError.forbidden(
      'Audit logs require PRO or ENTERPRISE plan'
    );
  }
}
