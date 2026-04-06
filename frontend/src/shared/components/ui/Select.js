import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Select = React.forwardRef(({ label, options, error, placeholder, id, style, ...props }, ref) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: [label && (_jsx("label", { htmlFor: selectId, style: {
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                }, children: label })), _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("select", { ref: ref, id: selectId, style: {
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
                        }, ...props, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }), _jsx("span", { style: {
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: 'var(--color-text-muted)',
                        }, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { d: "M6 9l6 6 6-6" }) }) })] }), error && (_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }, children: error }))] }));
});
Select.displayName = 'Select';
