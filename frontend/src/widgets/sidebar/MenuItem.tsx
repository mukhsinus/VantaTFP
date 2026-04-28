import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

export function MenuItem({
  to,
  icon,
  label,
  description,
  endIcon,
  onClick,
  destructive = false,
  showChevron = false,
  showStar = false,
  starred = false,
  onToggleStar,
}: {
  to?: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  showStar?: boolean;
  starred?: boolean;
  onToggleStar?: () => void;
}) {
  const content = (
    <>
      {icon ? <span className={styles.itemIcon}>{icon}</span> : <span className={styles.itemIconPlaceholder} />}
      <span className={styles.itemBody}>
        <span className={`${styles.itemLabel} ${destructive ? styles.itemLabelDestructive : ''}`}>{label}</span>
        {description ? <span className={styles.itemDescription}>{description}</span> : null}
      </span>

      {showStar ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleStar?.();
          }}
          className={styles.itemStar}
          aria-label="Pin"
          aria-pressed={starred}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={starred ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path d="M12 17.3l-6.18 3.25 1.18-6.88L2 8.9l6.91-1L12 1.8l3.09 6.1 6.91 1-5 4.77 1.18 6.88z" />
          </svg>
        </button>
      ) : null}

      {endIcon ? <span className={styles.itemEndIcon}>{endIcon}</span> : null}
      {showChevron ? (
        <span className={styles.itemChevron} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${styles.item} ${isActive ? styles.itemActive : ''} ${destructive ? styles.itemDestructive : ''}`
        }
        onClick={onClick}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.item} ${destructive ? styles.itemDestructive : ''}`}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

