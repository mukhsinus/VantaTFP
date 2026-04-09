import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@shared/components/ui';
function limitText(value) {
    return value === null ? 'Unlimited' : String(value);
}
export function BillingLimitsGrid({ limits }) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }, children: [_jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Users" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700 }, children: limitText(limits.users) })] }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Tasks" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700 }, children: limitText(limits.tasks) })] }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "API / hour" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700 }, children: limits.apiRatePerHour })] })] }));
}
