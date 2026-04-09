-- Enforce one active timer per (tenant, user).
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_tracking_one_active_per_user_tenant
  ON time_tracking (tenant_id, user_id)
  WHERE end_time IS NULL;

-- Defensive data correctness: duration cannot be negative.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'time_tracking_duration_non_negative'
  ) THEN
    ALTER TABLE time_tracking
      ADD CONSTRAINT time_tracking_duration_non_negative
      CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
  END IF;
END $$;
