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
export function waitUntilBackendReady() {
    if (isBackendReady)
        return Promise.resolve();
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
