# Formula Builder - Implementation Guide

## Overview

A complete React component system for building, editing, and managing AST formulas. Outputs valid JSON compatible with the backend formula engine.

## Files Structure

```
frontend/src/features/formula/
├── types.ts                      # Type definitions (ASTNode, etc.)
├── NodeEditor.tsx                # Recursive node editor component
├── ASTOutput.tsx                 # JSON output + validation
├── FormulaBuilder.tsx            # Main builder component
├── FormulaDemoPage.tsx           # Demo/example page
├── examples.tsx                  # 8 usage examples
├── FormulaBuilder.module.css     # Main styles
├── NodeEditor.module.css         # Node editor styles
├── ASTOutput.module.css          # Output styles
├── FormulaDemoPage.module.css    # Demo page styles
├── index.ts                      # Module exports
├── README.md                     # User documentation
└── IMPLEMENTATION.md             # This file
```

## Component Hierarchy

```
FormulaBuilder
├── header (title, actions)
├── container
│   ├── editor
│   │   ├── variables list
│   │   └── NodeEditor (recursive)
│   └── output
│       ├── JSON display
│       └── validation panel
└── sidebar (demo, help)
```

## Key Components

### 1. NodeEditor (Recursive)

**Purpose**: Edit individual AST nodes with full type support

**Features**:
- Type dropdown selector
- Context-sensitive fields based on node type
- Recursive composition for nested nodes
- Depth limiting (max 15)
- Operator symbols (×, ÷, ≥, etc.)

**Node Types**:
- **Leaf**: `const`, `var`
- **Binary Ops**: `add`, `sub`, `mul`, `div`, `gt`, `lt`, `eq`, `gte`, `lte`, `and`, `or`
- **Control**: `if`, `tier`

**Props**:
```typescript
interface NodeEditorProps {
  node: ASTNode;
  variables: string[];
  onChange: (node: ASTNode) => void;
  onDelete?: () => void;
  depth: number;
}
```

### 2. ASTOutput

**Purpose**: Display and validate AST JSON

**Features**:
- Syntax-highlighted JSON display
- Real-time validation
- Error reporting with paths
- Copy to clipboard button

**Validation Checks**:
- ✅ Node type validity
- ✅ Required fields presence
- ✅ Type correctness
- ✅ Numeric finiteness
- ✅ Tier range validity
- ✅ Max depth enforcement

### 3. FormulaBuilder (Main)

**Purpose**: Main component orchestrating the UI

**Features**:
- Reset button
- Copy JSON button
- Variable reference display
- State management

**Props**:
```typescript
interface FormulaBuilderProps {
  variables?: string[];
  initialAST?: ASTNode;
  onASTChange?: (ast: ASTNode) => void;
}
```

### 4. FormulaDemoPage

**Purpose**: Full-page demo with examples and integration guide

**Includes**:
- Formula builder instance
- Quick help sidebar
- Code examples
- API integration guide
- Save/evaluate workflow

## Type System

### ASTNode

```typescript
interface ASTNode {
  type: ASTNodeType;
  
  // For const
  value?: number;
  
  // For var
  code?: string;
  
  // For binary ops
  left?: ASTNode;
  right?: ASTNode;
  
  // For if
  condition?: ASTNode;
  then?: ASTNode;
  else?: ASTNode;
  
  // For tier
  metric?: string;
  tiers?: Array<{
    min: number;
    max: number;
    value: number;
  }>;
}
```

### ASTNodeType

```typescript
type ASTNodeType = 
  | 'const'
  | 'var'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'gt'
  | 'lt'
  | 'eq'
  | 'gte'
  | 'lte'
  | 'and'
  | 'or'
  | 'if'
  | 'tier';
```

## Usage Patterns

### Pattern 1: Basic Usage

```typescript
import { FormulaBuilder } from './features/formula';

export const MyComponent = () => {
  return (
    <FormulaBuilder
      variables={['base_salary', 'bonus']}
      onASTChange={(ast) => console.log(ast)}
    />
  );
};
```

### Pattern 2: Edit Existing

```typescript
const [formula, setFormula] = useState<ASTNode | null>(null);

<FormulaBuilder
  variables={variables}
  initialAST={formula}
  onASTChange={setFormula}
/>
```

### Pattern 3: Save to Backend

```typescript
const handleSave = async (ast: ASTNode) => {
  const res = await fetch('/api/formulas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({
      name: 'My Formula',
      ast: ast,
    }),
  });
  
  const { id } = await res.json();
  console.log('Saved:', id);
};
```

### Pattern 4: Quick Evaluation

```typescript
const handleEval = async (ast: ASTNode) => {
  const res = await fetch('/api/formulas/evaluate-inline', {
    method: 'POST',
    body: JSON.stringify({
      ast: ast,
      context: {
        base_salary: 1000,
        kpi_score: 85,
      },
    }),
  });
  
  const { result } = await res.json();
  return result;
};
```

## State Management

### Local State

```typescript
const [ast, setAST] = useState<ASTNode>(initialAST || { type: 'const', value: 0 });
```

### Updates via Callbacks

Each NodeEditor calls `onChange` when modified:

```typescript
const handleNodeChange = (newNode: ASTNode) => {
  onChange(newNode);
};
```

### Parent Updates Child

Props flow down:
```
FormulaBuilder (state)
  ↓
NodeEditor (recursive)
  ↓
onChange callbacks ↑
```

## Styling

### CSS Modules

