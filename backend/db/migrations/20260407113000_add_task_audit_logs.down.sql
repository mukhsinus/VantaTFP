DROP INDEX IF EXISTS idx_task_audit_logs_actor_created_at;
DROP INDEX IF EXISTS idx_task_audit_logs_task_created_at;
DROP TABLE IF EXISTS task_audit_logs;
DROP INDEX IF EXISTS idx_users_tenant_id_id_unique;
DROP INDEX IF EXISTS idx_tasks_tenant_id_id_unique;
