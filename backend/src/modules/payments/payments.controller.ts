import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentsRepository } from './payments.repository.js';
import { PaymentsService } from './payments.service.js';
import { BillingRepository } from '../billing/billing.repository.js';
import { BillingService } from '../billing/billing.service.js';
import {
  createPaymentRequestSchema,
  confirmPaymentRequestSchema,
  paymentRequestIdParamSchema,
  PAYMENT_CARD_NUMBER,
} from './payments.schema.js';
import { requireSystemRole } from '../../shared/middleware/rbac.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { sendSuccess } from '../../shared/utils/response.js';

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const paymentsRepo = new PaymentsRepository(app.db);
  const billingRepo = new BillingRepository(app.db);
  const billingService = new BillingService(billingRepo);
  const paymentsService = new PaymentsService(paymentsRepo, billingService);

  /** Show payment card number to the tenant user */
  app.get(
    '/card',
    { preHandler: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return sendSuccess(reply, { card: PAYMENT_CARD_NUMBER });
    }
  );

  /** Tenant user: list their own payment requests */
  app.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const list = await paymentsService.listForTenant(tenantId);
      return sendSuccess(reply, { data: list });
    }
  );

  /** Tenant user: clicks "I paid" to create a payment request */
  app.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) throw ApplicationError.forbidden('Tenant context required');
      const body = createPaymentRequestSchema.parse(request.body);
      const pr = await paymentsService.createPaymentRequest(tenantId, request.user.id, body);
      return sendSuccess(reply, pr, 201);
    }
  );

  /** Admin: list all pending payment requests */
  app.get(
    '/admin/pending',
    { preHandler: [authenticate, requireSystemRole('super_admin')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const list = await paymentsService.listPending();
      return sendSuccess(reply, { data: list });
    }
  );

  /** Admin: confirm a payment and activate plan */
  app.post(
    '/admin/:id/confirm',
    { preHandler: [authenticate, requireSystemRole('super_admin')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = paymentRequestIdParamSchema.parse(request.params);
      const body = confirmPaymentRequestSchema.parse(request.body ?? {});
      const confirmed = await paymentsService.confirmPayment(id, request.user.id, body.adminNote);
      return sendSuccess(reply, confirmed);
    }
  );

  /** Admin: reject a payment request */
  app.post(
    '/admin/:id/reject',
    { preHandler: [authenticate, requireSystemRole('super_admin')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = paymentRequestIdParamSchema.parse(request.params);
      const body = confirmPaymentRequestSchema.parse(request.body ?? {});
      const rejected = await paymentsService.rejectPayment(id, request.user.id, body.adminNote);
      return sendSuccess(reply, rejected);
    }
  );
}
