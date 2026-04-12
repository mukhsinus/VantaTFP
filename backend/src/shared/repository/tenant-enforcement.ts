import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

/**
 * Base tenant-scope guard for SQL text.
 * - ensures tenant context is provided
 * - detects missing `tenant_id` usage in dev mode
 */
export function enforceTenantScope(query: string, tenantId: string): string {
  if (!tenantId) {
    throw new Error('Missing tenantId for tenant-scoped query');
  }

  if (env.NODE_ENV !== 'production') {
    const hasTenantPredicate = /\btenant_id\b/i.test(query);
    if (!hasTenantPredicate) {
      logger.error(
        {
          tenantId,
          queryPreview: query.replace(/\s+/g, ' ').trim().slice(0, 500),
          stack: new Error('Tenant scope missing in query').stack,
        },
        'UNSCOPED_TENANT_QUERY_DETECTED'
      );
    }
  }

  return query;
}
