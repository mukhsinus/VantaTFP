/**
 * AST Output Component - Display and validate AST JSON
 */

import React, { useState } from 'react';
import { ASTNode } from './types';
import styles from './ASTOutput.module.css';

interface ASTOutputProps {
  ast: ASTNode;
}

interface ValidationError {
  path: string;
  message: string;
}

export const ASTOutput: React.FC<ASTOutputProps> = ({ ast }) => {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const jsonString = JSON.stringify(ast, null, 2);

  const validateAST = () => {
    const errors: ValidationError[] = [];

    const validate = (node: any, path: string = 'root') => {
      if (!node || typeof node !== 'object') {
        errors.push({ path, message: 'Node must be an object' });
        return;
      }

      if (!node.type) {
        errors.push({ path, message: 'Missing "type" field' });
        return;
      }

      const validTypes = [
        'const', 'var', 'add', 'sub', 'mul', 'div',
        'gt', 'lt', 'eq', 'gte', 'lte', 'and', 'or',
        'if', 'tier'
      ];

      if (!validTypes.includes(node.type)) {
        errors.push({
          path,
          message: `Invalid node type: ${node.type}`,
        });
        return;
      }

      switch (node.type) {
        case 'const':
          if (typeof node.value !== 'number') {
            errors.push({
              path: `${path}.value`,
              message: 'const value must be a number',
            });
          }
          break;

        case 'var':
          if (typeof node.code !== 'string' || !node.code) {
            errors.push({
              path: `${path}.code`,
              message: 'var code must be a non-empty string',
            });
          }
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
          if (!node.left) {
            errors.push({
              path: `${path}.left`,
              message: `${node.type} requires left operand`,
            });
          } else {
            validate(node.left, `${path}.left`);
          }

          if (!node.right) {
            errors.push({
              path: `${path}.right`,
              message: `${node.type} requires right operand`,
            });
          } else {
            validate(node.right, `${path}.right`);
          }
          break;

        case 'if':
          if (!node.condition) {
            errors.push({
              path: `${path}.condition`,
              message: 'if requires condition',
            });
          } else {
            validate(node.condition, `${path}.condition`);
          }

          if (!node.then) {
            errors.push({
              path: `${path}.then`,
              message: 'if requires then branch',
            });
          } else {
            validate(node.then, `${path}.then`);
          }

          if (!node.else) {
            errors.push({
              path: `${path}.else`,
              message: 'if requires else branch',
            });
          } else {
            validate(node.else, `${path}.else`);
          }
          break;

        case 'tier':
          if (typeof node.metric !== 'string' || !node.metric) {
            errors.push({
              path: `${path}.metric`,
              message: 'tier requires metric name',
            });
          }

          if (!Array.isArray(node.tiers) || node.tiers.length === 0) {
            errors.push({
              path: `${path}.tiers`,
              message: 'tier requires at least one tier definition',
            });
          } else {
            node.tiers.forEach((tier: any, idx: number) => {
              const tierPath = `${path}.tiers[${idx}]`;
              if (typeof tier.min !== 'number') {
                errors.push({
                  path: `${tierPath}.min`,
                  message: 'min must be a number',
                });
              }
              if (typeof tier.max !== 'number') {
                errors.push({
                  path: `${tierPath}.max`,
                  message: 'max must be a number',
                });
              }
              if (typeof tier.value !== 'number') {
                errors.push({
                  path: `${tierPath}.value`,
                  message: 'value must be a number',
                });
              }
              if (tier.min > tier.max) {
                errors.push({
                  path: tierPath,
                  message: 'min cannot be greater than max',
                });
              }
            });
          }
          break;
      }
    };

    validate(ast);
    setValidationErrors(errors);
    setShowValidation(true);
  };

  const isValid = validationErrors.length === 0;

  return (
    <div className={styles.astOutput}>
      <div className={styles.jsonContainer}>
        <pre className={styles.json}>{jsonString}</pre>
      </div>

      <div className={styles.footer}>
        <button
          onClick={validateAST}
          className={`${styles.validateBtn} ${isValid && showValidation ? styles.valid : ''}`}
        >
          {showValidation && isValid ? '✓ Valid' : 'Validate'}
        </button>
      </div>

      {showValidation && (
        <div className={styles.validation}>
          {isValid ? (
            <div className={styles.successMessage}>
              ✓ AST is valid and ready to use
            </div>
          ) : (
            <div className={styles.errorList}>
              <strong>Validation Errors ({validationErrors.length}):</strong>
              {validationErrors.map((error, idx) => (
                <div key={idx} className={styles.error}>
                  <span className={styles.path}>{error.path}</span>
                  <span className={styles.message}>{error.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
