/**
 * Resolves tenant id from JWT claims. Invalid or empty values become null so Postgres never sees bad `::uuid` casts.
 */
export function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function parseJwtTenantIdFromPayload(payload: {
  tenantId?: string;
  tenant_id?: string | null;
}): string | null {
  const candidates = [payload.tenantId, payload.tenant_id];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const t = c.trim();
    if (t.length > 0 && isLikelyUuid(t)) {
      return t;
    }
  }
  return null;
}
