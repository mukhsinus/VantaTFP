import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button';
export function EmptyState({ icon, title, description, action }) {
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            gap: 12,
        }, children: [icon && (_jsx("div", { style: {
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--color-bg-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                    color: 'var(--color-text-muted)',
                }, children: icon })), _jsx("p", { style: {
                    fontSize: 'var(--text-md)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                }, children: title }), description && (_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', maxWidth: 320 }, children: description })), action && (_jsx(Button, { variant: "primary", size: "sm", onClick: action.onClick, style: { marginTop: 4 }, children: action.label }))] }));
}
