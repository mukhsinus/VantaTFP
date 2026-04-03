import React from 'react';
import { createPortal } from 'react-dom';
import { useToastStore, ToastType } from '@app/store/toast.store';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

const borderColorMap: Record<ToastType, string> = {
  success: 'var(--color-success-border)',
  error:   'var(--color-danger-border)',
  info:    'var(--color-accent-subtle-border)',
};

export function ToastRenderer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 'var(--z-toast)' as React.CSSProperties['zIndex'],
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            minWidth: 300,
            maxWidth: 400,
            padding: '12px 14px',
            background: 'var(--color-bg)',
            border: `1px solid ${borderColorMap[item.type]}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'toastSlideIn 200ms ease',
          }}
        >
          <style>{`
            @keyframes toastSlideIn {
              from { opacity: 0; transform: translateX(20px) }
              to   { opacity: 1; transform: translateX(0) }
            }
          `}</style>

          <span style={{ flexShrink: 0, marginTop: 1 }}>
            {iconMap[item.type]}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {item.title}
            </p>
            {item.description && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {item.description}
              </p>
            )}
          </div>

          <button
            onClick={() => removeToast(item.id)}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              lineHeight: 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
