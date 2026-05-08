/**
 * Safe AST Evaluator
 * No eval(), no dynamic execution
 */

import {
  ASTNode,
  ASTNodeType,
  EvaluationContext,
  EvaluationResult,
  EvaluationTrace,
  ConstNode,
  VarNode,
  BinaryOpNode,
  IfNode,
  TierNode,
} from '../types/ast';

class EvaluationError extends Error {
  constructor(message: string, public nodeType?: ASTNodeType) {
    super(message);
    this.name = 'EvaluationError';
  }
}

interface EvaluateOptions {
  trace?: boolean;
  traceSteps?: EvaluationTrace[];
}

/**
 * Core evaluation function - recursive, safe evaluation
 */
function evaluateNode(
  node: ASTNode,
  context: EvaluationContext,
  options: EvaluateOptions = {}
): number {
  if (!node || typeof node !== 'object') {
    throw new EvaluationError('Invalid node: must be an object', undefined);
  }

  const { trace = false, traceSteps = [] } = options;

  try {
    switch (node.type) {
      case 'const': {
        const constNode = node as ConstNode;
        const result = constNode.value;
        if (trace) {
          traceSteps.push({
            nodeType: 'const',
            input: { value: result },
            result,
          });
        }
        return result;
      }

      case 'var': {
        const varNode = node as VarNode;
        const value = context[varNode.code];
        if (value === undefined) {
          throw new EvaluationError(
            `Variable '${varNode.code}' not found in context`,
            'var'
          );
        }
        if (typeof value !== 'number') {
          throw new EvaluationError(
            `Variable '${varNode.code}' must be a number, got ${typeof value}`,
            'var'
          );
        }
        if (trace) {
          traceSteps.push({
            nodeType: 'var',
            input: { value },
            result: value,
          });
        }
        return value;
      }

      case 'add': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left + right;
        if (trace) {
          traceSteps.push({
            nodeType: 'add',
            input: { left, right },
            result,
          });
        }
        return result;
      }

      case 'sub': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left - right;
        if (trace) {
          traceSteps.push({
            nodeType: 'sub',
            input: { left, right },
            result,
          });
        }
        return result;
      }

      case 'mul': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left * right;
        if (trace) {
          traceSteps.push({
            nodeType: 'mul',
            input: { left, right },
            result,
          });
        }
        return result;
      }

      case 'div': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        if (right === 0) {
          throw new EvaluationError('Division by zero', 'div');
        }
        const result = left / right;
        if (trace) {
          traceSteps.push({
            nodeType: 'div',
            input: { left, right },
            result,
          });
        }
        return result;
      }

      case 'gt': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left > right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'gt',
            input: { left, right, condition: left > right },
            result,
          });
        }
        return result;
      }

      case 'lt': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left < right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'lt',
            input: { left, right, condition: left < right },
            result,
          });
        }
        return result;
      }

      case 'eq': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left === right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'eq',
            input: { left, right, condition: left === right },
            result,
          });
        }
        return result;
      }

      case 'gte': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left >= right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'gte',
            input: { left, right, condition: left >= right },
            result,
          });
        }
        return result;
      }

      case 'lte': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left <= right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'lte',
            input: { left, right, condition: left <= right },
            result,
          });
        }
        return result;
      }

      case 'and': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left && right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'and',
            input: { left, right, condition: !!(left && right) },
            result,
          });
        }
        return result;
      }

      case 'or': {
        const binOp = node as BinaryOpNode;
        const left = evaluateNode(binOp.left, context, options);
        const right = evaluateNode(binOp.right, context, options);
        const result = left || right ? 1 : 0;
        if (trace) {
          traceSteps.push({
            nodeType: 'or',
            input: { left, right, condition: !!(left || right) },
            result,
          });
        }
        return result;
      }

      case 'if': {
        const ifNode = node as IfNode;
        const condition = evaluateNode(ifNode.condition, context, options);
        const result = condition ? evaluateNode(ifNode.then, context, options)
          : evaluateNode(ifNode.else, context, options);
        if (trace) {
          traceSteps.push({
            nodeType: 'if',
            input: { condition: !!condition },
            result,
          });
        }
        return result;
      }

      case 'tier': {
        const tierNode = node as TierNode;
        const metricValue = context[tierNode.metric];
        if (metricValue === undefined) {
          throw new EvaluationError(
            `Metric '${tierNode.metric}' not found in context`,
            'tier'
          );
        }
        if (typeof metricValue !== 'number') {
          throw new EvaluationError(
            `Metric '${tierNode.metric}' must be a number, got ${typeof metricValue}`,
            'tier'
          );
        }

        let result = 0;
        for (const tier of tierNode.tiers) {
          if (metricValue >= tier.min && metricValue <= tier.max) {
            result = tier.value;
            break;
          }
        }

        if (trace) {
          traceSteps.push({
            nodeType: 'tier',
            input: { value: metricValue },
            result,
          });
        }
        return result;
      }

      default: {
        const unknownType = (node as any).type;
        throw new EvaluationError(`Unknown node type: ${unknownType}`, unknownType);
      }
    }
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }
    throw new EvaluationError(`Evaluation failed: ${(error as Error).message}`);
  }
}

/**
 * Main evaluate function - public API
 */
export function evaluate(
  node: ASTNode,
  context: EvaluationContext,
  options?: { trace?: boolean }
): EvaluationResult {
  const traceSteps: EvaluationTrace[] = [];
  const value = evaluateNode(node, context, {
    trace: options?.trace || false,
    traceSteps,
  });

  return {
    value,
    ...(options?.trace && { trace: traceSteps }),
  };
}

/**
 * Simpler evaluate function that just returns the number
 */
export function evaluateSimple(
  node: ASTNode,
  context: EvaluationContext
): number {
  return evaluateNode(node, context);
}

export { EvaluationError };
