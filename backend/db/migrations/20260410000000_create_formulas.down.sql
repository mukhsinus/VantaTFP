-- Drop formulas table
DROP TRIGGER IF EXISTS trigger_formulas_updated_at ON formulas;
DROP FUNCTION IF EXISTS update_formulas_updated_at();
DROP TABLE IF EXISTS formulas;
