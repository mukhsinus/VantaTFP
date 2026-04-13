import { PaymentsRepository } from './payments.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
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
    const request = await this.billing.createUpgradePaymentRequest(tenantId, userId, body.plan);
    const created = await this.repo.findById(request.id, tenantId);
    if (!created) {
      throw ApplicationError.internal('Payment request created but could not be loaded');
    }
    return created;
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
  async confirmPayment(id: string, adminUserId: string, _adminNote?: string) {
    const pr = await this.repo.findById(id);
    if (!pr) {
      throw ApplicationError.notFound('Payment request not found');
    }
    if (pr.status !== 'pending') {
      throw ApplicationError.conflict(`Payment request is already ${pr.status}`);
    }

    await this.billing.approvePaymentRequest(id, adminUserId);
    const approved = await this.repo.findById(id);
    if (!approved) {
      throw ApplicationError.internal('Payment request approved but could not be loaded');
    }
    return approved;
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
