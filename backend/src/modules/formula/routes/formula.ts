/**
 * Formula Routes - Express API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { ASTNode, EvaluationContext } from '../types/ast';
import { evaluate } from '../evaluator/evaluate';
import { validateAST, ValidationResult } from '../validator/validate';

export interface FormulaRouteOptions {
  pool: Pool;
  allowedVariables?: string[];
  requireAuth?: (req: Request) => string | null; // Returns tenant_id or null
}

export function createFormulaRouter(options: FormulaRouteOptions): Router {
  const router = Router();
  const { pool, allowedVariables = [], requireAuth } = options;

  // Middleware: extract tenant_id
  const getTenantId = (req: Request): string => {
    if (requireAuth) {
      const tenantId = requireAuth(req);
      if (!tenantId) {
        throw new Error('Unauthorized');
      }
      return tenantId;
    }
    // Fallback: try to get from header
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Missing tenant ID');
    }
    return tenantId;
  };

  // POST /formula - Create/save formula
  router.post('/formula', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { name, ast, description } = req.body;

      // Validate input
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "name"' });
      }

      if (!ast || typeof ast !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid "ast"' });
      }

      // Validate AST structure and variables
      const validation = validateAST(ast as ASTNode, {
        allowedVariables: allowedVariables.length > 0 ? allowedVariables : undefined,
      });

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid AST',
          validationErrors: validation.errors.map(e => ({
            path: e.path,
            message: e.message,
            nodeType: e.nodeType,
          })),
        });
      }

      // Save to database
      const id = uuidv4();
      const query = `
        INSERT INTO formulas (id, tenant_id, name, description, ast_json, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, name, created_at
      `;

      const result = await pool.query(query, [
        id,
        tenantId,
        name,
        description || null,
        JSON.stringify(ast),
      ]);

      res.status(201).json({
        id: result.rows[0].id,
        name: result.rows[0].name,
        createdAt: result.rows[0].created_at,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /formula/:id - Get formula
  router.get('/formula/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const query = `
        SELECT id, name, description, ast_json, created_at
        FROM formulas
        WHERE id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Formula not found' });
      }

      const row = result.rows[0];

      res.json({
        id: row.id,
        name: row.name,
        description: row.description,
        ast: row.ast_json,
        createdAt: row.created_at,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /formula/evaluate - Evaluate formula
  router.post('/formula/evaluate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { formulaId, context, trace } = req.body;

      if (!formulaId || typeof formulaId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "formulaId"' });
      }

      if (!context || typeof context !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid "context"' });
      }

      // Fetch formula from DB
      const query = `
        SELECT ast_json FROM formulas
        WHERE id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [formulaId, tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Formula not found' });
      }

      const ast = result.rows[0].ast_json as ASTNode;

      // Evaluate
      try {
        const evalResult = evaluate(ast, context as EvaluationContext, {
          trace: trace === true,
        });

        res.json({
          result: evalResult.value,
          ...(evalResult.trace && { trace: evalResult.trace }),
        });
      } catch (evalError: any) {
        return res.status(400).json({
          error: 'Evaluation failed',
          message: evalError.message,
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // POST /formula/evaluate-inline - Evaluate AST directly (no DB)
  router.post(
    '/formula/evaluate-inline',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ast, context, trace } = req.body;

        if (!ast || typeof ast !== 'object') {
          return res.status(400).json({ error: 'Missing or invalid "ast"' });
        }

        if (!context || typeof context !== 'object') {
          return res.status(400).json({ error: 'Missing or invalid "context"' });
        }

        // Validate AST first
        const validation = validateAST(ast as ASTNode, {
          allowedVariables: allowedVariables.length > 0 ? allowedVariables : undefined,
        });

        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid AST',
            validationErrors: validation.errors.map(e => ({
              path: e.path,
              message: e.message,
              nodeType: e.nodeType,
            })),
          });
        }

        // Evaluate
        try {
          const evalResult = evaluate(ast as ASTNode, context as EvaluationContext, {
            trace: trace === true,
          });

          res.json({
            result: evalResult.value,
            ...(evalResult.trace && { trace: evalResult.trace }),
          });
        } catch (evalError: any) {
          return res.status(400).json({
            error: 'Evaluation failed',
            message: evalError.message,
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /formula - List formulas
  router.get('/formula', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const query = `
        SELECT id, name, description, created_at
        FROM formulas
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [tenantId, limit, offset]);

      res.json({
        formulas: result.rows,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /formula/:id - Delete formula
  router.delete('/formula/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const query = `
        DELETE FROM formulas
        WHERE id = $1 AND tenant_id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Formula not found' });
      }

      res.json({ deleted: true, id });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Error handling middleware
 */
export function formulaErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Formula API error:', err);

  if (err.message === 'Unauthorized') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.message === 'Missing tenant ID') {
    return res.status(400).json({ error: 'Missing tenant ID header' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
