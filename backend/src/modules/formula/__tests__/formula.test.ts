/**
 * Formula Engine - Unit Tests
 * Use with Jest or similar test framework
 */

import {
  ASTNode,
  EvaluationContext,
} from '../types/ast';
import { evaluate, evaluateSimple } from '../evaluator/evaluate';
import { validateAST } from '../validator/validate';

describe('Formula Engine - Evaluator', () => {
  describe('Constants', () => {
    it('should evaluate const nodes', () => {
      const ast: ASTNode = { type: 'const', value: 42 };
      const result = evaluate(ast, {});
      expect(result.value).toBe(42);
    });
  });

  describe('Variables', () => {
    it('should evaluate var nodes from context', () => {
      const ast: ASTNode = { type: 'var', code: 'salary' };
      const result = evaluate(ast, { salary: 1000 });
      expect(result.value).toBe(1000);
    });

    it('should throw on missing variable', () => {
      const ast: ASTNode = { type: 'var', code: 'unknown' };
      expect(() => evaluate(ast, {})).toThrow('not found');
    });

    it('should throw on non-numeric variable', () => {
      const ast: ASTNode = { type: 'var', code: 'name' };
      expect(() => evaluate(ast, { name: 'John' as any })).toThrow('must be a number');
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add two numbers', () => {
      const ast: ASTNode = {
        type: 'add',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(15);
    });

    it('should subtract two numbers', () => {
      const ast: ASTNode = {
        type: 'sub',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 3 },
      };
      expect(evaluate(ast, {}).value).toBe(7);
    });

    it('should multiply two numbers', () => {
      const ast: ASTNode = {
        type: 'mul',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(50);
    });

    it('should divide two numbers', () => {
      const ast: ASTNode = {
        type: 'div',
        left: { type: 'const', value: 20 },
        right: { type: 'const', value: 4 },
      };
      expect(evaluate(ast, {}).value).toBe(5);
    });

    it('should throw on division by zero', () => {
      const ast: ASTNode = {
        type: 'div',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 0 },
      };
      expect(() => evaluate(ast, {})).toThrow('Division by zero');
    });
  });

  describe('Comparison Operations', () => {
    it('should evaluate gt correctly', () => {
      const ast: ASTNode = {
        type: 'gt',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(1); // true = 1
    });

    it('should evaluate lt correctly', () => {
      const ast: ASTNode = {
        type: 'lt',
        left: { type: 'const', value: 3 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });

    it('should evaluate eq correctly', () => {
      const ast: ASTNode = {
        type: 'eq',
        left: { type: 'const', value: 5 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });

    it('should evaluate gte correctly', () => {
      const ast: ASTNode = {
        type: 'gte',
        left: { type: 'const', value: 5 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });

    it('should evaluate lte correctly', () => {
      const ast: ASTNode = {
        type: 'lte',
        left: { type: 'const', value: 5 },
        right: { type: 'const', value: 5 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });
  });

  describe('Logical Operations', () => {
    it('should evaluate and correctly', () => {
      const ast: ASTNode = {
        type: 'and',
        left: { type: 'const', value: 1 },
        right: { type: 'const', value: 1 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });

    it('should evaluate or correctly', () => {
      const ast: ASTNode = {
        type: 'or',
        left: { type: 'const', value: 0 },
        right: { type: 'const', value: 1 },
      };
      expect(evaluate(ast, {}).value).toBe(1);
    });
  });

  describe('Conditional (If-Then-Else)', () => {
    it('should execute then branch when condition is true', () => {
      const ast: ASTNode = {
        type: 'if',
        condition: {
          type: 'gt',
          left: { type: 'const', value: 10 },
          right: { type: 'const', value: 5 },
        },
        then: { type: 'const', value: 100 },
        else: { type: 'const', value: 50 },
      };
      expect(evaluate(ast, {}).value).toBe(100);
    });

    it('should execute else branch when condition is false', () => {
      const ast: ASTNode = {
        type: 'if',
        condition: {
          type: 'lt',
          left: { type: 'const', value: 10 },
          right: { type: 'const', value: 5 },
        },
        then: { type: 'const', value: 100 },
        else: { type: 'const', value: 50 },
      };
      expect(evaluate(ast, {}).value).toBe(50);
    });

    it('should handle complex conditional logic', () => {
      const ast: ASTNode = {
        type: 'if',
        condition: {
          type: 'and',
          left: {
            type: 'gte',
            left: { type: 'var', code: 'score' },
            right: { type: 'const', value: 80 },
          },
          right: {
            type: 'gte',
            left: { type: 'var', code: 'attendance' },
            right: { type: 'const', value: 90 },
          },
        },
        then: { type: 'const', value: 1000 },
        else: { type: 'const', value: 500 },
      };
      
      expect(evaluate(ast, { score: 85, attendance: 95 }).value).toBe(1000);
      expect(evaluate(ast, { score: 75, attendance: 95 }).value).toBe(500);
    });
  });

  describe('Tier Node', () => {
    it('should select correct tier based on metric', () => {
      const ast: ASTNode = {
        type: 'tier',
        metric: 'performance',
        tiers: [
          { min: 0, max: 50, value: 100 },
          { min: 50, max: 80, value: 200 },
          { min: 80, max: 100, value: 300 },
        ],
      };

      expect(evaluate(ast, { performance: 25 }).value).toBe(100);
      expect(evaluate(ast, { performance: 65 }).value).toBe(200);
      expect(evaluate(ast, { performance: 90 }).value).toBe(300);
    });

    it('should throw on missing metric', () => {
      const ast: ASTNode = {
        type: 'tier',
        metric: 'missing',
        tiers: [{ min: 0, max: 100, value: 50 }],
      };

      expect(() => evaluate(ast, {})).toThrow('not found');
    });
  });

  describe('Tracing', () => {
    it('should include trace when requested', () => {
      const ast: ASTNode = {
        type: 'add',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 5 },
      };

      const result = evaluate(ast, {}, { trace: true });
      expect(result.trace).toBeDefined();
      expect(result.trace!.length).toBeGreaterThan(0);
    });

    it('should not include trace by default', () => {
      const ast: ASTNode = {
        type: 'add',
        left: { type: 'const', value: 10 },
        right: { type: 'const', value: 5 },
      };

      const result = evaluate(ast, {});
      expect(result.trace).toBeUndefined();
    });
  });

  describe('Complex Formulas', () => {
    it('should evaluate salary calculation formula', () => {
      const ast: ASTNode = {
        type: 'add',
        left: { type: 'var', code: 'base' },
        right: {
          type: 'mul',
          left: { type: 'var', code: 'base' },
          right: {
            type: 'if',
            condition: {
              type: 'gt',
              left: { type: 'var', code: 'kpi' },
              right: { type: 'const', value: 80 },
            },
            then: { type: 'const', value: 0.2 },
            else: { type: 'const', value: 0 },
          },
        },
      };

      const result = evaluate(ast, { base: 1000, kpi: 85 });
      expect(result.value).toBe(1200); // 1000 + (1000 * 0.2)
    });
  });
});

describe('Formula Engine - Validator', () => {
  describe('Basic Validation', () => {
    it('should validate correct const node', () => {
      const ast: ASTNode = { type: 'const', value: 42 };
      const result = validateAST(ast);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid node type', () => {
      const ast: any = { type: 'invalid_type', value: 42 };
      const result = validateAST(ast);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid node type'))).toBe(true);
    });

    it('should reject node without type', () => {
      const ast: any = { value: 42 };
      const result = validateAST(ast);
      expect(result.valid).toBe(false);
    });
  });

  describe('Const Node Validation', () => {
    it('should reject const without value', () => {
      const ast: any = { type: 'const' };
      const result = validateAST(ast);
      expect(result.valid).toBe(false);
    });

    it('should reject const with non-numeric value', () => {
      const ast: any = { type: 'const', value: 'not a number' };
      const result = validateAST(ast);
      expect(result.valid).toBe(false);
    });

    it('should reject const with infinite value', () => {
      const ast: any = { type: 'const', value: Infinity };
      const result = validateAST(ast);
      expect(result.valid).toBe(false);
    });
  });

  describe('Variable Whitelist', () => {
    it('should allow variables in whitelist', () => {
      const ast: ASTNode = { type: 'var', code: 'salary' };
      const result = validateAST(ast, { allowedVariables: ['salary', 'bonus'] });
      expect(result.valid).toBe(true);
    });

    it('should reject variables not in whitelist', () => {
      const ast: ASTNode = { type: 'var', code: 'secret' };
      const result = validateAST(ast, { allowedVariables: ['salary', 'bonus'] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('not in allowed list'))).toBe(true);
    });
  });

  describe('Depth Validation', () => {
    it('should reject deeply nested AST', () => {
      let ast: ASTNode = { type: 'const', value: 1 };
      for (let i = 0; i < 60; i++) {
        ast = {
          type: 'add',
          left: ast,
          right: { type: 'const', value: 1 },
        };
      }

      const result = validateAST(ast, { maxDepth: 50 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Max nesting depth'))).toBe(true);
    });
  });

  describe('Tier Node Validation', () => {
    it('should validate correct tier node', () => {
      const ast: ASTNode = {
        type: 'tier',
        metric: 'performance',
        tiers: [
          { min: 0, max: 50, value: 100 },
          { min: 50, max: 100, value: 200 },
        ],
      };

      const result = validateAST(ast);
      expect(result.valid).toBe(true);
    });

    it('should reject tier with invalid range', () => {
      const ast: any = {
        type: 'tier',
        metric: 'performance',
        tiers: [{ min: 100, max: 50, value: 100 }],
      };

      const result = validateAST(ast);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('min'))).toBe(true);
    });
  });
});
