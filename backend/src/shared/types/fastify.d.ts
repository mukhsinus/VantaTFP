import { Pool } from 'pg';
import { AuthenticatedUser } from './common.types.js';
import type { BillingService } from '../../modules/billing/billing.service.js';
import type { PolicyService } from '../policy/policy.service.js';
import type { NotificationService } from '../../modules/notifications/notification.service.js';

type NotificationHub = {
  connect: (
    tenantId: string,
    userId: string,
    socket: { send: (data: string) => void; on: (event: 'close', cb: () => void) => void }
  ) => void;
  broadcastToUser: (tenantId: string, userId: string, message: unknown) => void;
};

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    billing: BillingService;
    policy: PolicyService;
    notifications: NotificationService;
    notificationHub: NotificationHub;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    /** Present after `authenticate` when tenant-scoped; omitted for `super_admin` without acting tenant. */
    tenantId?: string;
    tenant?: { id: string };
    membership?: { role: 'ADMIN' | 'EMPLOYEE' };
    idempotencyKey?: string;
  }
}

/**
 * After `authenticate`, `request.user` is a DB-hydrated `AuthenticatedUser`
 * (`id`, `system_role`, `tenant_role`, `tenant_id`, plus legacy fields).
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}
