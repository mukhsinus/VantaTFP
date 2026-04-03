import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from 'react-dom';
import { useToastStore } from '@app/store/toast.store';
const iconMap = {
    success: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-success)", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M9 12l2 2 4-4" })] })),
    error: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M15 9l-6 6M9 9l6 6" })] })),
    info: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 16v-4M12 8h.01" })] })),
};
const borderColorMap = {
    success: 'var(--color-success-border)',
    error: 'var(--color-danger-border)',
    info: 'var(--color-accent-subtle-border)',
};
export function ToastRenderer() {
    const { toasts, removeToast } = useToastStore();
    if (toasts.length === 0)
        return null;
    return createPortal(_jsx("div", { style: {
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 'var(--z-toast)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            pointerEvents: 'none',
        }, children: toasts.map((item) => (_jsxs("div", { style: {
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
            }, children: [_jsx("style", { children: `
            @keyframes toastSlideIn {
              from { opacity: 0; transform: translateX(20px) }
              to   { opacity: 1; transform: translateX(0) }
            }
          ` }), _jsx("span", { style: { flexShrink: 0, marginTop: 1 }, children: iconMap[item.type] }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: item.title }), item.description && (_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }, children: item.description }))] }), _jsx("button", { onClick: () => removeToast(item.id), style: {
                        flexShrink: 0,
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: 2,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        lineHeight: 1,
                    }, children: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }) })] }, item.id))) }), document.body);
}
