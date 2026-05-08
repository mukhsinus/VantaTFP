/**
 * Formulas Management Page
 * Allows employers to create and manage KPI and Salary formulas
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Button, EmptyState, Skeleton, PageSkeleton } from '@shared/components/ui';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useFormulas, useDeleteFormula, useCreateFormula } from './hooks/useFormulas';
import { FormulaBuilder, type FormulaType } from './index';
import type { Formula } from './hooks/useFormulas';
import styles from './FormulasPage.module.css';

export function FormulasPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { role } = useCurrentUser();
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [selectedType, setSelectedType] = useState<FormulaType>('kpi');
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);

  const { data: formulas, isLoading, isError } = useFormulas();
  const deleteFormula = useDeleteFormula();
  const createFormula = useCreateFormula();

  // Only show if user is employer/owner
  if (role !== 'OWNER') {
    return (
      <EmptyState
        title={t('formulas.access.restrictedTitle')}
        description={t('formulas.access.restrictedDescription')}
      />
    );
  }

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    return (
      <EmptyState
        title={t('errors.loadFailed.title')}
        description={t('errors.loadFailed.description')}
      />
    );
  }

  const filteredFormulas = formulas?.filter(f => f.formulaType === selectedType) || [];

  const handleDeleteFormula = async (id: string) => {
    if (confirm(t('formulas.deleteConfirm'))) {
      deleteFormula.mutate(id);
    }
  };

  return (
    <div className={styles.container}>
      {viewMode === 'list' ? (
        <>
          <div className={styles.header}>
            <h1>{t('formulas.title')}</h1>
            <Button onClick={() => setViewMode('create')} variant="primary">
              {t('formulas.createNew')}
            </Button>
          </div>

          {/* Type tabs */}
          <div className={styles.typeTabs}>
            {(['kpi', 'salary'] as const).map((type) => (
              <button
                key={type}
                className={`${styles.tab} ${selectedType === type ? styles.active : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type === 'kpi' ? '📊 KPI' : '💰 Salary'}
                <Badge variant="secondary">{filteredFormulas.length}</Badge>
              </button>
            ))}
          </div>

          {/* Formulas list */}
          {filteredFormulas.length > 0 ? (
            <div className={styles.list}>
              {filteredFormulas.map((formula) => (
                <Card key={formula.id} className={styles.formulaCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3>{formula.name}</h3>
                      {formula.description && <p>{formula.description}</p>}
                    </div>
                    <Badge variant="default">
                      {new Date(formula.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => {
                        setEditingFormula(formula);
                        setViewMode('create');
                      }}
                    >
                      {t('formulas.edit')}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => handleDeleteFormula(formula.id)}
                      disabled={deleteFormula.isPending}
                    >
                      {t('formulas.delete')}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('formulas.empty.title')}
              description={t('formulas.empty.description')}
            />
          )}
        </>
      ) : (
        <>
          <div className={styles.backButton}>
            <button onClick={() => {
              setViewMode('list');
              setEditingFormula(null);
            }}>
              ← {t('formulas.backToList')}
            </button>
          </div>

          <FormulaBuilder
            formulaType={selectedType}
            onASTChange={(ast) => {
              // Formula will be saved when user clicks Save
            }}
          />

          <div className={styles.formActions}>
            <input
              type="text"
              placeholder={t('formulas.namePlaceholder')}
              className={styles.input}
            />
            <textarea
              placeholder={t('formulas.descriptionPlaceholder')}
              className={styles.textarea}
            />
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              {editingFormula ? t('formulas.update') : t('formulas.save')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
