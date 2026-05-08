/**
 * AST Validation Engine
 */

import {
  ASTNode,
  ASTNodeType,
  ConstNode,
  VarNode,
  BinaryOpNode,
  IfNode,
  TierNode,
} from '../types/ast';

export interface ValidationOptions {
  allowedVariables?: Set<string> | string[];
  maxDepth?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class ValidationError {
  constructor(
    public message: string,
    public path: string = 'root',
    public nodeType?: ASTNodeType
  ) {}
}

const VALID_NODE_TYPES: Set<ASTNodeType> = new Set([
  'const',
  'var',
  'add',
  'sub',
  'mul',
  'div',
  'gt',
  'lt',
  'eq',
  'gte',
  'lte',
  'and',
  'or',
  'if',
  'tier',
]);

const BINARY_OPS: Set<ASTNodeType> = new Set([
  'add',
  'sub',
  'mul',
  'div',
  'gt',
  'lt',
  'eq',
  'gte',
  'lte',
  'and',
  'or',
]);

class Validator {
  private errors: ValidationError[] = [];
  private allowedVars: Set<string>;
  private maxDepth: number;
  private currentDepth: number = 0;

  constructor(options: ValidationOptions = {}) {
    this.allowedVars = new Set(options.allowedVariables || []);
    this.maxDepth = options.maxDepth || 50;
  }

