DROP TABLE IF EXISTS tenants;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    DROP TYPE tenant_status;
  END IF;
END$$;
