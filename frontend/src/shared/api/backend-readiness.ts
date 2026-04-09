/**
 * Gates `apiClient` until the app has confirmed the backend is reachable (health check).
 * Health checks use raw `fetch` — they must not go through `apiClient` (would deadlock).
 */

let isBackendReady = false;

export function markBackendReadyFromHealth(): void {
  isBackendReady = true;
}

/** Unblocks API after timeout / exhausted probes so the shell never deadlocks. */
export function markBackendReadyFailOpen(): void {
  isBackendReady = true;
}

export function getBackendReady(): boolean {
  return isBackendReady;
}

export function waitUntilBackendReady(): Promise<void> {
  if (isBackendReady) return Promise.resolve();

  console.log('API BLOCKED UNTIL READY');

  return new Promise((resolve) => {
    const interval = window.setInterval(() => {
      if (isBackendReady) {
        window.clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
