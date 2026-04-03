import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
const sizeMap = { sm: 400, md: 520, lg: 680 };
export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }) {
    useEffect(() => {
        if (!isOpen)
            return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return createPortal(_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": title, style: {
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
        }, children: [_jsx("div", { onClick: onClose, style: {
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(2px)',
                    animation: 'fadeIn 150ms ease',
                } }), _jsxs("div", { style: {
                    position: 'relative',
                    width: '100%',
                    maxWidth: sizeMap[size],
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    animation: 'slideUp 200ms ease',
                }, children: [_jsx("style", { children: `
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        ` }), _jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            padding: '20px 24px 16px',
                            borderBottom: '1px solid var(--color-border)',
                        }, children: [_jsxs("div", { children: [_jsx("h2", { style: {
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: 600,
                                            color: 'var(--color-text-primary)',
                                        }, children: title }), description && (_jsx("p", { style: {
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--color-text-secondary)',
                                            marginTop: 4,
                                        }, children: description }))] }), _jsx("button", { onClick: onClose, "aria-label": "Close", style: {
                                    width: 28,
                                    height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--color-text-muted)',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'background var(--transition)',
                                }, onMouseEnter: (e) => (e.currentTarget.style.background = 'var(--color-bg-muted)'), onMouseLeave: (e) => (e.currentTarget.style.background = 'transparent'), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }) })] }), _jsx("div", { style: { padding: '20px 24px' }, children: children }), footer && (_jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            padding: '16px 24px',
                            borderTop: '1px solid var(--color-border)',
                            background: 'var(--color-bg-subtle)',
                        }, children: footer }))] })] }), document.body);
}
export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'danger', }) {
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: title, description: description, size: "sm", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: onClose, children: "Cancel" }), _jsx(Button, { variant: variant, size: "sm", onClick: onConfirm, children: confirmLabel })] }), children: _jsx("div", {}) }));
}
