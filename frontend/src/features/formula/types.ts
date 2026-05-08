/**
 * Formula Builder - Type definitions
 */

export type ASTNodeType = 
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

export interface ASTNode {
  type: ASTNodeType;
  value?: number;
  code?: string;
  left?: ASTNode;
  right?: ASTNode;
  condition?: ASTNode;
  then?: ASTNode;
  else?: ASTNode;
  metric?: string;
  tiers?: Array<{ min: number; max: number; value: number }>;
}

export const OPERATOR_TYPES = {
  ARITHMETIC: ['add', 'sub', 'mul', 'div'] as const,
  COMPARISON: ['gt', 'lt', 'eq', 'gte', 'lte'] as const,
  LOGICAL: ['and', 'or'] as const,
};

export const ALL_OPERATORS = [
  ...OPERATOR_TYPES.ARITHMETIC,
  ...OPERATOR_TYPES.COMPARISON,
  ...OPERATOR_TYPES.LOGICAL,
];

export type FormulaType = 'kpi' | 'salary';

export interface FormulaBuilderProps {
  variables?: string[];
  initialAST?: ASTNode;
  onASTChange?: (ast: ASTNode) => void;
  formulaType?: FormulaType;
}

export interface BuilderState {
  ast: ASTNode;
  selectedNodePath: string;
}
