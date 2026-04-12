/**
 * Gates `apiClient` until the app has confirmed the backend is reachable (health check).
 * Health checks use raw `fetch` — they must not go through `apiClient` (would deadlock).
 */
let isBackendReady = false;
export function markBackendReadyFromHealth() {
    isBackendReady = true;
}
/** Unblocks API after timeout / exhausted probes so the shell never deadlocks. */
export function markBackendReadyFailOpen() {
    isBackendReady = true;
}
export function getBackendReady() {
    return isBackendReady;
}
const MAX_BACKEND_WAIT_MS = 15_000;
export function waitUntilBackendReady() {
    if (isBackendReady)
        return Promise.resolve();
    console.log('API BLOCKED UNTIL READY');
    return new Promise((resolve) => {
        const started = Date.now();
        const interval = window.setInterval(() => {
            if (isBackendReady || Date.now() - started >= MAX_BACKEND_WAIT_MS) {
                window.clearInterval(interval);
                if (!isBackendReady) {
                    console.warn('[backend-readiness] timed out waiting for health gate; unblocking API');
                    markBackendReadyFailOpen();
                }
                resolve();
            }
        }, 100);
    });
}
