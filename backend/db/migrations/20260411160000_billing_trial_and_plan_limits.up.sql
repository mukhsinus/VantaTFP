-- Trial billing: subscription status enum, denormalized limits, unlimited plan, plan JSON updates.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled');
  END IF;
END$$;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS tasks_limit INTEGER,
  ADD COLUMN IF NOT EXISTS api_limit INTEGER,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.tasks_limit IS 'Per-tenant task cap snapshot; NULL = unlimited.';
COMMENT ON COLUMN subscriptions.api_limit IS 'API requests per UTC hour snapshot; NULL = unlimited.';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'When the free trial ends (new tenants).';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Billing period end; for trial, often aligned with trial_ends_at.';

-- Normalize legacy text status before casting to enum
UPDATE subscriptions
SET status = lower(trim(status::text))
WHERE status IS NOT NULL;

ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE subscriptions
  ALTER COLUMN status TYPE subscription_status
  USING (
    CASE lower(trim(status::text))
      WHEN 'trial' THEN 'trial'::subscription_status
      WHEN 'past_due' THEN 'past_due'::subscription_status
      WHEN 'canceled' THEN 'canceled'::subscription_status
      WHEN 'active' THEN 'active'::subscription_status
      ELSE 'active'::subscription_status
    END
  );

ALTER TABLE subscriptions
  ALTER COLUMN status SET DEFAULT 'active'::subscription_status;

-- Plan catalog: basic / pro numeric caps; unlimited = no caps
UPDATE plans
SET limits = '{"users":5,"tasks":500,"api_rate_per_hour":100}'::jsonb,
    updated_at = NOW()
WHERE name = 'basic';

UPDATE plans
SET limits = '{"users":15,"tasks":5000,"api_rate_per_hour":1000}'::jsonb,
    updated_at = NOW()
WHERE name = 'pro';

INSERT INTO plans (name, limits)
VALUES ('unlimited', '{"users":null,"tasks":null,"api_rate_per_hour":null}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- Backfill denormalized limits on existing subscriptions from plan JSON
UPDATE subscriptions s
SET
  max_users = CASE
    WHEN jsonb_typeof(p.limits->'users') = 'null' OR (p.limits->>'users') IS NULL THEN NULL
    ELSE (NULLIF(p.limits->>'users', 'null'))::integer
  END,
  tasks_limit = CASE
    WHEN jsonb_typeof(p.limits->'tasks') = 'null' OR (p.limits->>'tasks') IS NULL THEN NULL
    ELSE (NULLIF(p.limits->>'tasks', 'null'))::integer
  END,
  api_limit = CASE
    WHEN jsonb_typeof(p.limits->'api_rate_per_hour') = 'null'
      OR (p.limits->>'api_rate_per_hour') IS NULL
    THEN NULL
    ELSE (NULLIF(p.limits->>'api_rate_per_hour', 'null'))::integer
  END
FROM plans p
WHERE s.plan_id = p.id;
