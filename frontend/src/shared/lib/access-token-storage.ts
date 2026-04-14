/**
 * Mirrors the JWT for mobile / legacy flows (`ugc_token`) with safe fallbacks when
 * `localStorage` is unavailable (private mode, strict WebView, etc.).
 */

const UGC_TOKEN_KEY = 'ugc_token';
const SESSION_FALLBACK_KEY = 'ugc_token_session';

let memoryToken: string | null = null;

function safeLocalGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeLocalRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function safeSessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeSessionRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Persist token mirrors (localStorage → sessionStorage → memory). */
export function writeAccessTokenMirrors(token: string | null): void {
  memoryToken = token;
  if (token) {
    safeLocalSet(UGC_TOKEN_KEY, token);
    console.log('TOKEN:', safeLocalGet(UGC_TOKEN_KEY));
    safeSessionSet(SESSION_FALLBACK_KEY, token);
  } else {
    safeLocalRemove(UGC_TOKEN_KEY);
    safeSessionRemove(SESSION_FALLBACK_KEY);
    console.log('TOKEN:', null);
  }
}

/** Read token from mirrors only (does not read Zustand). */
export function readMirroredAccessToken(): string | null {
  const fromLocal = safeLocalGet(UGC_TOKEN_KEY);
  if (fromLocal) return fromLocal;
  const fromSession = safeSessionGet(SESSION_FALLBACK_KEY);
  if (fromSession) return fromSession;
  return memoryToken;
}
