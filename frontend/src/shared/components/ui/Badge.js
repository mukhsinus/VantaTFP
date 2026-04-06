import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantMap = {
    default: {
        background: 'var(--color-gray-100)',
        color: 'var(--color-gray-600)',
        borderColor: 'var(--color-gray-200)',
    },
    success: {
        background: 'var(--color-success-subtle)',
        color: 'var(--color-success)',
        borderColor: 'var(--color-success-border)',
    },
    warning: {
        background: 'var(--color-warning-subtle)',
        color: 'var(--color-warning)',
        borderColor: 'var(--color-warning-border)',
    },
    danger: {
        background: 'var(--color-danger-subtle)',
        color: 'var(--color-danger)',
        borderColor: 'var(--color-danger-border)',
    },
    info: {
        background: 'var(--color-info-subtle)',
        color: 'var(--color-info)',
        borderColor: 'var(--color-info-border)',
    },
    accent: {
        background: 'var(--color-accent-subtle)',
        color: 'var(--color-accent)',
        borderColor: 'var(--color-accent-subtle-border)',
    },
};
const dotColorMap = {
    default: 'var(--color-gray-400)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',
    accent: 'var(--color-accent)',
};
export function Badge({ children, variant = 'default', dot = false, style }) {
    return (_jsxs("span", { style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            borderRadius: 'var(--radius-full)',
            border: '1px solid',
            lineHeight: 1.6,
            ...variantMap[variant],
            ...style,
        }, children: [dot && (_jsx("span", { style: {
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: dotColorMap[variant],
                    flexShrink: 0,
                } })), children] }));
}
