# Formula Builder - React Component

A powerful, type-safe React component for building and validating Abstract Syntax Tree (AST) formulas. Generates JSON compatible with the backend formula engine.

## Features

✅ **No Drag-and-Drop** — Structured form-based input  
✅ **Nested IF Blocks** — Full conditional logic support  
✅ **Tier Support** — Tiered bonus calculations  
✅ **Real-time Validation** — Inline AST validation  
✅ **Mobile-First** — Responsive, mobile-friendly UI  
✅ **Copy to Clipboard** — Easy JSON export  
✅ **Variable Dropdown** — Select from available variables  
✅ **Visual Operators** — Intuitive operator selection  

## Installation

The component is located in `frontend/src/features/formula/`.

```typescript
import { FormulaBuilder } from './features/formula';
```

## Quick Start

```typescript
import React, { useState } from 'react';
import { FormulaBuilder, ASTNode } from './features/formula';

export const MyComponent = () => {
  const [formula, setFormula] = useState<ASTNode | null>(null);

  const handleASTChange = (ast: ASTNode) => {
    setFormula(ast);
    console.log('Formula:', ast);
  };

  return (
    <FormulaBuilder
      variables={['base_salary', 'kpi_score', 'bonus']}
      onASTChange={handleASTChange}
    />
  );
};
```

## Component Props

```typescript
interface FormulaBuilderProps {
  variables?: string[];           // Available variables
  initialAST?: ASTNode;           // Pre-fill with existing formula
  onASTChange?: (ast: ASTNode) => void;  // Callback on changes
}
```

## Supported Node Types

| Type | Example | Use Case |
|------|---------|----------|
| `const` | `42` | Fixed numeric values |
| `var` | `base_salary` | Variables from context |
| `add` | `a + b` | Addition |
| `sub` | `a - b` | Subtraction |
| `mul` | `a * b` | Multiplication |
| `div` | `a / b` | Division |
| `gt` | `a > b` | Greater than |
| `lt` | `a < b` | Less than |
| `eq` | `a == b` | Equality |
| `gte` | `a >= b` | Greater or equal |
| `lte` | `a <= b` | Less or equal |
| `and` | `a && b` | Logical AND |
| `or` | `a \|\| b` | Logical OR |
| `if` | `if (cond) then ... else ...` | Conditional |
| `tier` | Tiered values | Performance bands |

## Output Format

The component outputs valid AST JSON:

```json
{
  "type": "if",
  "condition": {
    "type": "gt",
    "left": {
      "type": "var",
      "code": "kpi_score"
    },
    "right": {
      "type": "const",
      "value": 80
    }
  },
  "then": {
    "type": "mul",
    "left": {
      "type": "var",
      "code": "base_salary"
    },
    "right": {
      "type": "const",
      "value": 1.2
    }
  },
  "else": {
    "type": "var",
    "code": "base_salary"
  }
}
```

## Examples

### Example 1: Simple Bonus

If KPI score > 80, multiply salary by 1.2

```
1. Select: If-Then-Else
2. Condition: kpi_score > 80
3. Then: base_salary * 1.2
4. Else: base_salary
```

### Example 2: Tiered Performance Bonus

Different bonus percentages based on performance:

```
1. Select: Multiply
2. Left: base_salary
3. Right: 1 + tier(performance)
   - Tiers:
     - 0-50 → 0%
     - 50-80 → 5%
     - 80-100 → 15%
```

### Example 3: Complex Calculation

Base + KPI bonus (if earned) + per-task bonus:

```
1. Select: Add
2. Left: base_salary
3. Right: Add
   - Left: If (performance > 70) then kpi_bonus else 0
   - Right: tasks_completed * 25
```

## Component Structure

```
formula/
├── types.ts                  # Type definitions
├── FormulaBuilder.tsx        # Main component
├── NodeEditor.tsx            # Node editor (recursive)
├── ASTOutput.tsx             # JSON output + validation
├── FormulaDemoPage.tsx       # Demo/example page
├── FormulaBuilder.module.css # Main styles
├── NodeEditor.module.css     # Editor styles
├── ASTOutput.module.css      # Output styles
├── FormulaDemoPage.module.css # Demo styles
├── index.ts                  # Module exports
└── README.md                 # This file
```

