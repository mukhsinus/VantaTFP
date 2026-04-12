import React from 'react';
import { Skeleton } from '@shared/components/ui';
import styles from './EmployeesListSkeleton.module.css';

const CARD_COUNT = 6;

export function EmployeesListSkeleton() {
  return (
    <div className={styles.root}>
      <Skeleton height={28} width={180} borderRadius="var(--radius-md)" />
      <Skeleton height={14} width={120} borderRadius="var(--radius-sm)" />
      <div className={styles.filters}>
        <Skeleton height={40} borderRadius="var(--radius-lg)" />
        <div className={styles.chips}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={32} width={72} borderRadius="var(--radius-full)" />
          ))}
        </div>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardTop}>
              <Skeleton height={44} width={44} borderRadius="var(--radius-full)" />
              <div className={styles.cardText}>
                <Skeleton height={18} width="70%" borderRadius="var(--radius-sm)" />
                <Skeleton height={14} width="90%" borderRadius="var(--radius-sm)" />
              </div>
              <Skeleton height={28} width={64} borderRadius="var(--radius-full)" />
              <Skeleton height={44} width={44} borderRadius="var(--radius-md)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
