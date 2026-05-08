/**
 * Formula Engine - Usage Examples
 */

import {
  ASTNode,
  EvaluationContext,
} from '../types/ast';
import { evaluate } from '../evaluator/evaluate';
import { validateAST } from '../validator/validate';

// Example 1: Simple arithmetic
const example1_simpleAddition: ASTNode = {
  type: 'add',
  left: { type: 'const', value: 10 },
  right: { type: 'const', value: 5 },
};

console.log('Example 1 - Simple Addition:');
console.log(evaluate(example1_simpleAddition, {}));
// Output: { value: 15 }

// Example 2: Using variables
const example2_variableMultiplication: ASTNode = {
  type: 'mul',
  left: { type: 'var', code: 'base_salary' },
  right: { type: 'const', value: 1.5 },
};

const context2: EvaluationContext = {
  base_salary: 1000,
};

console.log('\nExample 2 - Variable Multiplication:');
console.log(evaluate(example2_variableMultiplication, context2));
// Output: { value: 1500 }

// Example 3: Conditional (if-then-else)
// If KPI score > 80, salary * 1.2, else salary + 100
const example3_conditional: ASTNode = {
  type: 'if',
  condition: {
    type: 'gt',
    left: { type: 'var', code: 'kpi_score' },
    right: { type: 'const', value: 80 },
  },
  then: {
    type: 'mul',
    left: { type: 'var', code: 'base_salary' },
    right: { type: 'const', value: 1.2 },
  },
  else: {
    type: 'add',
    left: { type: 'var', code: 'base_salary' },
    right: { type: 'const', value: 100 },
  },
};

const context3: EvaluationContext = {
  kpi_score: 85,
  base_salary: 1000,
};

console.log('\nExample 3 - Conditional (KPI Bonus):');
console.log(evaluate(example3_conditional, context3));
// Output: { value: 1200 } (because 85 > 80)

// Example 4: Tier-based calculation
// Tiers: <50 -> 0%, 50-80 -> 5%, 80-100 -> 10%, >100 -> 15%
const example4_tier: ASTNode = {
  type: 'mul',
  left: { type: 'var', code: 'base_salary' },
  right: {
    type: 'add',
    left: { type: 'const', value: 1 },
    right: {
      type: 'tier',
      metric: 'performance_score',
      tiers: [
        { min: 0, max: 50, value: 0 },
        { min: 50, max: 80, value: 0.05 },
        { min: 80, max: 100, value: 0.1 },
        { min: 100, max: 200, value: 0.15 },
      ],
    },
  },
};

const context4: EvaluationContext = {
  base_salary: 1000,
  performance_score: 85,
};

console.log('\nExample 4 - Tier-based Bonus:');
console.log(evaluate(example4_tier, context4));
// Output: { value: 1100 } (1000 * (1 + 0.1))

// Example 5: Complex formula with trace
const example5_complex: ASTNode = {
  type: 'add',
  left: {
    type: 'mul',
    left: { type: 'var', code: 'base_salary' },
    right: { type: 'const', value: 1.1 },
  },
  right: {
    type: 'if',
    condition: {
      type: 'gte',
      left: { type: 'var', code: 'tasks_completed' },
      right: { type: 'const', value: 10 },
    },
    then: { type: 'const', value: 500 },
    else: { type: 'const', value: 0 },
  },
};

const context5: EvaluationContext = {
  base_salary: 1000,
  tasks_completed: 12,
};

console.log('\nExample 5 - Complex with Trace:');
console.log(evaluate(example5_complex, context5, { trace: true }));
// Output: { value: 1600, trace: [...] }

// Example 6: Validation
const example6_invalid: any = {
  type: 'add',
  left: { type: 'const', value: 10 },
  right: { type: 'unknown_type' },
};

console.log('\nExample 6 - Validation Error:');
const validation = validateAST(example6_invalid);
console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors.map(e => e.message));

// Example 7: Variable whitelist validation
const example7_ast: ASTNode = {
  type: 'add',
  left: { type: 'var', code: 'allowed_var' },
  right: { type: 'var', code: 'not_allowed_var' },
};

console.log('\nExample 7 - Whitelist Validation:');
const validationWithWhitelist = validateAST(example7_ast, {
  allowedVariables: ['allowed_var', 'another_var'],
});
console.log('Valid:', validationWithWhitelist.valid);
console.log('Errors:', validationWithWhitelist.errors.map(e => e.message));

// Example 8: Salary calculation with multiple components
// base_salary + (kpi_bonus if performance > 70) + task_bonus
const example8_salary: ASTNode = {
  type: 'add',
  left: { type: 'var', code: 'base_salary' },
  right: {
    type: 'add',
    left: {
      type: 'if',
      condition: {
        type: 'gt',
        left: { type: 'var', code: 'performance' },
        right: { type: 'const', value: 70 },
      },
      then: { type: 'var', code: 'kpi_bonus' },
      else: { type: 'const', value: 0 },
    },
    right: {
      type: 'mul',
      left: { type: 'var', code: 'tasks_completed' },
      right: { type: 'const', value: 25 },
    },
  },
};

const context8: EvaluationContext = {
  base_salary: 2000,
  performance: 75,
  kpi_bonus: 300,
  tasks_completed: 8,
};

console.log('\nExample 8 - Salary Calculation:');
console.log(evaluate(example8_salary, context8));
// Output: { value: 2500 } (2000 + 300 + (8 * 25))

export {};
