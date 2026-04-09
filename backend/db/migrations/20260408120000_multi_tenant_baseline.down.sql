DROP INDEX IF EXISTS idx_users_tenant_id;

-- Do not drop users.tenant_id automatically — may be required by application; manual rollback if needed.
