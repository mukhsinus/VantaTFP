DROP INDEX IF EXISTS idx_time_tracking_one_active_per_user_tenant;

ALTER TABLE time_tracking
  DROP CONSTRAINT IF EXISTS time_tracking_duration_non_negative;
