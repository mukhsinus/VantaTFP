-- Roll back plan catalog to previous baseline (basic/pro only).
-- Keep `price` column for backward compatibility with runtime billing logic.

DELETE FROM plans
WHERE name IN ('business', 'enterprise');

INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'basic',
  5.00,
  '{"users":5,"tasks":500,"api_rate_per_hour":100}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();

INSERT INTO plans (id, name, price, limits, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'pro',
  10.00,
  '{"users":null,"tasks":null,"api_rate_per_hour":1000}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  limits = EXCLUDED.limits,
  updated_at = NOW();
