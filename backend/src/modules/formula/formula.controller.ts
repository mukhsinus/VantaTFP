/**
 * Formula Controller - Fastify Routes
 * Only tenant owners (employers) can create/update/delete formulas
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { z } from 'zod';
import { FormulaRepository } from './repository/FormulaRepository.js';
import { FormulaService } from './service/FormulaService.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';

// Schemas
const createFormulaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  formulaType: z.enum(['kpi', 'salary']),
  ast: z.record(z.any()),
});

const updateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  formulaType: z.enum(['kpi', 'salary']).optional(),
  ast: z.record(z.any()).optional(),
});

const formulaIdSchema = z.object({
  id: z.string().uuid(),
});

const formulaTypeQuerySchema = z.object({
  type: z.enum(['kpi', 'salary']).optional(),
});

export async function formulaRoutes(app: FastifyInstance): Promise<void> {
  const db = app.db as Pool;
  const formulaRepository = new FormulaRepository(db);
  const formulaService = new FormulaService(formulaRepository, {
    allowedVariables: [
      // KPI variables
      'completed_tasks', 'on_time_tasks', 'overdue_tasks', 'quality_score', 'performance',
      // Salary variables
      'base_salary', 'kpi_score', 'bonus_percent', 'attendance_rate',
      // Generic
      'bonus', 'tasks_completed',
    ],
  });

  const authenticate = app.authenticate;

  /**
   * POST /formulas - Create formula (only employer/owner)
   */
  app.post<{ Body: z.infer<typeof createFormulaSchema> }>(
    '/formulas',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Only tenant owners (role 'OWNER') can create formulas
        if (request.user.tenant_role !== 'OWNER') {
          return sendError(
            reply,
            ApplicationError.forbidden('Only tenant owners can create formulas'),
            403
          );
        }

        const input = createFormulaSchema.parse(request.body);

        const formula = await formulaService.createFormula(
          {
            ...input,
            createdBy: request.user.userId,
          },
          request.user.tenantId
        );

        return sendSuccess(reply, formula, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, ApplicationError.badRequest(error.errors[0].message), 400);
        }
        throw error;
      }
    }
  );

  /**
   * GET /formulas - List formulas for tenant
   */
  app.get<{ Querystring: z.infer<typeof formulaTypeQuerySchema> }>(
    '/formulas',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = formulaTypeQuerySchema.parse(request.query);

      let formulas;
      if (query.type) {
        formulas = await formulaService.listFormulasByType(request.user.tenantId, query.type);
      } else {
        formulas = await formulaService.listFormulas(request.user.tenantId);
      }

      return sendSuccess(reply, formulas);
    }
  );

  /**
   * GET /formulas/:id - Get formula by ID
   */
  app.get<{ Params: z.infer<typeof formulaIdSchema> }>(
    '/formulas/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = formulaIdSchema.parse(request.params);

      const formula = await formulaService.getFormula(id, request.user.tenantId);
      if (!formula) {
        return sendError(reply, ApplicationError.notFound('Formula not found'), 404);
      }

      assertTenantEntityMatch(formula.tenantId, request.user.tenantId, 'Formula');

      return sendSuccess(reply, formula);
    }
  );

  /**
   * PUT /formulas/:id - Update formula (only creator or owner)
   */
  app.put<{ Params: z.infer<typeof formulaIdSchema>; Body: z.infer<typeof updateFormulaSchema> }>(
    '/formulas/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Only tenant owners can update formulas
        if (request.user.tenant_role !== 'OWNER') {
          return sendError(
            reply,
            ApplicationError.forbidden('Only tenant owners can update formulas'),
            403
          );
        }

        const { id } = formulaIdSchema.parse(request.params);
        const input = updateFormulaSchema.parse(request.body);

        const existing = await formulaService.getFormula(id, request.user.tenantId);
        if (!existing) {
          return sendError(reply, ApplicationError.notFound('Formula not found'), 404);
        }

        assertTenantEntityMatch(existing.tenantId, request.user.tenantId, 'Formula');

        const updated = await formulaService.updateFormula(id, request.user.tenantId, input);
        return sendSuccess(reply, updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, ApplicationError.badRequest(error.errors[0].message), 400);
        }
        throw error;
      }
    }
  );

  /**
   * DELETE /formulas/:id - Delete formula (only owner)
   */
  app.delete<{ Params: z.infer<typeof formulaIdSchema> }>(
    '/formulas/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Only tenant owners can delete formulas
      if (request.user.tenant_role !== 'OWNER') {
        return sendError(
          reply,
          ApplicationError.forbidden('Only tenant owners can delete formulas'),
          403
        );
      }

      const { id } = formulaIdSchema.parse(request.params);

      const existing = await formulaService.getFormula(id, request.user.tenantId);
      if (!existing) {
        return sendError(reply, ApplicationError.notFound('Formula not found'), 404);
      }

      assertTenantEntityMatch(existing.tenantId, request.user.tenantId, 'Formula');

      const deleted = await formulaService.deleteFormula(id, request.user.tenantId);

      if (!deleted) {
        return sendError(reply, ApplicationError.internalError('Failed to delete formula'), 500);
      }

      return sendSuccess(reply, { id, deleted: true });
    }
  );

  /**
   * POST /formulas/:id/evaluate - Evaluate formula
   */
  app.post<{
    Params: z.infer<typeof formulaIdSchema>;
    Body: { context: Record<string, number> };
  }>(
    '/formulas/:id/evaluate',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = formulaIdSchema.parse(request.params);
        const { context } = request.body;

        if (!context || typeof context !== 'object') {
          return sendError(reply, ApplicationError.badRequest('Missing or invalid context'), 400);
        }

        const result = await formulaService.evaluateFormula(
          id,
          request.user.tenantId,
          context as Record<string, number>
        );

        return sendSuccess(reply, result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, ApplicationError.badRequest(error.errors[0].message), 400);
        }
        if (error instanceof Error && error.message.includes('not found')) {
          return sendError(reply, ApplicationError.notFound(error.message), 404);
        }
        throw error;
      }
    }
  );
}
