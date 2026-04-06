import React from 'react';
import { useTranslation } from 'react-i18next';

interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyState,
}: TableProps<T>) {
  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              background: 'var(--color-bg-subtle)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textAlign: col.align ?? 'left',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <TableSkeleton rows={5} cols={columns.length} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '48px 16px', textAlign: 'center' }}
              >
                {emptyState ?? <DefaultEmptyState />}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  cursor: onRowClick ? 'pointer' : undefined,
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      textAlign: col.align ?? 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DefaultEmptyState() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h.01M15 9h.01M9 15h6" />
        </svg>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {t('common.emptyState.title')}
      </p>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {t('common.emptyState.description')}
      </p>
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div style={{ padding: '0 16px' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
            padding: '14px 0',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? '60%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    >
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}
