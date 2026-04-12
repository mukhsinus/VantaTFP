import { createHash } from 'crypto';

/**
 * Deterministic advisory lock key derived from tenant+metric.
 * Returned as signed 64-bit bigint-compatible value.
 */
export function getAdvisoryLockKey(tenantId: string, metric: string): string {
  const input = `${tenantId}:${metric}`;
  const hex = createHash('sha256').update(input).digest('hex').slice(0, 16);
  let key = BigInt(`0x${hex}`);

  // Convert to signed int64 range for pg advisory locks.
  const int64Max = BigInt('0x7fffffffffffffff');
  const uint64Max = BigInt('0xffffffffffffffff');
  if (key > int64Max) {
    key -= uint64Max + 1n;
  }

  return key.toString();
}
