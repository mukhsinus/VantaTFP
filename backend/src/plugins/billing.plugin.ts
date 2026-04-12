import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { BillingRepository } from '../modules/billing/billing.repository.js';
import { BillingService } from '../modules/billing/billing.service.js';

async function billingPlugin(app: FastifyInstance): Promise<void> {
  const repository = new BillingRepository(app.db);
  const service = new BillingService(repository);
  app.decorate('billing', service);
}

export default fastifyPlugin(billingPlugin, {
  name: 'billing',
  dependencies: ['database'],
});
