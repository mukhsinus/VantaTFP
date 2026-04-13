import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FinancialRepository } from './financial.repository.js';
import { FinancialService } from './financial.service.js';
import { requireManagerOrAbove, requireOwner } from '../../shared/middleware/rbac.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { sendSuccess } from '../../shared/utils/response.js';
import {
  walletIdParamSchema,
  payoutIdParamSchema,
  createPayoutSchema,
} from './financial.schema.js';

export async function financialRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const financialRepo = new FinancialRepository(app.db);
  const financialService = new FinancialService(financialRepo);

  /** Get or create current user's wallet */
  app.get(
    '/wallet',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const wallet = await financialService.getOrCreateWallet(tenantId, request.user.id);
      return sendSuccess(reply, wallet);
    }
  );

  /** List all wallets in tenant (managers+) */
  app.get(
    '/wallets',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const wallets = await financialService.listWallets(tenantId);
      return sendSuccess(reply, { data: wallets });
    }
  );

  /** Get wallet transactions */
  app.get(
    '/wallets/:id/transactions',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const { id } = walletIdParamSchema.parse(request.params);
      const txns = await financialService.getWalletTransactions(tenantId, id);
      return sendSuccess(reply, { data: txns });
    }
  );

  /** List payouts for tenant */
  app.get(
    '/payouts',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const payouts = await financialService.listPayouts(tenantId);
      return sendSuccess(reply, { data: payouts });
    }
  );

  /** Owner creates a payout for an employee */
  app.post(
    '/payouts',
    { preHandler: [authenticate, requireOwner()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const body = createPayoutSchema.parse(request.body);
      const payout = await financialService.createPayout(tenantId, body);
      return sendSuccess(reply, payout, 201);
    }
  );

  /** Owner updates payout status (mark complete/failed) */
  app.patch(
    '/payouts/:id/status',
    { preHandler: [authenticate, requireOwner()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const { id } = payoutIdParamSchema.parse(request.params);
      const { status, payoutRef } = (request.body as any) ?? {};
      if (!['processing', 'completed', 'failed'].includes(status)) {
        throw ApplicationError.badRequest('Invalid status');
      }
      const payout = await financialService.updatePayoutStatus(id, status, payoutRef);
      return sendSuccess(reply, payout);
    }
  );
}
