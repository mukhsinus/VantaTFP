/**
 * Formula Service - Business Logic Layer
 */

import { FormulaRepository, CreateFormulaInput, UpdateFormulaInput, FormulaType, AppliedTo } from '../repository/FormulaRepository';
import { ASTNode, EvaluationContext, EvaluationResult } from '../types/ast';
import { evaluate, EvaluationError } from '../evaluator/evaluate';
import { validateAST, ValidationResult } from '../validator/validate';

export interface FormulaServiceOptions {
  allowedVariables?: string[];
  maxDepth?: number;
}

export interface FormulaWithAST {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  ast: ASTNode;
  formulaType: FormulaType;
  createdBy?: string;
  appliedTo: AppliedTo;
  createdAt: Date;
  updatedAt: Date;
}

export class FormulaService {
  private repository: FormulaRepository;
  private allowedVariables: Set<string>;
  private maxDepth: number;

  constructor(repository: FormulaRepository, options: FormulaServiceOptions = {}) {
    this.repository = repository;
    this.allowedVariables = new Set(options.allowedVariables || []);
    this.maxDepth = options.maxDepth || 50;
  }

  /**
   * Create a new formula with validation
   */
  async createFormula(
    input: Omit<CreateFormulaInput, 'tenantId'>,
    tenantId: string
  ): Promise<FormulaWithAST> {
    // Validate AST before saving
    const validation = this.validateAST(input.ast);
    if (!validation.valid) {
      throw new Error(`Invalid AST: ${validation.errors.map(e => e.message).join('; ')}`);
    }

    const formula = await this.repository.create({
      ...input,
      tenantId,
    });

    return this.repositoryToService(formula);
  }

  /**
   * Get formula by ID
   */
  async getFormula(id: string, tenantId: string): Promise<FormulaWithAST | null> {
    const formula = await this.repository.findById(id, tenantId);
    return formula ? this.repositoryToService(formula) : null;
  }

  /**
   * List formulas for tenant
   */
  async listFormulas(tenantId: string, limit = 50, offset = 0): Promise<FormulaWithAST[]> {
    const formulas = await this.repository.findByTenant(tenantId, limit, offset);
    return formulas.map(f => this.repositoryToService(f));
  }

  /**
   * List formulas for tenant by type
   */
  async listFormulasByType(tenantId: string, formulaType: FormulaType): Promise<FormulaWithAST[]> {
    const formulas = await this.repository.findByTenantAndType(tenantId, formulaType);
    return formulas.map(f => this.repositoryToService(f));
  }

  /**
   * Update formula with validation
   */
  async updateFormula(
    id: string,
    tenantId: string,
    input: UpdateFormulaInput
  ): Promise<FormulaWithAST | null> {
    // Validate AST if provided
    if (input.ast) {
      const validation = this.validateAST(input.ast);
      if (!validation.valid) {
        throw new Error(`Invalid AST: ${validation.errors.map(e => e.message).join('; ')}`);
      }
    }

    const formula = await this.repository.update(id, tenantId, input);
    return formula ? this.repositoryToService(formula) : null;
  }

  /**
   * Delete formula
   */
  async deleteFormula(id: string, tenantId: string): Promise<boolean> {
    return this.repository.delete(id, tenantId);
  }

  /**
   * Evaluate a formula from database
   */
  async evaluateFormula(
    formulaId: string,
    tenantId: string,
    context: EvaluationContext,
    options: { trace?: boolean } = {}
  ): Promise<EvaluationResult> {
    const formula = await this.getFormula(formulaId, tenantId);
    if (!formula) {
      throw new Error(`Formula not found: ${formulaId}`);
    }

    return this.evaluateAST(formula.ast, context, options);
  }

  /**
   * Evaluate AST directly (without database)
   */
  evaluateAST(
    ast: ASTNode,
    context: EvaluationContext,
    options: { trace?: boolean } = {}
  ): EvaluationResult {
    // Validate context values are numbers
    for (const [key, value] of Object.entries(context)) {
      if (typeof value !== 'number') {
        throw new Error(`Context variable "${key}" must be a number, got ${typeof value}`);
      }
      if (!Number.isFinite(value)) {
        throw new Error(`Context variable "${key}" must be finite, got ${value}`);
      }
    }

    // Evaluate with error handling
    try {
      return evaluate(ast, context, options);
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error;
      }
      throw new Error(`Evaluation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate AST structure and variables
   */
  validateAST(ast: ASTNode): ValidationResult {
    return validateAST(ast, {
      allowedVariables: this.allowedVariables.size > 0 ? this.allowedVariables : undefined,
      maxDepth: this.maxDepth,
    });
  }

  /**
   * Batch evaluate formulas
   */
  async evaluateFormulas(
    formulaIds: string[],
    tenantId: string,
    context: EvaluationContext,
    options: { trace?: boolean } = {}
  ): Promise<Map<string, EvaluationResult | Error>> {
    const results = new Map<string, EvaluationResult | Error>();

    for (const formulaId of formulaIds) {
      try {
        const result = await this.evaluateFormula(formulaId, tenantId, context, options);
        results.set(formulaId, result);
      } catch (error) {
        results.set(formulaId, error as Error);
      }
    }

    return results;
  }

  private repositoryToService(formula: any): FormulaWithAST {
    return {
      id: formula.id,
      tenantId: formula.tenantId,
      name: formula.name,
      description: formula.description,
      ast: formula.astJson,
      formulaType: formula.formulaType,
      createdBy: formula.createdBy,
      appliedTo: formula.appliedTo,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    };
  }
}
