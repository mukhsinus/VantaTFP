/**
 * Runs N parallel operations and returns success/failure totals.
 * Intended for integration tests around billing concurrency limits.
 */
export async function runBillingConcurrencySimulation(
  operation: () => Promise<unknown>,
  parallel = 50
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: PromiseSettledResult<unknown>[];
}> {
  const results = await Promise.allSettled(Array.from({ length: parallel }, () => operation()));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;
  return {
    total: parallel,
    succeeded,
    failed,
    results,
  };
}

export function assertDidNotExceedLimit(
  succeeded: number,
  limit: number,
  label = 'Billing limit'
): void {
  if (succeeded > limit) {
    throw new Error(`${label} exceeded during stress test: succeeded=${succeeded}, limit=${limit}`);
  }
}
