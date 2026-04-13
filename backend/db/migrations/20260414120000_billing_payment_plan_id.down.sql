DROP INDEX IF EXISTS idx_payment_requests_plan_id;
DROP INDEX IF EXISTS idx_payment_requests_tenant;
DROP INDEX IF EXISTS idx_payment_requests_status;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'payment_requests'
  ) THEN
    ALTER TABLE payment_requests
    DROP CONSTRAINT IF EXISTS payment_requests_status_check;

    ALTER TABLE payment_requests
    ADD CONSTRAINT payment_requests_status_check
    CHECK (status IN ('pending', 'confirmed', 'rejected'));

    UPDATE payment_requests
    SET status = 'confirmed'
    WHERE status = 'approved';

    ALTER TABLE payment_requests
    DROP COLUMN IF EXISTS plan_id;
  END IF;
END $$;
