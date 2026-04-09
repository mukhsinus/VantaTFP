import { ApplicationError } from '../utils/application-error.js';
import { assertTenantEntityMatch } from '../utils/tenant-scope.js';

/**
 * Integration test helper:
 * simulates a cross-tenant entity return and asserts it fails.
 */
export function expectCrossTenantAccessToFail(
  entityTenantId: string,
  requestTenantId: string
): void {
  try {
    assertTenantEntityMatch(entityTenantId, requestTenantId);
  } catch (error) {
    if (error instanceof ApplicationError && error.statusCode === 403) {
      return;
    }
    throw error;
  }
  throw new Error('Expected cross-tenant access to fail, but it succeeded');
}
