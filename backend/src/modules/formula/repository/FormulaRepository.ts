/**
 * Formula Repository - Data Access Layer
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ASTNode } from '../types/ast';

export type FormulaType = 'kpi' | 'salary';
export type AppliedTo = 'tenant' | 'employee';

export interface Formula {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  astJson: ASTNode;
  formulaType: FormulaType;
  createdBy?: string; // user_id of employer who created it
  appliedTo: AppliedTo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormulaInput {
  tenantId: string;
  name: string;
  description?: string;
  ast: ASTNode;
  formulaType: FormulaType;
  createdBy?: string;
  appliedTo?: AppliedTo;
}

export interface UpdateFormulaInput {
  name?: string;
  description?: string;
  ast?: ASTNode;
  formulaType?: FormulaType;
}

export class FormulaRepository {
  constructor(private pool: Pool) {}

  async create(input: CreateFormulaInput): Promise<Formula> {
    const id = uuidv4();
    const query = `
      INSERT INTO formulas (id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at
    `;

    const result = await this.pool.query(query, [
      id,
      input.tenantId,
      input.name,
      input.description || null,
      JSON.stringify(input.ast),
      input.formulaType,
      input.createdBy || null,
      input.appliedTo || 'tenant',
    ]);

    return this.rowToFormula(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<Formula | null> {
    const query = `
      SELECT id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at
      FROM formulas
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await this.pool.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToFormula(result.rows[0]);
  }

  async findByTenant(tenantId: string, limit = 50, offset = 0): Promise<Formula[]> {
    const query = `
      SELECT id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at
      FROM formulas
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [tenantId, limit, offset]);

    return result.rows.map(row => this.rowToFormula(row));
  }

  async findByTenantAndType(tenantId: string, formulaType: FormulaType): Promise<Formula[]> {
    const query = `
      SELECT id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at
      FROM formulas
      WHERE tenant_id = $1 AND formula_type = $2
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [tenantId, formulaType]);

    return result.rows.map(row => this.rowToFormula(row));
  }

  async update(id: string, tenantId: string, input: UpdateFormulaInput): Promise<Formula | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }

    if (input.ast !== undefined) {
      setClauses.push(`ast_json = $${paramIndex++}`);
      values.push(JSON.stringify(input.ast));
    }

    if (input.formulaType !== undefined) {
      setClauses.push(`formula_type = $${paramIndex++}`);
      values.push(input.formulaType);
    }

    if (setClauses.length === 1) {
      // Only updated_at was set
      const existingFormula = await this.findById(id, tenantId);
      return existingFormula;
    }

    values.push(id);
    values.push(tenantId);

    const query = `
      UPDATE formulas
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex + 2}
      RETURNING id, tenant_id, name, description, ast_json, formula_type, created_by, applied_to, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToFormula(result.rows[0]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM formulas
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;

    const result = await this.pool.query(query, [id, tenantId]);

    return result.rows.length > 0;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM formulas WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return parseInt(result.rows[0].count, 10);
  }

  private rowToFormula(row: any): Formula {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      astJson: row.ast_json,
      formulaType: row.formula_type as FormulaType,
      createdBy: row.created_by,
      appliedTo: (row.applied_to || 'tenant') as AppliedTo,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
