import { ApplicationError } from './application-error.js';

/**
 * Ensures a loaded row belongs to the caller's tenant. Use after reads that return tenant_id.
 */
export function assertTenantEntityMatch(
  entityTenantId: string | null | undefined,
  requestTenantId: string,
  _resourceLabel = 'Resource'
): void {
  if (!entityTenantId || entityTenantId !== requestTenantId) {
    throw ApplicationError.forbidden('Cross-tenant access denied');
  }
}
