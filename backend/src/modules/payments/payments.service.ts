import { PaymentsRepository } from './payments.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { BILLING_PLANS_CATALOG } from '../billing/billing.service.js';
import type { BillingService } from '../billing/billing.service.js';
import type { CreatePaymentRequestBody } from './payments.schema.js';

export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly billing: BillingService
  ) {}

  /** Tenant user clicks "I paid" — creates a pending payment_request. */
  async createPaymentRequest(
    tenantId: string,
    userId: string,
    body: CreatePaymentRequestBody
  ) {
    const plan = BILLING_PLANS_CATALOG.find((p) => p.name === body.plan);
    if (!plan) {
      throw ApplicationError.badRequest(`Unknown plan: ${body.plan}`);
    }

    const pr = await this.repo.create({
      tenantId,
      userId,
      plan: body.plan,
      amount: plan.price,
      proof: body.proof,
    });

    return pr;
  }

  /** List all payment requests for the current tenant. */
  async listForTenant(tenantId: string) {
    return this.repo.listByTenant(tenantId);
  }

  /** Admin: list all pending payment requests (platform-level). */
  async listPending() {
    return this.repo.listPending();
  }

  /** Admin confirms payment -> activates the requested plan. */
  async confirmPayment(id: string, adminUserId: string, adminNote?: string) {
    const pr = await this.repo.findById(id);
    if (!pr) {
      throw ApplicationError.notFound('Payment request not found');
    }
    if (pr.status !== 'pending') {
      throw ApplicationError.conflict(`Payment request is already ${pr.status}`);
    }

    const confirmed = await this.repo.confirm(id, adminUserId, adminNote);
    if (!confirmed) {
      throw ApplicationError.conflict('Payment request could not be confirmed');
    }

    // Activate the plan for the tenant
    await this.billing.upgradeSubscriptionPlan(pr.tenant_id, pr.plan as any);

    return confirmed;
  }

  /** Admin rejects payment request. */
  async rejectPayment(id: string, adminUserId: string, adminNote?: string) {
    const pr = await this.repo.findById(id);
    if (!pr) {
      throw ApplicationError.notFound('Payment request not found');
    }
    if (pr.status !== 'pending') {
      throw ApplicationError.conflict(`Payment request is already ${pr.status}`);
    }

    return this.repo.reject(id, adminUserId, adminNote);
  }
}
