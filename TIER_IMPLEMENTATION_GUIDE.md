# Tier Implementation Guide

Complete guide for implementing the Free/Pro/Enterprise tier system in VantaTFP.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - useUserTier hooks                                     │
│  - UpgradeBanner components                              │
│  - PlanSelector component                                │
│  - Feature guards                                        │
└────────────────────┬────────────────────────────────────┘
                     │ API Requests (JWT with tenantPlan)
┌────────────────────────────────────────────────────────┐
│              Backend (Fastify + PostgreSQL)              │
│  - tier.config.ts (feature definitions)                 │
│  - tier-guard middleware (access control)               │
│  - Service layer checks (enforce limits)                │
│  - Database (plan column in tenants table)              │
└──────────────────────────────────────────────────────────┘
```

## Backend Implementation

### 1. Database Migration

Applied via SQL migration: `20260406_add_plan_to_tenants.sql`

```sql
ALTER TABLE tenants ADD COLUMN plan VARCHAR(20) NOT NULL DEFAULT 'FREE';
CREATE INDEX idx_tenants_plan ON tenants(plan);
ALTER TABLE tenants ADD CONSTRAINT chk_valid_plan CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE'));
```

### 2. Tier Configuration

**File:** `backend/src/shared/config/tier.config.ts`

Defines all feature limits and capabilities per tier:
- User/task limits (FREE: 5/50, PRO: 1000/100000, ENT: 10000/1M)
- Feature flags per module (payroll, KPI, tasks, reports, etc.)
- API rate limits (100/1000/10000 req/hr)

### 3. Authentication Flow

Updated `auth.repository.ts` and `auth.service.ts` to include `tenantPlan` in JWT payload:

```typescript
// JWT payload now includes:
{
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
  tenantPlan: 'FREE' | 'PRO' | 'ENTERPRISE';  // NEW
}
```

### 4. Tier Enforcement Middleware

**File:** `backend/src/shared/middleware/tier-guard.middleware.ts`

Provides middleware for checking feature access:

```typescript
// Check if feature is available
app.post('/payroll', requireTierFeature('payroll.fullCrud'), payrollController.create)

// Enforce user limits
app.register(enforceUserLimit(db))
app.register(enforceTaskLimit(db))

// Check specific features
app.get('/kpi/analytics', requireTierFeature('kpiModule.analytics'), kpiController.getAnalytics)
```

### 5. Service Layer Checks

Added methods to enforce tier limits in services:

**PayrollService:**
```typescript
checkWriteAccessAllowed(tenantPlan)     // Prevents edit if not PRO+
checkFeatureAvailable(tenantPlan, feature)
```

**KpiService:**
```typescript
checkPerEmployeeFeature(tenantPlan)
checkFiltersFeature(tenantPlan)
checkAnalyticsFeature(tenantPlan)
```

**TasksService:**
```typescript
checkFeatureAvailable(tenantPlan, feature)  // timeTracking, auditHistory
```

**UsersService:**
```typescript
// Constructor checks user limit in createUser()
createUser(tenantId, data, context, tenantPlan)
```

### 6. Controller Integration

Update controllers to pass tenantPlan from request:

```typescript
// In controller methods
const tenantPlan = request.user?.tenantPlan;

// For write operations
if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
  payrollService.checkWriteAccessAllowed(tenantPlan);
}
```

## Frontend Implementation

### 1. Tier Configuration

**File:** `frontend/src/shared/config/tier.config.ts`

Mirrors backend configuration for UI-level feature gating.

### 2. Custom Hooks

**File:** `frontend/src/shared/hooks/useUserTier.ts`

Provides hooks to check tier features:

```typescript
// Get user's current tier info
const { plan, maxUsers, maxTasks } = useUserTier();

// Check feature availability
const { available, message } = useFeatureAccess('payroll.fullCrud');

// Module-specific checks
const { canEdit, isReadOnly } = usePayrollAccess();
const { canTrackTime, canViewHistory } = useTasksAccess();
const { canViewAnalytics, canCreatePerEmployee } = useKpiAccess();
```

### 3. UI Components

**UpgradeBanner Component** - Show upgrade prompts:
```tsx
<UpgradeBanner
  featureName="Time Tracking"
  currentPlan={plan}
  variant="inline"  // or 'modal', 'badge'
  dismissible={true}
  onUpgradeClick={() => navigate('/pricing')}
