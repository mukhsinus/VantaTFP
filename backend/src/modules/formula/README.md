# Formula Engine

A type-safe, validation-first configurable formula engine for KPI and salary calculations. No `eval()`, no dynamic execution — pure TypeScript evaluation with AST.

## Features

✅ **Type-Safe AST** — Full TypeScript support with discriminated union types  
✅ **Safe Evaluation** — No eval(), no code execution, recursive traversal only  
✅ **Validation** — Comprehensive AST validation with whitelist support  
✅ **Tracing** — Step-by-step evaluation logs for debugging  
✅ **Tier Support** — Tiered calculations (performance bands, salary scales)  
✅ **PostgreSQL** — JSONB storage with tenant isolation  
✅ **Express API** — REST endpoints for storage and evaluation  

## Quick Start

### 1. Evaluator

```typescript
import { evaluate } from './modules/formula/evaluator/evaluate';
import { ASTNode } from './modules/formula/types/ast';

// Define AST
const formula: ASTNode = {
  type: 'if',
  condition: {
    type: 'gt',
    left: { type: 'var', code: 'kpi_score' },
    right: { type: 'const', value: 80 }
  },
  then: {
    type: 'mul',
    left: { type: 'var', code: 'base_salary' },
    right: { type: 'const', value: 1.2 }
  },
  else: {
    type: 'var', code: 'base_salary'
  }
};

// Evaluate
const result = evaluate(formula, {
  kpi_score: 85,
  base_salary: 1000
});

console.log(result.value); // 1200
```

### 2. Validation

```typescript
import { validateAST } from './modules/formula/validator/validate';

const validation = validateAST(formula, {
  allowedVariables: ['kpi_score', 'base_salary'],
  maxDepth: 50
});

if (!validation.valid) {
  console.error(validation.errors);
}
```

### 3. Service Layer

```typescript
import { FormulaService } from './modules/formula/service/FormulaService';
import { FormulaRepository } from './modules/formula/repository/FormulaRepository';
import { Pool } from 'pg';

const pool = new Pool(/* config */);
const repo = new FormulaRepository(pool);
const service = new FormulaService(repo, {
  allowedVariables: ['base_salary', 'kpi_score', 'bonus'],
  maxDepth: 50
});

// Create
const formula = await service.createFormula({
  name: 'KPI Bonus',
  description: 'Calculate bonus based on KPI',
  ast: { /* AST */ }
}, tenantId);

// Evaluate
const result = await service.evaluateFormula(
  formulaId,
  tenantId,
  { base_salary: 1000, kpi_score: 85 },
  { trace: true }
);
```

### 4. Express API

```typescript
import express from 'express';
import { createFormulaRouter, formulaErrorHandler } from './modules/formula/routes/formula';

const app = express();
const pool = new Pool(/* config */);

const formulaRouter = createFormulaRouter({
  pool,
  allowedVariables: ['base_salary', 'kpi_score', 'bonus'],
  requireAuth: (req) => req.headers['x-tenant-id'] as string
});

app.use(formulaRouter);
app.use(formulaErrorHandler);
```

## API Endpoints

### POST /formula
Create and save a formula.

```bash
curl -X POST http://localhost:3000/formula \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "name": "KPI Bonus",
    "description": "Calculate bonus based on KPI score",
    "ast": {
      "type": "if",
      "condition": { "type": "gt", "left": { "type": "var", "code": "kpi" }, "right": { "type": "const", "value": 80 } },
      "then": { "type": "const", "value": 500 },
      "else": { "type": "const", "value": 0 }
    }
  }'
```

### GET /formula/:id
Retrieve a formula.

```bash
curl http://localhost:3000/formula/formula-id \
  -H "x-tenant-id: tenant-123"
```

### POST /formula/evaluate
Evaluate a stored formula.

```bash
curl -X POST http://localhost:3000/formula/evaluate \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "formulaId": "formula-id",
    "context": { "kpi": 85 },
    "trace": true
  }'
```

### POST /formula/evaluate-inline
Evaluate AST directly (no database lookup).

```bash
curl -X POST http://localhost:3000/formula/evaluate-inline \
  -H "Content-Type: application/json" \
  -d '{
    "ast": { "type": "const", "value": 42 },
    "context": {},
    "trace": false
  }'
```

### GET /formula
List formulas for tenant.

```bash
curl "http://localhost:3000/formula?limit=50&offset=0" \
  -H "x-tenant-id: tenant-123"
```

### DELETE /formula/:id
Delete a formula.

```bash
curl -X DELETE http://localhost:3000/formula/formula-id \
  -H "x-tenant-id: tenant-123"
```

## Node Types

