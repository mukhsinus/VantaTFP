import React from 'react';
import styles from './Sidebar.module.css';

export function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      <div className={styles.sectionCard}>{children}</div>
    </section>
  );
}

