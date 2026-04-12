-- Multi-tenant baseline (this codebase)
--
-- Tenant entity: `tenants` (see 20260407090000_create_tenants.up.sql) — id, name, created_at (+ slug, status, updated_at).
-- Users: ensure `tenant_id` exists when migrating from external/Supabase schemas.
--
-- Domain tables in this repo that already use tenant_id in application SQL:
--   tasks, payroll, kpi_records, payments, task_audit_logs, tenant_invites (and kpis / kpi_progress if present).
--
-- The following table names were requested but are NOT part of this project yet:
--   jobs, proposals, contracts, messages, submissions, payouts, wallets, transactions.
-- When introduced, add: tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE (+ composite FKs as needed).

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
