/**
 * Formula Module Integration
 * For Fastify or Express backends
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ASTNode, EvaluationContext } from '../types/ast';
import { FormulaRepository } from '../repository/FormulaRepository';
import { FormulaService } from '../service/FormulaService';
import { validateAST } from '../validator/validate';
import { evaluate } from '../evaluator/evaluate';

export interface FormulaModuleConfig {
  pool: Pool;
  allowedVariables?: string[];
  maxDepth?: number;
  getTenantId?: (req: FastifyRequest) => string | null;
}

/**
 * Register formula routes with Fastify
 */
export async function registerFormulaModule(
  app: FastifyInstance,
  config: FormulaModuleConfig
) {
  const {
    pool,
    allowedVariables = [],
    maxDepth = 50,
    getTenantId = (req) => (req.headers['x-tenant-id'] as string) || null,
  } = config;

  const repository = new FormulaRepository(pool);
  const service = new FormulaService(repository, {
    allowedVariables,
    maxDepth,
  });

  // Helper to extract and validate tenant ID
  const requireTenant = (req: FastifyRequest): string => {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      throw new Error('Unauthorized');
    }
    return tenantId;
  };

  // POST /formulas - Create formula
  app.post<{ Body: { name: string; description?: string; ast: ASTNode } }>(
    '/formulas',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { name, description, ast } = req.body;

        if (!name || typeof name !== 'string') {
          return res.status(400).send({ error: 'Missing or invalid "name"' });
        }

        if (!ast || typeof ast !== 'object') {
          return res.status(400).send({ error: 'Missing or invalid "ast"' });
        }

        // Validate AST
        const validation = service.validateAST(ast);
        if (!validation.valid) {
          return res.status(400).send({
            error: 'Invalid AST',
            validationErrors: validation.errors.map(e => ({
              path: e.path,
              message: e.message,
              nodeType: e.nodeType,
            })),
          });
        }

        // Create formula
        const formula = await service.createFormula(
          { name, description, ast },
          tenantId
        );

        return res.status(201).send({
          id: formula.id,
          name: formula.name,
          createdAt: formula.createdAt,
        });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(500).send({
          error: 'Failed to create formula',
          message: error.message,
        });
      }
    }
  );

  // GET /formulas/:id - Get formula
  app.get<{ Params: { id: string } }>(
    '/formulas/:id',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { id } = req.params;

        const formula = await service.getFormula(id, tenantId);
        if (!formula) {
          return res.status(404).send({ error: 'Formula not found' });
        }

        return res.send({
          id: formula.id,
          name: formula.name,
          description: formula.description,
          ast: formula.ast,
          createdAt: formula.createdAt,
          updatedAt: formula.updatedAt,
        });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(500).send({ error: 'Failed to fetch formula' });
      }
    }
  );

  // GET /formulas - List formulas
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/formulas',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const limit = Math.min(parseInt(req.query.limit || '50'), 100);
        const offset = parseInt(req.query.offset || '0');

        const formulas = await service.listFormulas(tenantId, limit, offset);

        return res.send({
          formulas: formulas.map(f => ({
            id: f.id,
            name: f.name,
            description: f.description,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          })),
          limit,
          offset,
        });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(500).send({ error: 'Failed to list formulas' });
      }
    }
  );

  // POST /formulas/:id - Update formula
  app.patch<{ Params: { id: string }; Body: { name?: string; description?: string; ast?: ASTNode } }>(
    '/formulas/:id',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { id } = req.params;
        const { name, description, ast } = req.body;

        // Validate AST if provided
        if (ast) {
          const validation = service.validateAST(ast);
          if (!validation.valid) {
            return res.status(400).send({
              error: 'Invalid AST',
              validationErrors: validation.errors,
            });
          }
        }

        const formula = await service.updateFormula(id, tenantId, {
          name,
          description,
          ast,
        });

        if (!formula) {
          return res.status(404).send({ error: 'Formula not found' });
        }

        return res.send({
          id: formula.id,
          name: formula.name,
          description: formula.description,
          updatedAt: formula.updatedAt,
        });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(500).send({ error: 'Failed to update formula' });
      }
    }
  );

  // DELETE /formulas/:id - Delete formula
  app.delete<{ Params: { id: string } }>(
    '/formulas/:id',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { id } = req.params;

        const deleted = await service.deleteFormula(id, tenantId);
        if (!deleted) {
          return res.status(404).send({ error: 'Formula not found' });
        }

        return res.send({ deleted: true, id });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(500).send({ error: 'Failed to delete formula' });
      }
    }
  );

  // POST /formulas/:id/evaluate - Evaluate stored formula
  app.post<{
    Params: { id: string };
    Body: { context: EvaluationContext; trace?: boolean };
  }>(
    '/formulas/:id/evaluate',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { id } = req.params;
        const { context, trace } = req.body;

        if (!context || typeof context !== 'object') {
          return res.status(400).send({ error: 'Missing or invalid "context"' });
        }

        const result = await service.evaluateFormula(id, tenantId, context, { trace });

        return res.send({
          result: result.value,
          ...(result.trace && { trace: result.trace }),
        });
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        if (error.message.includes('not found')) {
          return res.status(404).send({ error: error.message });
        }
        return res.status(400).send({
          error: 'Evaluation failed',
          message: error.message,
        });
      }
    }
  );

  // POST /formulas/evaluate-inline - Evaluate AST directly
  app.post<{ Body: { ast: ASTNode; context: EvaluationContext; trace?: boolean } }>(
    '/formulas/evaluate-inline',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const { ast, context, trace } = req.body;

        if (!ast || typeof ast !== 'object') {
          return res.status(400).send({ error: 'Missing or invalid "ast"' });
        }

        if (!context || typeof context !== 'object') {
          return res.status(400).send({ error: 'Missing or invalid "context"' });
        }

        // Validate first
        const validation = service.validateAST(ast);
        if (!validation.valid) {
          return res.status(400).send({
            error: 'Invalid AST',
            validationErrors: validation.errors,
          });
        }

        const result = service.evaluateAST(ast, context, { trace });

        return res.send({
          result: result.value,
          ...(result.trace && { trace: result.trace }),
        });
      } catch (error: any) {
        return res.status(400).send({
          error: 'Evaluation failed',
          message: error.message,
        });
      }
    }
  );

  // POST /formulas/batch-evaluate - Evaluate multiple formulas
  app.post<{
    Body: { formulaIds: string[]; context: EvaluationContext; trace?: boolean };
  }>(
    '/formulas/batch-evaluate',
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const tenantId = requireTenant(req);
        const { formulaIds, context, trace } = req.body;

        if (!Array.isArray(formulaIds)) {
          return res.status(400).send({ error: 'formulaIds must be an array' });
        }

        const results = await service.evaluateFormulas(
          formulaIds,
          tenantId,
          context,
          { trace }
        );

        const output: Record<string, any> = {};
        for (const [formulaId, result] of results) {
          if (result instanceof Error) {
            output[formulaId] = { error: result.message };
          } else {
            output[formulaId] = {
              result: result.value,
              ...(result.trace && { trace: result.trace }),
            };
          }
        }

        return res.send(output);
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return res.status(401).send({ error: 'Unauthorized' });
        }
        return res.status(400).send({ error: error.message });
      }
    }
  );
}
