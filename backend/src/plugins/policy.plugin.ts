import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { PolicyRepository } from '../shared/policy/policy.repository.js';
import { PolicyService } from '../shared/policy/policy.service.js';

async function policyPlugin(app: FastifyInstance): Promise<void> {
  const repository = new PolicyRepository(app.db);
  const service = new PolicyService(repository);
  app.decorate('policy', service);
}

export default fastifyPlugin(policyPlugin, {
  name: 'policy',
  dependencies: ['database'],
});
