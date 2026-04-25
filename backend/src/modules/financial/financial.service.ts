import { FinancialRepository } from './financial.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import type { CreatePayoutBody } from './financial.schema.js';

export class FinancialService {
  constructor(private readonly repo: FinancialRepository) {}

  async getOrCreateWallet(tenantId: string, ownerId: string) {
    return this.repo.getOrCreateWallet(tenantId, ownerId);
  }

  async listWallets(tenantId: string) {
    return this.repo.listWalletsByTenant(tenantId);
  }

  async getWallet(tenantId: string, walletId: string) {
    const wallet = await this.repo.getWalletById(walletId, tenantId);
    if (!wallet) throw ApplicationError.notFound('Wallet not found');
    return wallet;
  }

  async getWalletTransactions(tenantId: string, walletId: string) {
    await this.getWallet(tenantId, walletId);
    return this.repo.listTransactionsByWallet(walletId, tenantId);
  }

  /**
   * Create a payout for a recipient from their wallet.
   * Uses DB transaction for financial safety + idempotency (per spec).
   */
  async createPayout(tenantId: string, body: CreatePayoutBody) {
    const wallet = await this.repo.getOrCreateWallet(tenantId, body.recipientId);

    const payout = await this.repo.createPayout({
      tenantId,
      recipientId: body.recipientId,
      walletId: wallet.id,
      amount: body.amount,
      payrollId: body.payrollId,
      payoutMethod: body.payoutMethod,
      idempotencyKey: body.idempotencyKey,
    });

    return payout;
  }

  async listPayouts(tenantId: string) {
    return this.repo.listPayoutsByTenant(tenantId);
  }

  async updatePayoutStatus(
    tenantId: string,
    id: string,
    status: 'processing' | 'completed' | 'failed',
    payoutRef?: string
  ) {
    const payout = await this.repo.updatePayoutStatus(id, tenantId, status, payoutRef);
    if (!payout) {
      throw ApplicationError.notFound('Payout not found');
    }
    return payout;
  }

  /**
   * Credit an employee wallet — used by payroll engine.
   * Idempotency key ensures double-crediting is impossible.
   */
  async creditEmployeeWallet(
    tenantId: string,
    ownerId: string,
    amount: number,
    description: string,
    idempotencyKey: string
  ) {
    const wallet = await this.repo.getOrCreateWallet(tenantId, ownerId);
    return this.repo.creditWallet(wallet.id, tenantId, amount, description, idempotencyKey);
  }
}
