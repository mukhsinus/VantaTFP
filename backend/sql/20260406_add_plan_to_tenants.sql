-- Migration: Add plan column to tenants table for subscription tiers
-- Date: 2026-04-06

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'FREE';

-- Create index on plan for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);

-- Add constraint to ensure valid plan values
ALTER TABLE tenants
ADD CONSTRAINT chk_valid_plan CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE'));