/>
```

**UpgradeFeatureGuard Component** - Wrap features:
```tsx
<UpgradeFeatureGuard
  available={canTrackTime}
  featureName="Time Tracking"
  currentPlan={plan}
>
  {/* Feature content - shown only if available */}
  <TimeTracker />
</UpgradeFeatureGuard>
```

**PlanSelector Component** - Pricing page:
```tsx
<PlanSelector 
  currentPlan={userPlan}
  onSelectPlan={(plan) => handleUpgrade(plan)}
/>
<PlanComparisonTable />
```

## Implementation Checklist

### Backend Tasks
- [x] Create tier config (`tier.config.ts`)
- [x] Create migration (`20260406_add_plan_to_tenants.sql`)
- [x] Update auth to include tenantPlan in JWT
- [x] Create tier enforcement middleware (`tier-guard.middleware.ts`)
- [x] Update service layers with feature checks
- [ ] Integrate middleware in controllers
- [ ] Add billing integration (Stripe/Paddle)
- [ ] Create admin panel for plan management
- [ ] Add plan upgrade endpoints

### Frontend Tasks
- [x] Create tier config (`tier.config.ts`)
- [x] Create useUserTier hooks
- [x] Create UpgradeBanner component
- [x] Create PlanSelector component
- [x] Create example implementations
- [ ] Integrate hooks in actual components
- [ ] Hide/disable features based on tier
- [ ] Add upgrade flows
- [ ] Create settings page for plan info
- [ ] Add tour/onboarding for new features

## Usage Examples

### Example 1: Payroll Module (Read-only for FREE, CRUD for PRO+)

```typescript
// Backend
app.get('/payroll', async (request) => {
  const entries = await payrollService.listPayrollEntries(request.user.tenantId);
  return entries;  // Always readable
});

app.post('/payroll', async (request) => {
  const { tenantPlan } = request.user;
  payrollService.checkWriteAccessAllowed(tenantPlan);  // Throws if FREE
  const entry = await payrollService.createPayrollEntry(...);
  return entry;
});

// Frontend
function PayrollPage() {
  const { canEdit, isReadOnly, plan, message } = usePayrollAccess();
  
  return (
    <>
      {isReadOnly && (
        <UpgradeBanner
          featureName="Payroll Editing"
          currentPlan={plan}
          onUpgradeClick={handleUpgrade}
        />
      )}
      
      <PayrollList />
      
      {canEdit && (
        <button onClick={handleCreatePayroll}>Create Entry</button>
      )}
    </>
  );
}
```

### Example 2: Time Tracking (PRO+ feature)

```typescript
// Backend
app.post('/tasks/:id/time-tracking', async (request) => {
  const { tenantPlan } = request.user;
  tasksService.checkFeatureAvailable(tenantPlan, 'timeTracking');  // Throws if not PRO+
  // ... record time
});

// Frontend
function TaskCard({ task }) {
  const { canTrackTime } = useTasksAccess();
  
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      
      {!canTrackTime && (
        <UpgradeBanner
          featureName="Time Tracking"
          variant="badge"
        />
      )}
      
      <UpgradeFeatureGuard
        available={canTrackTime}
        featureName="Time Tracking"
        currentPlan={plan}
      >
        <TimeTracker taskId={task.id} />
      </UpgradeFeatureGuard>
    </div>
  );
}
```

### Example 3: KPI Analytics (PRO+ feature)

```typescript
// Backend
app.get('/kpi/analytics', async (request) => {
  const { tenantPlan } = request.user;
  kpiService.checkAnalyticsFeature(tenantPlan);  // Throws if not PRO+
  const analytics = await kpiService.getAdvancedAnalytics(request.user.tenantId);
  return analytics;
});

