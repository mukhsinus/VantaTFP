-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS object_task_dependencies;
DROP TABLE IF EXISTS object_audit_logs;
DROP TABLE IF EXISTS object_tasks;
DROP TABLE IF EXISTS objects;

-- Drop ENUM types
DROP TYPE IF EXISTS task_priority;
DROP TYPE IF EXISTS object_task_status;
DROP TYPE IF EXISTS object_type;
