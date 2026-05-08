-- Add formula_type and created_by columns to formulas table
ALTER TABLE formulas
ADD COLUMN IF NOT EXISTS formula_type VARCHAR(50) NOT NULL DEFAULT 'kpi' CHECK (formula_type IN ('kpi', 'salary')),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS applied_to VARCHAR(50) DEFAULT 'tenant' CHECK (applied_to IN ('tenant', 'employee'));

-- Add foreign key for created_by
ALTER TABLE formulas
ADD CONSTRAINT fk_formulas_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_formulas_type ON formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_created_by ON formulas(created_by);
CREATE INDEX IF NOT EXISTS idx_formulas_tenant_type ON formulas(tenant_id, formula_type);
