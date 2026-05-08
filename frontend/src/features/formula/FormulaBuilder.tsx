/**
 * Main Formula Builder Component
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ASTNode, FormulaBuilderProps } from './types';
import { NodeEditor } from './NodeEditor';
import styles from './FormulaBuilder.module.css';

export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  variables = [],
  initialAST,
  onASTChange,
  formulaType: initialFormulaType = 'kpi',
}) => {
  const { t } = useTranslation();
  const [ast, setAST] = useState<ASTNode>(
    initialAST || { type: 'const', value: 0 }
  );
  const [formulaType, setFormulaType] = useState<'kpi' | 'salary'>(initialFormulaType);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    onASTChange?.(ast);
  }, [ast, onASTChange]);

  const handleReset = () => {
    const newAST: ASTNode = { type: 'const', value: 0 };
    setAST(newAST);
  };

  const defaultVariables = variables && variables.length > 0 
    ? variables 
    : formulaType === 'salary'
      ? ['base_salary', 'kpi_score', 'completed_tasks', 'bonus_percent', 'attendance_rate']
      : ['completed_tasks', 'on_time_tasks', 'overdue_tasks', 'quality_score', 'performance'];

  return (
    <div className={styles.formulaBuilder}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>{t('formula.title')}</h2>
        </div>
        
        <div className={styles.typeSwitcher}>
          <button 
            className={`${styles.typeBtn} ${formulaType === 'kpi' ? styles.active : ''}`}
            onClick={() => setFormulaType('kpi')}
            title={t('formula.types.kpi.tooltip')}
          >
            📊 {t('formula.types.kpi.label')}
          </button>
          <button 
            className={`${styles.typeBtn} ${formulaType === 'salary' ? styles.active : ''}`}
            onClick={() => setFormulaType('salary')}
            title={t('formula.types.salary.tooltip')}
          >
            💰 {t('formula.types.salary.label')}
          </button>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={() => setShowHelp(!showHelp)} 
            className={styles.helpBtn}
            title={t('formula.buttons.showHelp')}
          >
            {showHelp ? `✕ ${t('formula.buttons.hideHelp')}` : `? ${t('formula.buttons.help')}`}
          </button>
          <button onClick={handleReset} className={styles.resetBtn}>
            ↻ {t('formula.buttons.reset')}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className={styles.helpPanel}>
          <div className={styles.helpContent}>
            <h3>What is Formula Builder?</h3>
            {formulaType === 'kpi' ? (
              <p>
                <strong>KPI Formulas</strong> calculate performance scores based on task completion, quality, and on-time delivery.
                Your formula will evaluate employee performance and generate a score (0-100%).
              </p>
            ) : (
              <p>
                <strong>Salary Formulas</strong> calculate bonuses and total compensation based on KPI scores and other metrics.
                Your formula will compute employee payroll from base salary and performance bonuses.
              </p>
            )}
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Variables available: {defaultVariables.join(', ')}
            </p>

            <h4>How to use:</h4>
            <ol>
              {formulaType === 'kpi' ? (
                <>
                  <li><strong>Start with Variables</strong> - Select from tasks_completed, on_time_tasks, quality_score, etc.</li>
                  <li><strong>Apply Math</strong> - Combine metrics using +, -, *, / operators</li>
                  <li><strong>Set Conditions</strong> - Use comparisons (`&gt;`, `&lt;`, `==`, `≥`, `≤`) and logic (AND, OR) to evaluate performance</li>
                  <li><strong>Use Tiers</strong> - Define score ranges: 0-40 = low, 40-70 = medium, 70-100 = high</li>
                </>
              ) : (
                <>
                  <li><strong>Start with Base</strong> - Usually "base_salary" or a constant value</li>
                  <li><strong>Add Bonuses</strong> - Multiply by kpi_score or use Tier to calculate percentage bonuses</li>
                  <li><strong>Apply Conditions</strong> - Use IF statements for attendance-based deductions or special bonuses</li>
                  <li><strong>Calculate Total</strong> - Build formula: base_salary + (base_salary * kpi_score / 100)</li>
                </>
              )}
            </ol>

            <h4>Node Types:</h4>
            <ul>
              <li><strong>Constant</strong> - A fixed number (e.g., 100, 500)</li>
              <li><strong>Variable</strong> - A dynamic value from your data</li>
              <li><strong>Operators</strong> - +, -, *, / for math operations</li>
              <li><strong>Comparisons</strong> - &gt;, &lt;, ==, ≥, ≤ to check conditions</li>
              <li><strong>Logic</strong> - AND, OR to combine conditions</li>
              <li><strong>If-Then-Else</strong> - Conditional branches</li>
              <li><strong>Tier</strong> - Tiered calculations based on metric ranges</li>
            </ul>

            <h4>Available Variables:</h4>
            <div className={styles.helpVarList}>
              {defaultVariables.map((v) => (
                <span key={v} className={styles.helpVarTag}>{v}</span>
              ))}
            </div>

            <h4>Example: Bonus Formula</h4>
            <code className={styles.exampleCode}>
              IF kpi_score ≥ 80 THEN (base_salary * 0.15) ELSE (base_salary * 0.05)
            </code>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.editor}>
          <div className={styles.editorHeader}>
            <h3>Build Your Formula</h3>
            <span className={styles.hint}>Click dropdown to change node type</span>
          </div>
          <div className={styles.variables}>
            <strong>Available Variables:</strong>
            <div className={styles.varList}>
              {defaultVariables.map((v) => (
                <span key={v} className={styles.varTag}>
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.editorContent}>
            <NodeEditor
              node={ast}
              variables={defaultVariables}
              onChange={setAST}
              depth={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
