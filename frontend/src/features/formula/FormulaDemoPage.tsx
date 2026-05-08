/**
 * Formula Builder Demo Page
 * Shows example usage and integration
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormulaBuilder, ASTNode } from '../formula';
import styles from './FormulaDemoPage.module.css';

export const FormulaDemoPage: React.FC = () => {
  const { t } = useTranslation();
  const [formula, setFormula] = useState<ASTNode | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleASTChange = (ast: ASTNode) => {
    setFormula(ast);
    console.log('Formula updated:', ast);
  };

  const handleSave = async () => {
    if (!formula) {
      setSaveMessage(t('formula.errors.buildFirst'));
      return;
    }

    setIsLoading(true);
    try {
      // Example API call to backend
      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123', // Get from auth
        },
        body: JSON.stringify({
          name: t('formula.defaults.myFormula'),
          description: t('formula.defaults.generatedFromBuilder'),
          ast: formula,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save formula');
      }

      const result = await response.json();
      setSaveMessage(`✓ ${t('formula.messages.saved')} ${result.id}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage(`✗ ${t('formula.errors.saveFailed')}`);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultVariables = [
    'base_salary',
    'kpi_score',
    'bonus',
    'performance_score',
    'tasks_completed',
    'attendance_rate',
    'quality_score',
  ];

  return (
    <div className={styles.demoPage}>
      <header className={styles.pageHeader}>
        <h1>{t('formula.title')}</h1>
        <p>{t('formula.subtitle')}</p>
      </header>

      <div className={styles.content}>
        <FormulaBuilder
          variables={defaultVariables}
          onASTChange={handleASTChange}
        />

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>{t('formula.sections.help')}</h3>
            <ul className={styles.helpList}>
              <li>
                <strong>{t('formula.elements.constant')}:</strong> {t('formula.descriptions.constant')}
              </li>
              <li>
                <strong>{t('formula.elements.variable')}:</strong> {t('formula.descriptions.variable')}
              </li>
              <li>
                <strong>{t('formula.elements.operators')}:</strong> {t('formula.descriptions.operators')}
              </li>
              <li>
                <strong>{t('formula.elements.comparisons')}:</strong> {t('formula.descriptions.comparisons')}
              </li>
              <li>
                <strong>{t('formula.elements.conditional')}:</strong> {t('formula.descriptions.conditional')}
              </li>
              <li>
                <strong>{t('formula.elements.tier')}:</strong> {t('formula.descriptions.tier')}
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3>{t('formula.sections.examples')}</h3>
            <details className={styles.example}>
              <summary>{t('formula.examples.salaryBonus')}</summary>
              <code>
                {`IF (kpi_score > 80)
  THEN base_salary * 1.2
  ELSE base_salary`}
              </code>
            </details>

            <details className={styles.example}>
              <summary>{t('formula.examples.tierPerformance')}</summary>
              <code>
                {`base_salary * (1 + tier(performance))
where:
  0-50 → 0%
  50-80 → 5%
  80-100 → 15%`}
              </code>
            </details>

            <details className={styles.example}>
              <summary>{t('formula.examples.complex')}</summary>
              <code>
                {`base + (kpi_bonus if perf > 70) + (tasks * 25)`}
              </code>
            </details>
          </div>

          <div className={styles.card}>
            <h3>{t('formula.sections.actions')}</h3>
            <button
              onClick={handleSave}
              className={styles.saveBtn}
              disabled={!formula || isLoading}
            >
              {isLoading ? `${t('common.loading')}...` : `💾 ${t('formula.actions.save')}`}
            </button>

            {saveMessage && (
              <div className={`${styles.message} ${saveMessage.includes('✓') ? styles.success : styles.error}`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaDemoPage;