Each component has scoped styles:
- `FormulaBuilder.module.css` — Grid layout, header, container
- `NodeEditor.module.css` — Node fields, operators, nesting
- `ASTOutput.module.css` — JSON display, validation UI
- `FormulaDemoPage.module.css` — Full page styling

### Colors & Theme

```css
Primary: #667eea (purple)
Secondary: #764ba2 (dark purple)
Success: #4caf50 (green)
Error: #c62828 (red)
Background: #f8f9fa (light gray)
```

### Responsive Breakpoints

```css
Desktop: grid 2 columns
Tablet (1024px): grid 1 column
Mobile (768px): flex column
Small (480px): full width
```

## Performance Considerations

### Rendering
- **O(n) complexity** where n = number of nodes
- React only re-renders changed subtrees
- Memoization not needed for typical sizes

### Depth Limiting
- Max depth: 15 (configurable)
- Prevents stack exhaustion
- Shows warning when reached

### Large Formulas
- Scrollable containers for long nesting
- Efficient JSON stringification
- Copy to clipboard uses native API

## Accessibility

### Keyboard Navigation
- Tab through inputs
- Enter to submit
- Escape to dismiss (optional)

### Screen Readers
- Semantic HTML
- Form labels with `<label>`
- ARIA attributes on complex regions

### Visual
- Color contrast WCAG AA
- Large tap targets (36px+ on mobile)
- Clear focus indicators

## Validation Details

### Node Type Validation

```typescript
const validTypes = [
  'const', 'var', 'add', 'sub', 'mul', 'div',
  'gt', 'lt', 'eq', 'gte', 'lte', 'and', 'or',
  'if', 'tier'
];

if (!validTypes.includes(node.type)) {
  errors.push({ path, message: 'Invalid type' });
}
```

### Field Validation

Each type checks required fields:

```typescript
case 'const':
  if (typeof node.value !== 'number') {
    errors.push('value must be number');
  }
  break;

case 'if':
  if (!node.condition) errors.push('missing condition');
  if (!node.then) errors.push('missing then');
  if (!node.else) errors.push('missing else');
  break;
```

### Tier Validation

```typescript
node.tiers.forEach(tier => {
  if (tier.min > tier.max) {
    errors.push('min > max');
  }
});
```

## Integration Checklist

- [ ] Copy formula folder to `frontend/src/features/`
- [ ] Install CSS module support (already in Vite)
- [ ] Import `FormulaBuilder` in your component
- [ ] Pass `variables` prop with available variable names
- [ ] Handle `onASTChange` callback
- [ ] Test with initial AST
- [ ] Integrate save button if needed
- [ ] Connect to backend API endpoints
- [ ] Test validation errors
- [ ] Test mobile responsiveness

## Extending the Component

### Add New Node Type

1. **Update types**:
```typescript
type ASTNodeType = ... | 'myType';

interface MyTypeNode extends ASTNode {
  type: 'myType';
  myField: string;
}
```

2. **Handle in NodeEditor**:
```typescript
case 'myType':
  return (
    <div>
      <input 
        value={node.myField}
        onChange={(e) => onChange({...node, myField: e.target.value})}
      />
    </div>
  );
```

3. **Validate in ASTOutput**:
```typescript
case 'myType':
  if (!node.myField) {
    errors.push({ path, message: 'Missing myField' });
  }
  break;
```

### Custom Variables

```typescript
const customVars = ['var1', 'var2', 'var3'];

<FormulaBuilder
  variables={customVars}
  onASTChange={handleChange}
/>
```

## Testing

### Component Tests (Jest)

```typescript
describe('FormulaBuilder', () => {
  it('should render', () => {
    render(<FormulaBuilder variables={['a', 'b']} />);
    expect(screen.getByText('Formula Builder')).toBeInTheDocument();
  });

  it('should update on node change', () => {
    const onChange = jest.fn();
    render(<FormulaBuilder onASTChange={onChange} />);
    // ... simulate changes ...
    expect(onChange).toHaveBeenCalled();
  });
});
```

### E2E Tests (Cypress/Playwright)

```typescript
it('should create if formula', () => {
  cy.visit('/formula-builder');
  cy.get('[select value="if"]').click();
  cy.get('input[placeholder="Condition"]').type('1');
  // ... continue building ...
  cy.get('[button="Validate"]').click();
  cy.contains('✓ Valid');
});
```

## Troubleshooting

### Variables Not Showing
- Check `variables` prop is passed
- Verify variable names are strings
- Check for duplicate names

### Formula Not Saving
- Validate AST first (click Validate button)
- Check API endpoint is correct
- Verify tenant ID header
- Check network tab for errors

### Depth Warning Showing
- Reduce nesting depth
- Consider breaking into multiple formulas
- Adjust maxDepth in code if needed

### Mobile Issues
- Check CSS media queries are applied
- Verify touch targets are large enough
- Test in mobile browser dev tools

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | Latest | ✅ Full |
| Edge | Latest | ✅ Full |
| iOS Safari | 14+ | ✅ Full |
| Android Chrome | Latest | ✅ Full |

## Known Limitations

- Max depth: 15 nodes (configurable)
- No undo/redo (yet)
- No formula templates (yet)
- No DSL parser (type JSON directly)

## Future Enhancements

- [ ] Undo/redo history
- [ ] Formula templates library
- [ ] DSL parser (plain text → AST)
- [ ] Import/export to CSV
- [ ] Collaborative editing
- [ ] Advanced debugging UI
- [ ] Performance profiler
- [ ] Formula marketplace

## License

Part of VantaTFP project. See LICENSE file.

---

**Ready to integrate!** Copy the formula folder and start building formulas.
