import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const paddingMap = { none: 0, sm: 12, md: 20, lg: 28 };
export function Card({ children, padding = 'md', style, className }) {
    return (_jsx("div", { className: className, style: {
            width: '100%',
            maxWidth: '100%',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            padding: paddingMap[padding],
            overflow: 'hidden',
            ...style,
        }, children: children }));
}
export function CardHeader({ title, subtitle, action }) {
    return (_jsxs("div", { style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
        }, children: [_jsxs("div", { children: [_jsx("h3", { style: {
                            fontSize: 'var(--text-md)',
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--color-text-primary)',
                        }, children: title }), subtitle && (_jsx("p", { style: {
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)',
                            marginTop: 2,
                        }, children: subtitle }))] }), action && _jsx("div", { children: action })] }));
}
