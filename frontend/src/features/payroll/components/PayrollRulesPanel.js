import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Card, EmptyState, Skeleton } from '@shared/components/ui';
import { usePayrollRules } from '../hooks/usePayrollRules';
export function PayrollRulesPanel() {
    const { data, isLoading, isError } = usePayrollRules();
    if (isLoading) {
        return (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }, children: [1, 2, 3].map((x) => (_jsx(Skeleton, { height: 84, borderRadius: "var(--radius-lg)" }, x))) }));
    }
    if (isError) {
        return (_jsx(EmptyState, { title: "Payroll rules unavailable", description: "Unable to load payroll rules." }));
    }
    if (!data || data.length === 0) {
        return (_jsx(EmptyState, { title: "No payroll rules", description: "Create rules from backend admin to enable advanced payroll calculation." }));
    }
    return (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }, children: data.map((rule) => (_jsxs(Card, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, children: [_jsx("p", { style: { margin: 0, fontWeight: 600 }, children: rule.name || rule.type }), _jsx(Badge, { variant: rule.isActive ? 'success' : 'default', children: rule.isActive ? 'ACTIVE' : 'INACTIVE' })] }), _jsxs("p", { style: { margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }, children: ["Type: ", _jsx("strong", { children: rule.type })] })] }, rule.id))) }));
}
