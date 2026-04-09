DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usage_tracking_tenant_metric_period_start_key'
  ) THEN
    ALTER TABLE usage_tracking
      ADD CONSTRAINT usage_tracking_tenant_metric_period_start_key
      UNIQUE (tenant_id, metric, period_start);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_unique_tenant_metric_period
  ON usage_tracking (tenant_id, metric, period_start);