| Type | Fields | Example |
|------|--------|---------|
| `const` | `value: number` | `{ type: 'const', value: 42 }` |
| `var` | `code: string` | `{ type: 'var', code: 'salary' }` |
| `add` | `left, right: ASTNode` | `{ type: 'add', left: {...}, right: {...} }` |
| `sub` | `left, right: ASTNode` | Subtraction |
| `mul` | `left, right: ASTNode` | Multiplication |
| `div` | `left, right: ASTNode` | Division |
| `gt` | `left, right: ASTNode` | Greater than (returns 1 or 0) |
| `lt` | `left, right: ASTNode` | Less than |
| `eq` | `left, right: ASTNode` | Equality |
| `gte` | `left, right: ASTNode` | Greater or equal |
| `lte` | `left, right: ASTNode` | Less or equal |
| `and` | `left, right: ASTNode` | Logical AND |
| `or` | `left, right: ASTNode` | Logical OR |
| `if` | `condition, then, else: ASTNode` | Conditional |
| `tier` | `metric: string, tiers: Array<{min, max, value}>` | Tiered calculation |

## Examples

### Example 1: Salary Bonus (if-then-else)

```typescript
const formula: ASTNode = {
  type: 'if',
  condition: { type: 'gt', left: { type: 'var', code: 'kpi' }, right: { type: 'const', value: 80 } },
  then: { type: 'mul', left: { type: 'var', code: 'salary' }, right: { type: 'const', value: 1.2 } },
  else: { type: 'var', code: 'salary' }
};

evaluate(formula, { kpi: 85, salary: 1000 }); // { value: 1200 }
```

### Example 2: Tiered Performance Bonus

```typescript
const formula: ASTNode = {
  type: 'mul',
  left: { type: 'var', code: 'salary' },
  right: {
    type: 'add',
    left: { type: 'const', value: 1 },
    right: {
      type: 'tier',
      metric: 'performance_score',
      tiers: [
        { min: 0, max: 50, value: 0 },
        { min: 50, max: 80, value: 0.05 },
        { min: 80, max: 100, value: 0.15 }
      ]
    }
  }
};

evaluate(formula, { salary: 1000, performance_score: 85 }); // { value: 1150 }
```

### Example 3: Complex Salary Calculation

```typescript
const formula: ASTNode = {
  type: 'add',
  left: { type: 'var', code: 'base_salary' },
  right: {
    type: 'add',
    left: {
      type: 'if',
      condition: { type: 'gt', left: { type: 'var', code: 'performance' }, right: { type: 'const', value: 70 } },
      then: { type: 'var', code: 'kpi_bonus' },
      else: { type: 'const', value: 0 }
    },
    right: {
      type: 'mul',
      left: { type: 'var', code: 'tasks_completed' },
      right: { type: 'const', value: 25 }
    }
  }
};

evaluate(formula, { base_salary: 2000, performance: 75, kpi_bonus: 300, tasks_completed: 8 });
// { value: 2500 }
```

## Database Schema

```sql
CREATE TABLE formulas (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ast_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_formulas_tenant_id ON formulas(tenant_id);
CREATE INDEX idx_formulas_created_at ON formulas(created_at DESC);
```

## Validation

Validation checks:

- ✅ Node type is valid
- ✅ Required fields exist
- ✅ Values have correct types
- ✅ Numeric values are finite
- ✅ Tier ranges are valid (min ≤ max)
- ✅ Variables are in whitelist (if provided)
- ✅ Max nesting depth

## Error Handling

```typescript
try {
  const result = evaluate(ast, context);
} catch (error) {
  // Handles:
  // - Missing variables
  // - Non-numeric context values
  // - Division by zero
  // - Invalid node types
  // - Type mismatches
}
```

## Performance

- **Evaluation**: O(n) where n = number of nodes
- **Validation**: O(n) with single pass
- **Caching**: Store compiled AST in JSONB for fast retrieval
- **Indexing**: Tenant + created_at for pagination

## Files

```
src/modules/formula/
├── types/
│   └── ast.ts                      # AST type definitions
├── evaluator/
│   └── evaluate.ts                 # Recursive evaluation engine
├── validator/
│   └── validate.ts                 # AST validation
├── repository/
│   └── FormulaRepository.ts        # Data access layer
├── service/
│   └── FormulaService.ts           # Business logic
├── routes/
│   └── formula.ts                  # Express API endpoints
├── __tests__/
│   └── formula.test.ts             # Unit tests
├── examples.ts                     # Usage examples
└── index.ts                        # Module exports
```

## Testing

```bash
npm test -- src/modules/formula/__tests__/formula.test.ts
```

## Integration

```typescript
import { FormulaService, FormulaRepository, createFormulaRouter } from './modules/formula';

// Use in your Fastify/Express app
const formulaRouter = createFormulaRouter({ pool, allowedVariables: [...] });
app.use('/api', formulaRouter);
```

## Security Notes

✅ No `eval()`  
✅ No dynamic code execution  
✅ Tenant isolation via middleware  
✅ Variable whitelist support  
✅ Input validation  
✅ Type-safe AST  

---

Ready for production. All operations are safe and deterministic.
