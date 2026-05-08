/**
 * Formula Builder - Usage Examples
 */

import React, { useState } from 'react';
import { FormulaBuilder, ASTNode } from './index';

// Example 1: Basic Usage
export const BasicExample = () => {
  const [formula, setFormula] = useState<ASTNode | null>(null);

  return (
    <div>
      <h2>Basic Formula Builder</h2>
      <FormulaBuilder
        variables={['base_salary', 'bonus']}
        onASTChange={setFormula}
      />
      {formula && <p>Formula: {JSON.stringify(formula)}</p>}
    </div>
  );
};

// Example 2: With Pre-filled Formula
export const PrefillExample = () => {
  const initialFormula: ASTNode = {
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
    else: { type: 'var', code: 'base_salary' },
  };

  const [formula, setFormula] = useState<ASTNode>(initialFormula);

  return (
    <div>
      <h2>Edit Existing Formula</h2>
      <FormulaBuilder
        variables={['base_salary', 'kpi_score']}
        initialAST={initialFormula}
        onASTChange={setFormula}
      />
    </div>
  );
};

// Example 3: Save and Evaluate
export const SaveAndEvaluateExample = () => {
  const [formula, setFormula] = useState<ASTNode | null>(null);
  const [result, setResult] = useState<number | null>(null);

  const handleSave = async () => {
    if (!formula) return;

    try {
      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123',
        },
        body: JSON.stringify({
          name: 'My Salary Formula',
          description: 'Auto-generated from builder',
          ast: formula,
        }),
      });

      const data = await response.json();
      alert(`Formula saved! ID: ${data.id}`);
    } catch (error) {
      alert('Error saving formula');
    }
  };

  const handleEvaluate = async () => {
    if (!formula) return;

    try {
      const response = await fetch('/api/formulas/evaluate-inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ast: formula,
          context: {
            base_salary: 1000,
            kpi_score: 85,
          },
        }),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      alert('Error evaluating formula');
    }
  };

  return (
    <div>
      <h2>Save & Evaluate</h2>
      <FormulaBuilder
        variables={['base_salary', 'kpi_score']}
        onASTChange={setFormula}
      />
      <button onClick={handleSave}>Save Formula</button>
      <button onClick={handleEvaluate}>Test Evaluate</button>
      {result !== null && <p>Result: {result}</p>}
    </div>
  );
};

// Example 4: Multiple Variables
export const MultiVariableExample = () => {
  const variables = [
    'base_salary',
    'kpi_score',
    'bonus',
    'performance_score',
    'tasks_completed',
    'attendance_rate',
    'quality_score',
    'customer_satisfaction',
  ];

  return (
    <div>
      <h2>Complex Multi-Variable Formula</h2>
      <FormulaBuilder
        variables={variables}
      />
    </div>
  );
};

// Example 5: Tiered Bonus Example
export const TieredBonusExample = () => {
  const tierFormula: ASTNode = {
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
          { min: 50, max: 75, value: 0.05 },
          { min: 75, max: 90, value: 0.1 },
          { min: 90, max: 100, value: 0.2 },
        ],
      },
    },
  };

  return (
    <div>
      <h2>Tiered Performance Bonus</h2>
      <FormulaBuilder
        variables={['base_salary', 'performance_score']}
        initialAST={tierFormula}
      />
      <p>
        This creates a formula where salary is multiplied by a performance tier:
        <br />
        0-50%: 0% bonus | 50-75%: 5% bonus | 75-90%: 10% bonus | 90-100%: 20%
        bonus
      </p>
    </div>
  );
};

// Example 6: Complex Conditional Logic
export const ComplexConditionalExample = () => {
  const complexFormula: ASTNode = {
    type: 'add',
    left: { type: 'var', code: 'base_salary' },
    right: {
      type: 'add',
      left: {
        type: 'if',
        condition: {
          type: 'and',
          left: {
            type: 'gte',
            left: { type: 'var', code: 'kpi_score' },
            right: { type: 'const', value: 80 },
          },
          right: {
            type: 'gte',
            left: { type: 'var', code: 'attendance_rate' },
            right: { type: 'const', value: 95 },
          },
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

  return (
    <div>
      <h2>Complex Conditional Salary Calculation</h2>
      <FormulaBuilder
        variables={[
          'base_salary',
          'kpi_score',
          'kpi_bonus',
          'attendance_rate',
          'tasks_completed',
        ]}
        initialAST={complexFormula}
      />
      <p>
        This calculates: base_salary + (if kpi >= 80 AND attendance >= 95 then
        kpi_bonus else 0) + (tasks * 25)
      </p>
    </div>
  );
};

// Example 7: Real-world KPI Formula
export const KPIFormulaExample = () => {
  const kpiFormula: ASTNode = {
    type: 'mul',
    left: { type: 'const', value: 100 },
    right: {
      type: 'div',
      left: {
        type: 'add',
        left: { type: 'var', code: 'quality_score' },
        right: {
          type: 'add',
          left: { type: 'var', code: 'delivery_score' },
          right: { type: 'var', code: 'customer_satisfaction' },
        },
      },
      right: { type: 'const', value: 3 },
    },
  };

  return (
    <div>
      <h2>KPI Score Calculation</h2>
      <FormulaBuilder
        variables={[
          'quality_score',
          'delivery_score',
          'customer_satisfaction',
        ]}
        initialAST={kpiFormula}
      />
      <p>This calculates: (quality + delivery + satisfaction) / 3 * 100</p>
    </div>
  );
};

// Example 8: Nested If Example
export const NestedIfExample = () => {
  const nestedFormula: ASTNode = {
    type: 'if',
    condition: { type: 'gt', left: { type: 'var', code: 'level' }, right: { type: 'const', value: 2 } },
    then: {
      type: 'if',
      condition: {
        type: 'gt',
        left: { type: 'var', code: 'performance' },
        right: { type: 'const', value: 8 },
      },
      then: { type: 'mul', left: { type: 'var', code: 'salary' }, right: { type: 'const', value: 1.5 } },
      else: { type: 'mul', left: { type: 'var', code: 'salary' }, right: { type: 'const', value: 1.2 } },
    },
    else: { type: 'var', code: 'salary' },
  };

  return (
    <div>
      <h2>Nested Conditional Logic</h2>
      <FormulaBuilder
        variables={['level', 'performance', 'salary']}
        initialAST={nestedFormula}
      />
      <p>
        If level {'>'} 2: if performance {'>'} 8 then salary * 1.5 else salary
        * 1.2
      </p>
    </div>
  );
};

// Export all examples as a showcase
export const FormulaBuilderExamples = {
  BasicExample,
  PrefillExample,
  SaveAndEvaluateExample,
  MultiVariableExample,
  TieredBonusExample,
  ComplexConditionalExample,
  KPIFormulaExample,
  NestedIfExample,
};
