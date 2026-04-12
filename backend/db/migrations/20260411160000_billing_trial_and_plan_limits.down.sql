-- Revert billing trial + denormalized limits (subscriptions.status returns to TEXT).

ALTER TABLE subscriptions DROP COLUMN IF EXISTS current_period_end;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS api_limit;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS tasks_limit;

ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE subscriptions
  ALTER COLUMN status TYPE TEXT
  USING (status::text);

ALTER TABLE subscriptions
  ALTER COLUMN status SET DEFAULT 'active';

DROP TYPE IF EXISTS subscription_status;

-- Optional: remove unlimited plan row (only if unused — skipped to avoid FK issues)