// Frontend
function KpiAnalytics() {
  const { canViewAnalytics, plan } = useKpiAccess();
  
  return (
    <UpgradeFeatureGuard
      available={canViewAnalytics}
      featureName="KPI Analytics"
      currentPlan={plan}
      fallback={
        <div className="placeholder">
          <p>Analytics available in PRO and ENTERPRISE plans</p>
          <button onClick={handleUpgrade}>Upgrade</button>
        </div>
      }
    >
      <AnalyticsDashboard />
    </UpgradeFeatureGuard>
  );
}
```

### Example 4: User Limits

```typescript
// Backend
const features = getTierFeatures(request.user.tenantPlan);
const currentUsers = await usersRepository.countActiveByTenant(tenantId);
if (currentUsers >= features.maxUsers) {
  throw ApplicationError.forbidden('User limit reached');
}

// Frontend
function UserManagement() {
  const { maxUsers, plan } = useUserLimits();
  const [userCount, setUserCount] = useState(3);
  
  const canAddMore = userCount < maxUsers;
  
  return (
    <>
      <p>Users: {userCount} / {maxUsers}</p>
      <button disabled={!canAddMore}>
        {canAddMore ? 'Add User' : 'User Limit Reached'}
      </button>
    </>
  );
}
```

## Billing Integration

### Stripe Integration Points

```typescript
// Create Stripe customer when tenant upgrades
POST /api/billing/upgrade
{
  tenantId: string;
  planId: 'PRO' | 'ENTERPRISE';
  stripeToken: string;
}

// Webhook for payment success
POST /webhooks/stripe
event: 'payment_intent.succeeded'
→ Update tenant.plan in database

// Webhook for subscription cancel
POST /webhooks/stripe
event: 'customer.subscription.deleted'
→ Downgrade tenant to FREE
```

## Monitoring & Analytics

Track tier usage:

```typescript
// Log feature usage
logger.info('Feature accessed', {
  tenantId,
  feature: 'kpiModule.analytics',
  plan: request.user.tenantPlan
});

// Monitor tier adoption
SELECT plan, COUNT(*) as tenant_count
FROM tenants
GROUP BY plan;
```

## Testing

### Backend Tests

```typescript
describe('PayrollService', () => {
  it('allows CRUD for PRO plan', async () => {
    const service = new PayrollService(repository);
    service.checkWriteAccessAllowed('PRO');  // Should not throw
  });

  it('throws for FREE plan', async () => {
    expect(() => service.checkWriteAccessAllowed('FREE'))
      .toThrow(/not available/);
  });
});

describe('User limits', () => {
  it('enforces user limit for FREE tier', async () => {
    // 5 users already created
    expect(async () => {
      await usersService.createUser(tenantId, newUser, context, 'FREE');
    }).toThrow(/User limit/);
  });
});
```

### Frontend Tests

```tsx
describe('usePayrollAccess hook', () => {
  it('returns canEdit=true for PRO plan', () => {
    localStorage.setItem('user', JSON.stringify({ tenantPlan: 'PRO' }));
    const { result } = renderHook(() => usePayrollAccess());
    expect(result.current.canEdit).toBe(true);
  });

  it('returns canEdit=false for FREE plan', () => {
    localStorage.setItem('user', JSON.stringify({ tenantPlan: 'FREE' }));
    const { result } = renderHook(() => usePayrollAccess());
    expect(result.current.canEdit).toBe(false);
  });
});
```

## Migration from Non-tiered System

1. **Backup database**
2. **Run migration** to add plan column (defaults to FREE)
3. **Deploy backend** with tier enforcement (requires tenantPlan in JWT)
4. **Update controllers** to pass tenantPlan to services
5. **Deploy frontend** with tier UI components
6. **Test thoroughly** - especially upgrade paths
7. **Communicate** tier structure to users

## Future Enhancements

- [ ] Usage-based billing (pay per task/user as overage)
- [ ] Custom plan tiers
- [ ] Trial periods for PRO
- [ ] Annual billing discount
- [ ] Team seat management
- [ ] Usage analytics dashboard
- [ ] Automatic downgrade on failed payment
- [ ] Mid-month plan changes (pro-rata billing)

---

**Last Updated:** April 6, 2026
**Status:** Implementation complete, ready for integration testing