## Integration with Backend

### 1. Save Formula

```typescript
const handleSave = async (formula: ASTNode) => {
  const response = await fetch('/api/formulas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({
      name: 'My Formula',
      description: 'Generated from UI',
      ast: formula,
    }),
  });

  const result = await response.json();
  console.log('Formula ID:', result.id);
};
```

### 2. Evaluate Formula

```typescript
const handleEvaluate = async (formulaId: string, context: Record<string, number>) => {
  const response = await fetch(`/api/formulas/${formulaId}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({
      context,
      trace: true, // Step-by-step logs
    }),
  });

  const result = await response.json();
  console.log('Result:', result.value);
  console.log('Trace:', result.trace);
};
```

### 3. Inline Evaluation

```typescript
const handleQuickEval = async (formula: ASTNode, context: Record<string, number>) => {
  const response = await fetch('/api/formulas/evaluate-inline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ast: formula,
      context,
    }),
  });

  const result = await response.json();
  return result.value;
};
```

## Validation

The component includes built-in validation:

- ✅ Node type is valid
- ✅ Required fields exist
- ✅ Values have correct types
- ✅ Numeric values are finite
- ✅ Tier ranges are valid
- ✅ Max nesting depth enforced
- ✅ Variable references exist

Click "Validate" in the AST Output panel to check for errors.

## Styling & Customization

All components use CSS Modules for scoped styling. To customize:

1. Modify `*.module.css` files
2. Colors: Update gradient vars in `FormulaDemoPage.module.css`
3. Fonts: Change font-family in component CSS
4. Spacing: Adjust padding/margin values

## Mobile Support

- ✅ Responsive grid layout (1 col on mobile, 2 cols on desktop)
- ✅ Touch-friendly buttons and inputs
- ✅ Optimized scrolling
- ✅ Readable on small screens

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Rendering**: O(n) where n = number of nodes
- **Validation**: O(n) single-pass traversal
- **Memory**: AST stored in state (shallow updates)
- **Large Formulas**: Supports up to depth 15 (configurable)

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels on form inputs
- ✅ Keyboard navigation
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators

## Demo Page

Run the demo to see the component in action:

```typescript
import FormulaDemoPage from './features/formula/FormulaDemoPage';

// In your router:
<Route path="/formula-builder" element={<FormulaDemoPage />} />
```

## API Reference

### FormulaBuilder Props

```typescript
interface FormulaBuilderProps {
  variables?: string[];
  initialAST?: ASTNode;
  onASTChange?: (ast: ASTNode) => void;
}
```

### ASTNode Type

```typescript
interface ASTNode {
  type: ASTNodeType;
  value?: number;           // For 'const'
  code?: string;            // For 'var'
  left?: ASTNode;           // For binary ops
  right?: ASTNode;          // For binary ops
  condition?: ASTNode;      // For 'if'
  then?: ASTNode;           // For 'if'
  else?: ASTNode;           // For 'if'
  metric?: string;          // For 'tier'
  tiers?: Array<{           // For 'tier'
    min: number;
    max: number;
    value: number;
  }>;
}
```

## Troubleshooting

### Formula Not Updating?
- Check `onASTChange` callback is provided
- Verify state management

### Variables Not Showing?
- Pass `variables` prop to FormulaBuilder
- Check variable names are strings

### Validation Errors?
- Click "Validate" button in output panel
- Check error messages for specifics

### JSON Not Copying?
- Use modern browser with Clipboard API
- Check browser permissions

## Future Enhancements

- [ ] Undo/redo stack
- [ ] Formula templates library
- [ ] Import/export to CSV
- [ ] Formula versioning
- [ ] Collaborative editing
- [ ] Formula search/filtering
- [ ] Performance profiler
- [ ] DSL compiler (text → AST)

## License

Part of VantaTFP project. See main LICENSE file.

---

**Ready to use!** Integrate into any React app and start building formulas.