  validate(node: ASTNode): ValidationResult {
    this.errors = [];
    this.currentDepth = 0;
    this.validateNode(node, 'root');

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  private validateNode(node: unknown, path: string): void {
    // Check depth
    this.currentDepth++;
    if (this.currentDepth > this.maxDepth) {
      this.errors.push(
        new ValidationError(`Max nesting depth (${this.maxDepth}) exceeded`, path)
      );
      this.currentDepth--;
      return;
    }

    // Check node is object
    if (!node || typeof node !== 'object') {
      this.errors.push(
        new ValidationError('Node must be an object', path)
      );
      this.currentDepth--;
      return;
    }

    const nodeObj = node as any;

    // Check type exists
    if (!nodeObj.type) {
      this.errors.push(
        new ValidationError('Node must have a "type" field', path)
      );
      this.currentDepth--;
      return;
    }

    // Check type is valid
    if (!VALID_NODE_TYPES.has(nodeObj.type)) {
      this.errors.push(
        new ValidationError(
          `Invalid node type: ${nodeObj.type}. Valid types: ${Array.from(VALID_NODE_TYPES).join(', ')}`,
          path,
          nodeObj.type
        )
      );
      this.currentDepth--;
      return;
    }

    // Validate specific node types
    switch (nodeObj.type as ASTNodeType) {
      case 'const':
        this.validateConstNode(nodeObj, path);
        break;

      case 'var':
        this.validateVarNode(nodeObj, path);
        break;

      case 'add':
      case 'sub':
      case 'mul':
      case 'div':
      case 'gt':
      case 'lt':
      case 'eq':
      case 'gte':
      case 'lte':
      case 'and':
      case 'or':
        this.validateBinaryOpNode(nodeObj, path);
        break;

      case 'if':
        this.validateIfNode(nodeObj, path);
        break;

      case 'tier':
        this.validateTierNode(nodeObj, path);
        break;
    }

    this.currentDepth--;
  }

  private validateConstNode(node: any, path: string): void {
    if (!('value' in node)) {
      this.errors.push(
        new ValidationError('const node must have a "value" field', path, 'const')
      );
      return;
    }

    if (typeof node.value !== 'number') {
      this.errors.push(
        new ValidationError(
          `const node "value" must be a number, got ${typeof node.value}`,
          path,
          'const'
        )
      );
    }

    if (!Number.isFinite(node.value)) {
      this.errors.push(
        new ValidationError(
          `const node "value" must be finite, got ${node.value}`,
          path,
          'const'
        )
      );
    }
  }

  private validateVarNode(node: any, path: string): void {
    if (!('code' in node)) {
      this.errors.push(
        new ValidationError('var node must have a "code" field', path, 'var')
      );
      return;
    }

    if (typeof node.code !== 'string') {
      this.errors.push(
        new ValidationError(
          `var node "code" must be a string, got ${typeof node.code}`,
          path,
          'var'
        )
      );
      return;
    }

    if (node.code.trim().length === 0) {
      this.errors.push(
        new ValidationError('var node "code" cannot be empty', path, 'var')
      );
      return;
    }

    // Check against whitelist if provided
    if (this.allowedVars.size > 0 && !this.allowedVars.has(node.code)) {
      this.errors.push(
        new ValidationError(
          `Variable "${node.code}" not in allowed list: ${Array.from(this.allowedVars).join(', ')}`,
          path,
          'var'
        )
      );
    }
  }

  private validateBinaryOpNode(node: any, path: string): void {
    if (!('left' in node)) {
      this.errors.push(
        new ValidationError(
          `${node.type} node must have a "left" field`,
          path,
          node.type
        )
      );
      return;
    }

    if (!('right' in node)) {
      this.errors.push(
        new ValidationError(
          `${node.type} node must have a "right" field`,
          path,
          node.type
        )
      );
      return;
    }

    this.validateNode(node.left, `${path}.left`);
    this.validateNode(node.right, `${path}.right`);
  }

  private validateIfNode(node: any, path: string): void {
    const requiredFields = ['condition', 'then', 'else'];

    for (const field of requiredFields) {
      if (!(field in node)) {
        this.errors.push(
          new ValidationError(
            `if node must have a "${field}" field`,
            path,
            'if'
          )
        );
      }
    }

    if ('condition' in node) {
      this.validateNode(node.condition, `${path}.condition`);
    }

    if ('then' in node) {
      this.validateNode(node.then, `${path}.then`);
    }

    if ('else' in node) {
      this.validateNode(node.else, `${path}.else`);
    }
  }

  private validateTierNode(node: any, path: string): void {
    if (!('metric' in node)) {
      this.errors.push(
        new ValidationError('tier node must have a "metric" field', path, 'tier')
      );
      return;
    }

    if (typeof node.metric !== 'string') {
      this.errors.push(
        new ValidationError(
          `tier node "metric" must be a string, got ${typeof node.metric}`,
          path,
          'tier'
        )
      );
    }

    if (!('tiers' in node)) {
      this.errors.push(
        new ValidationError('tier node must have a "tiers" field', path, 'tier')
      );
      return;
    }

    if (!Array.isArray(node.tiers)) {
      this.errors.push(
        new ValidationError(
          `tier node "tiers" must be an array, got ${typeof node.tiers}`,
          path,
          'tier'
        )
      );
      return;
    }

    if (node.tiers.length === 0) {
      this.errors.push(
        new ValidationError('tier node "tiers" array cannot be empty', path, 'tier')
      );
      return;
    }

    for (let i = 0; i < node.tiers.length; i++) {
      const tier = node.tiers[i];
      const tierPath = `${path}.tiers[${i}]`;

      if (typeof tier !== 'object' || tier === null) {
        this.errors.push(
          new ValidationError(
            `tier object must be an object, got ${typeof tier}`,
            tierPath,
            'tier'
          )
        );
        continue;
      }

      if (!('min' in tier) || typeof tier.min !== 'number') {
        this.errors.push(
          new ValidationError(
            `tier must have a numeric "min" field`,
            tierPath,
            'tier'
          )
        );
      }

      if (!('max' in tier) || typeof tier.max !== 'number') {
        this.errors.push(
          new ValidationError(
            `tier must have a numeric "max" field`,
            tierPath,
            'tier'
          )
        );
      }

      if (!('value' in tier) || typeof tier.value !== 'number') {
        this.errors.push(
          new ValidationError(
            `tier must have a numeric "value" field`,
            tierPath,
            'tier'
          )
        );
      }

      if (tier.min > tier.max) {
        this.errors.push(
          new ValidationError(
            `tier "min" (${tier.min}) cannot be greater than "max" (${tier.max})`,
            tierPath,
            'tier'
          )
        );
      }
    }
  }
}

export function validateAST(
  node: ASTNode,
  options?: ValidationOptions
): ValidationResult {
  const validator = new Validator(options);
  return validator.validate(node);
}
