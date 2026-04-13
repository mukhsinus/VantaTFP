-- Update plan catalog to match spec: Basic $5, Pro $10, Business $50, Enterprise $200
-- Trial: 15 days (per spec)

ALTER TABLE plans
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Remove old plans that don't match spec
DELETE FROM plans WHERE name NOT IN ('basic', 'pro', 'business', 'enterprise');

-- Upsert Basic plan: $5/month, 2 employees, 50 tasks
INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'basic',
  5.00,
  '{"users": 2, "tasks": 50, "api_rate_per_hour": 100}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- Upsert Pro plan: $10/month, 20 employees, 500 tasks
INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'pro',
  10.00,
  '{"users": 20, "tasks": 500, "api_rate_per_hour": 500}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- Upsert Business plan: $50/month, 50 employees, 2000 tasks
INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'business',
  50.00,
  '{"users": 50, "tasks": 2000, "api_rate_per_hour": 2000}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- Upsert Enterprise plan: $200/month, unlimited
INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'enterprise',
  200.00,
  '{"users": null, "tasks": null, "api_rate_per_hour": null}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();
