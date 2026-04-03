import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, id, style, ...props }, ref) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={selectId}
            style={{
              width: '100%',
              height: 36,
              padding: '0 32px 0 10px',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
              borderRadius: 'var(--radius)',
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              ...style,
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {error && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
