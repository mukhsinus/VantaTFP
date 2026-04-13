import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { BillingRepository } from '../modules/billing/billing.repository.js';
import { BillingService } from '../modules/billing/billing.service.js';

async function billingPlugin(app: FastifyInstance): Promise<void> {
  const repository = new BillingRepository(app.db);
  const hasPaymentRequestsTable = await repository.hasPaymentRequestsTable();
  if (!hasPaymentRequestsTable) {
    app.log.error(
      '[billing] Missing required table: payment_requests. Run DB migrations before serving billing endpoints.'
    );
  } else {
    const missingColumns = await repository.getPaymentRequestsMissingColumns();
    if (missingColumns.length > 0) {
      app.log.error(
        `[billing] payment_requests schema mismatch. Missing columns: ${missingColumns.join(', ')}`
      );
    }
  }
  const service = new BillingService(repository);
  app.decorate('billing', service);
}

export default fastifyPlugin(billingPlugin, {
  name: 'billing',
  dependencies: ['database'],
});
