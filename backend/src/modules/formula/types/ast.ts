/**
 * AST Node Types for Formula Engine
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
}

// Leaf nodes
export interface ConstNode extends ASTNode {
  type: 'const';
  value: number;
}

export interface VarNode extends ASTNode {
  type: 'var';
  code: string;
}

// Binary operators
export interface BinaryOpNode extends ASTNode {
  type: 'add' | 'sub' | 'mul' | 'div' | 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'and' | 'or';
  left: ASTNode;
  right: ASTNode;
}

// Conditional
export interface IfNode extends ASTNode {
  type: 'if';
  condition: ASTNode;
  then: ASTNode;
  else: ASTNode;
}

// Tier node (for tiered calculations)
export interface TierNode extends ASTNode {
  type: 'tier';
  metric: string;
  tiers: Array<{
    min: number;
    max: number;
    value: number;
  }>;
}

export type ASTNodeUnion = 
  | ConstNode 
  | VarNode 
  | BinaryOpNode 
  | IfNode 
  | TierNode;

export interface EvaluationContext {
  [key: string]: number;
}

export interface EvaluationTrace {
  nodeType: ASTNodeType;
  input?: {
    left?: number;
    right?: number;
    value?: number;
    condition?: boolean;
  };
  result: number | boolean;
}

export interface EvaluationResult {
  value: number;
  trace?: EvaluationTrace[];
}
