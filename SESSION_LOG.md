# Session Log — April 13, 2026

## 1. Backend Health Check

**Status: Functionally correct — all endpoints return 200.**

Verified the full request flow after server startup:

| # | Endpoint | Status | Duration |
|---|----------|--------|----------|
| 1 | `GET /api/health` | 200 ✅ | 6 ms |
| 2 | `GET /api/v1/feature-flags` | 401 → token expired (expected) | — |
| 3 | `POST /api/v1/auth/refresh` | 200 ✅ | 3,177 ms |
| 4 | `GET /api/v1/users/me` | 200 ✅ | 1,928 ms |
| 5 | `GET /api/v1/notifications/unread` | 200 ✅ | 3,649 ms |
| 6 | `GET /api/v1/feature-flags` (retry) | 200 ✅ | 3,165 ms |
| 7 | `GET /api/v1/projects` | 200 ✅ | 4,939 ms |
| 8 | `GET /api/v1/billing/current` | 200 ✅ | 6,601 ms |
| 9 | WebSocket `/api/v1/notifications/ws` | Connected ✅ | — |

**Conclusion:** Auth flow works correctly (expired token → refresh → retry). All data endpoints respond successfully. WebSocket connects. However, response times are abnormally slow (1.9–6.6 seconds).

---

## 2. Missing Translations Fix

**Problem:** The UI showed raw translation keys instead of text (e.g. `projects.title`, `projects.empty.description`).

**Root cause:** `frontend/src/shared/i18n/locales/en.json` was missing 4 top-level translation sections on disk. The Russian (`ru.json`) and Uzbek (`uz.json`) locale files had them, but English did not.

**Missing keys in `en.json`:**
- `projects` — title, total, create, empty, disabled, fields
- `documents` — title, total, create, empty, disabled, fields
- `automations` — title, subtitle, create, active, inactive, empty, disabled, fields, triggers, actions
- `templates` — title, subtitle, create, empty, disabled, fields

**Also found missing in `ru.json`** (for future):
- `dashboard`, `footer`, `booking`, `auth`, `profile`, `employees`

**Fix:** Added all four missing sections to `en.json` with proper English translations matching the structure in `ru.json` and `uz.json`.

**File changed:** `frontend/src/shared/i18n/locales/en.json`

---

## 3. Backend Performance Investigation

**Problem:** All authenticated API endpoints take 1.9–6.6 seconds to respond.

### Critical Bottleneck: Authenticate Middleware

**File:** `backend/src/shared/middleware/authenticate.middleware.ts`

Every authenticated request executes **8+ database queries** before reaching the handler:

1. JWT verify
2. `getAuthSchemaCaps()` — schema introspection (cached after first call)
3. `findAuthContextById()` — complex query with `CROSS JOIN LATERAL` + subquery
4. `ensureDefaultSubscription()` — `INSERT ... ON CONFLICT` scanning `plans` table
5. `applyExpiredTrialTransition()` — `UPDATE` on subscriptions
6. `getSubscriptionStatusRaw()` — `SELECT` from subscriptions
7. `getTenantPlan()` — calls `ensureDefaultSubscription` + `applyExpiredTrialTransition` AGAIN + `SELECT` with JOIN
8. `incrementApiUsage()` — `INSERT ... ON CONFLICT` + `UPDATE` on usage_tracking

### Per-Endpoint Analysis

| Endpoint | Handler Queries | Middleware Queries | Total |
|----------|----------------|-------------------|-------|
| `/auth/refresh` | 2 (findActiveUser + findAuthContext) | 0 (no auth middleware) | ~2 |
| `/users/me` | 1 (findMeProfile) | 8+ | ~9+ |
| `/notifications/unread` | 1 (SELECT unread) | 8+ | ~9+ |
| `/feature-flags` | 2 (INSERT defaults + SELECT) | 8+ | ~10+ |
| `/projects` | 2 (findAll + count) | 8+ | ~10+ |
| `/billing/current` | 6 (ensure + transition + plan + members + tasks + usage) | 8+ | ~14+ |

### Missing Database Indexes

Existing indexes were checked across all migration files. **Missing critical indexes:**

| Index | Table | Impact |
|-------|-------|--------|
| `subscriptions(tenant_id)` | subscriptions | Used in every billing query — no index exists |
| `tenant_users(user_id, tenant_id)` | tenant_users | Used in `findAuthContextById` subquery |
| Composite `users(id, is_active)` | users | Used in auth context lookup |

### Recommended Fixes (Not Yet Applied)

1. **Add missing indexes** — `subscriptions(tenant_id)`, `tenant_users(user_id, tenant_id)`
2. **Cache billing checks per-request** — avoid calling `ensureDefaultSubscription` + `applyExpiredTrialTransition` multiple times per request
3. **Reduce middleware DB calls** — cache tenant plan context on `request` object so handlers don't re-query
4. **Batch redundant queries** — `findAuthContextById` is called twice (middleware + refresh handler)
5. **Use `COUNT(*) OVER()` window function** instead of separate count queries in projects/billing

---

## 4. Deployment Readiness Check

**Status: Ready for macOS and deploy.**

| Check | Result |
|-------|--------|
| No Windows-specific code | ✅ No hardcoded paths or platform checks |
| Netlify frontend config | ✅ `netlify.toml` configured, `/*` catch-all redirect present |
| Backend host binding | ✅ Uses `0.0.0.0` default, standard `PORT` env var |
| Native dependencies | ✅ `bcrypt` recompiles on `npm install`; `bcryptjs` fallback available |
| Cross-platform deps | ✅ All Node.js/pg/Fastify — no platform-specific modules |

**Steps for macOS:**
1. `npm install` (fresh — recompiles native modules)
2. Set `.env` with correct `DATABASE_URL` and `REDIS_URL`
3. `npm run dev:backend` and `npm run dev:frontend`

---

## Files Modified This Session

| File | Change |
|------|--------|
| `frontend/src/shared/i18n/locales/en.json` | Added `projects`, `documents`, `automations`, `templates` translation sections |
