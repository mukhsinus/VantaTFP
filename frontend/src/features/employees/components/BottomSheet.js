import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './BottomSheet.module.css';
export function BottomSheet({ isOpen, onClose, title, subtitle, children, footer, footerClassName }) {
    const { t } = useTranslation();
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return createPortal(_jsxs("div", { className: styles.root, role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsx("div", { className: styles.backdrop, onClick: onClose, "aria-hidden": true }), _jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.handle, "aria-hidden": true }), _jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { className: styles.title, children: title }), subtitle ? _jsx("p", { className: styles.subtitle, children: subtitle }) : null] }), _jsx("button", { type: "button", className: styles.close, onClick: onClose, "aria-label": t('common.actions.close'), children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }) })] }), _jsx("div", { className: styles.body, children: children }), footer ? _jsx("div", { className: [styles.footer, footerClassName].filter(Boolean).join(' '), children: footer }) : null] })] }), document.body);
}
