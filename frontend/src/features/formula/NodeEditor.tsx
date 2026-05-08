/**
 * Node Editor Component - Edit individual AST nodes
 */

import React from 'react';
import { ASTNode, ASTNodeType, ALL_OPERATORS } from './types';
import styles from './NodeEditor.module.css';

interface NodeEditorProps {
  node: ASTNode;
  variables: string[];
  onChange: (node: ASTNode) => void;
  onDelete?: () => void;
  depth: number;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  variables,
  onChange,
  onDelete,
  depth,
}) => {
  const handleTypeChange = (newType: ASTNodeType) => {
    let newNode: ASTNode = { type: newType };

    switch (newType) {
      case 'const':
        newNode.value = 0;
        break;
      case 'var':
        newNode.code = variables[0] || '';
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
        newNode.left = { type: 'const', value: 0 };
        newNode.right = { type: 'const', value: 0 };
        break;
      case 'if':
        newNode.condition = { type: 'const', value: 1 };
        newNode.then = { type: 'const', value: 0 };
        newNode.else = { type: 'const', value: 0 };
        break;
      case 'tier':
        newNode.metric = variables[0] || '';
        newNode.tiers = [
          { min: 0, max: 50, value: 100 },
          { min: 50, max: 100, value: 200 },
        ];
        break;
    }

    onChange(newNode);
  };

  const handleConstChange = (value: string) => {
    const num = parseFloat(value) || 0;
    onChange({ ...node, value: num });
  };

  const handleVarChange = (code: string) => {
    onChange({ ...node, code });
  };

  const handleLeftChange = (left: ASTNode) => {
    onChange({ ...node, left });
  };

  const handleRightChange = (right: ASTNode) => {
    onChange({ ...node, right });
  };

  const handleConditionChange = (condition: ASTNode) => {
    onChange({ ...node, condition });
  };

  const handleThenChange = (thenNode: ASTNode) => {
    onChange({ ...node, then: thenNode });
  };

  const handleElseChange = (elseNode: ASTNode) => {
    onChange({ ...node, else: elseNode });
  };

  const handleMetricChange = (metric: string) => {
    onChange({ ...node, metric });
  };

  const handleTiersChange = (tiers: Array<{ min: number; max: number; value: number }>) => {
    onChange({ ...node, tiers });
  };

  const maxDepth = 15;
  const isMaxDepth = depth >= maxDepth;

  return (
    <div className={styles.nodeEditor}>
      <div className={styles.header}>
        <select
          value={node.type}
          onChange={(e) => handleTypeChange(e.target.value as ASTNodeType)}
          className={styles.typeSelect}
          disabled={isMaxDepth}
        >
          <optgroup label="Leaf">
            <option value="const">Constant</option>
            <option value="var">Variable</option>
          </optgroup>

          <optgroup label="Arithmetic">
            <option value="add">Add (+)</option>
            <option value="sub">Subtract (-)</option>
            <option value="mul">Multiply (*)</option>
            <option value="div">Divide (/)</option>
          </optgroup>

          <optgroup label="Comparison">
            <option value="gt">Greater Than (&gt;)</option>
            <option value="lt">Less Than (&lt;)</option>
            <option value="eq">Equal (==)</option>
            <option value="gte">Greater or Equal (&gt;=)</option>
            <option value="lte">Less or Equal (&lt;=)</option>
          </optgroup>

          <optgroup label="Logical">
            <option value="and">AND (&&)</option>
            <option value="or">OR (||)</option>
          </optgroup>

          <optgroup label="Control Flow">
            <option value="if">If-Then-Else</option>
            <option value="tier">Tier</option>
          </optgroup>
        </select>

        {onDelete && (
          <button
            onClick={onDelete}
            className={styles.deleteBtn}
            title="Delete this node"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.content}>
        {node.type === 'const' && (
          <div className={styles.field}>
            <label>Value:</label>
            <input
              type="number"
              value={node.value ?? 0}
              onChange={(e) => handleConstChange(e.target.value)}
              className={styles.input}
              step="0.01"
            />
          </div>
        )}

        {node.type === 'var' && (
          <div className={styles.field}>
            <label>Variable:</label>
            <select
              value={node.code ?? ''}
              onChange={(e) => handleVarChange(e.target.value)}
              className={styles.select}
            >
              <option value="">-- Select Variable --</option>
              {variables.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}

        {ALL_OPERATORS.includes(node.type as any) && (
          <>
            <div className={styles.operand}>
              <label>Left:</label>
              {node.left && (
                <NodeEditor
                  node={node.left}
                  variables={variables}
                  onChange={handleLeftChange}
                  depth={depth + 1}
                />
              )}
            </div>

            <div className={styles.operator}>
              <span>{getOperatorSymbol(node.type as ASTNodeType)}</span>
            </div>

            <div className={styles.operand}>
              <label>Right:</label>
              {node.right && (
                <NodeEditor
                  node={node.right}
                  variables={variables}
                  onChange={handleRightChange}
                  depth={depth + 1}
                />
              )}
            </div>
          </>
        )}

        {node.type === 'if' && (
          <>
            <div className={styles.ifBranch}>
              <label>Condition:</label>
              {node.condition && (
                <NodeEditor
                  node={node.condition}
                  variables={variables}
                  onChange={handleConditionChange}
                  depth={depth + 1}
                />
              )}
            </div>

            <div className={styles.ifBranch}>
              <label>Then:</label>
              {node.then && (
                <NodeEditor
                  node={node.then}
                  variables={variables}
                  onChange={handleThenChange}
                  depth={depth + 1}
                />
              )}
            </div>

            <div className={styles.ifBranch}>
              <label>Else:</label>
              {node.else && (
                <NodeEditor
                  node={node.else}
                  variables={variables}
                  onChange={handleElseChange}
                  depth={depth + 1}
                />
              )}
            </div>
          </>
        )}

        {node.type === 'tier' && (
          <div className={styles.tierEditor}>
            <div className={styles.field}>
              <label>Metric:</label>
              <select
                value={node.metric ?? ''}
                onChange={(e) => handleMetricChange(e.target.value)}
                className={styles.select}
              >
                <option value="">-- Select Metric --</option>
                {variables.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.tierList}>
              <label>Tiers:</label>
              {node.tiers?.map((tier, idx) => (
                <div key={idx} className={styles.tierItem}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={tier.min}
                    onChange={(e) => {
                      const newTiers = [...(node.tiers || [])];
                      newTiers[idx].min = parseFloat(e.target.value) || 0;
                      handleTiersChange(newTiers);
                    }}
                    className={styles.tierInput}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={tier.max}
                    onChange={(e) => {
                      const newTiers = [...(node.tiers || [])];
                      newTiers[idx].max = parseFloat(e.target.value) || 0;
                      handleTiersChange(newTiers);
                    }}
                    className={styles.tierInput}
                  />
                  <span>=</span>
                  <input
                    type="number"
                    placeholder="Value"
                    value={tier.value}
                    onChange={(e) => {
                      const newTiers = [...(node.tiers || [])];
                      newTiers[idx].value = parseFloat(e.target.value) || 0;
                      handleTiersChange(newTiers);
                    }}
                    className={styles.tierInput}
                  />
                  <button
                    onClick={() => {
                      const newTiers = node.tiers?.filter((_, i) => i !== idx) || [];
                      handleTiersChange(newTiers);
                    }}
                    className={styles.tierDeleteBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  const newTiers = [
                    ...(node.tiers || []),
                    { min: 0, max: 100, value: 0 },
                  ];
                  handleTiersChange(newTiers);
                }}
                className={styles.addTierBtn}
              >
                + Add Tier
              </button>
            </div>
          </div>
        )}
      </div>

      {isMaxDepth && (
        <div className={styles.depthWarning}>
          Max nesting depth ({maxDepth}) reached
        </div>
      )}
    </div>
  );
};

function getOperatorSymbol(type: ASTNodeType): string {
  const symbols: Record<string, string> = {
    add: '+',
    sub: '-',
    mul: '×',
    div: '÷',
    gt: '>',
    lt: '<',
    eq: '==',
    gte: '≥',
    lte: '≤',
    and: '&&',
    or: '||',
  };
  return symbols[type] || '?';
}
