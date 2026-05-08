-- Create formulas table
CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ast_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_formulas_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_formulas_tenant_id ON formulas(tenant_id);
CREATE INDEX idx_formulas_created_at ON formulas(created_at DESC);
CREATE INDEX idx_formulas_tenant_created ON formulas(tenant_id, created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_formulas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_formulas_updated_at
BEFORE UPDATE ON formulas
FOR EACH ROW
EXECUTE FUNCTION update_formulas_updated_at();
