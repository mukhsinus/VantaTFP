import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, id, style, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text-primary)',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--color-text-muted)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={{
              width: '100%',
              height: 36,
              padding: leftIcon ? '0 10px 0 34px' : rightIcon ? '0 34px 0 10px' : '0 10px',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
              borderRadius: 'var(--radius)',
              outline: 'none',
              transition: 'border-color var(--transition), box-shadow var(--transition)',
              boxShadow: error ? '0 0 0 3px var(--color-danger-subtle)' : undefined,
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--color-danger)'
                : 'var(--color-accent)';
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 3px var(--color-danger-subtle)'
                : '0 0 0 3px var(--color-accent-subtle)';
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--color-danger)'
                : 'var(--color-border-strong)';
              e.currentTarget.style.boxShadow = 'none';
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: 10,
                color: 'var(--color-text-muted)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 2 }}>
            {error}
          </p>
        )}
        {!error && hint && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
