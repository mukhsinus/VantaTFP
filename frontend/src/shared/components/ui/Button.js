import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const styles = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 500,
        borderRadius: 'var(--radius)',
        border: '1px solid transparent',
        cursor: 'pointer',
        transition: 'background var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        lineHeight: 1,
    },
};
const variantStyles = {
    primary: {
        background: 'var(--color-accent)',
        color: 'var(--color-text-on-accent)',
        borderColor: 'var(--color-accent)',
    },
    secondary: {
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        borderColor: 'var(--color-border-strong)',
        boxShadow: 'var(--shadow-xs)',
    },
    ghost: {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        borderColor: 'transparent',
    },
    danger: {
        background: 'var(--color-danger)',
        color: '#ffffff',
        borderColor: 'var(--color-danger)',
    },
};
const sizeStyles = {
    sm: { fontSize: 'var(--text-sm)', padding: '5px 10px', height: 30 },
    md: { fontSize: 'var(--text-base)', padding: '7px 14px', height: 36 },
    lg: { fontSize: 'var(--text-md)', padding: '9px 18px', height: 42 },
};
export const Button = React.forwardRef(({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, disabled, style, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (_jsxs("button", { ref: ref, disabled: isDisabled, style: {
            ...styles.base,
            ...variantStyles[variant],
            ...sizeStyles[size],
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            ...style,
        }, ...props, children: [loading ? _jsx(Spinner, { size: size }) : leftIcon, children, !loading && rightIcon] }));
});
Button.displayName = 'Button';
function Spinner({ size }) {
    const dim = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
    return (_jsxs("svg", { width: dim, height: dim, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, style: { animation: 'spin 0.7s linear infinite' }, children: [_jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg) } }` }), _jsx("path", { d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" })] }));
}
