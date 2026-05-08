-- Rollback formulas table enhancements
DROP INDEX IF EXISTS idx_formulas_tenant_type;
DROP INDEX IF EXISTS idx_formulas_created_by;
DROP INDEX IF EXISTS idx_formulas_type;

ALTER TABLE formulas
DROP CONSTRAINT IF NOT EXISTS fk_formulas_created_by;

ALTER TABLE formulas
DROP COLUMN IF EXISTS applied_to,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS formula_type;
