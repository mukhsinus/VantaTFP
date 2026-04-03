import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Input, EmptyState } from '@shared/components/ui';
const mockEmployees = [
    { id: '1', firstName: 'Sofia', lastName: 'Chen', email: 'sofia@example.com', role: 'MANAGER', department: 'Engineering', status: 'active', joinDate: 'Jan 2024', tasksCount: 12 },
    { id: '2', firstName: 'James', lastName: 'Park', email: 'james@example.com', role: 'EMPLOYEE', department: 'Design', status: 'active', joinDate: 'Mar 2024', tasksCount: 7 },
    { id: '3', firstName: 'Amara', lastName: 'Diallo', email: 'amara@example.com', role: 'EMPLOYEE', department: 'Operations', status: 'active', joinDate: 'Feb 2023', tasksCount: 5 },
    { id: '4', firstName: 'Luca', lastName: 'Ferrari', email: 'luca@example.com', role: 'MANAGER', department: 'Sales', status: 'active', joinDate: 'Nov 2023', tasksCount: 9 },
    { id: '5', firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', role: 'EMPLOYEE', department: 'Finance', status: 'inactive', joinDate: 'Jun 2022', tasksCount: 0 },
    { id: '6', firstName: 'Alex', lastName: 'Kim', email: 'alex@example.com', role: 'ADMIN', department: 'Management', status: 'active', joinDate: 'Jan 2022', tasksCount: 4 },
];
const roleVariant = {
    ADMIN: 'danger',
    MANAGER: 'warning',
    EMPLOYEE: 'success',
};
export function EmployeesPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const filtered = mockEmployees.filter((e) => {
        const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.department}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
        return matchSearch && matchRole;
    });
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('employees.title') }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: [mockEmployees.filter((e) => e.status === 'active').length, " ", t('employees.active'), ' · ', mockEmployees.length, " ", t('employees.total')] })] }), _jsx(Button, { variant: "primary", size: "sm", leftIcon: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), children: t('employees.invite') })] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("div", { style: { flex: 1, maxWidth: 300 }, children: _jsx(Input, { placeholder: t('employees.search'), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" })] }) }) }), _jsx("div", { style: { display: 'flex', gap: 6 }, children: ['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'].map((r) => (_jsx("button", { onClick: () => setRoleFilter(r), style: {
                                padding: '5px 12px',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 500,
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all var(--transition)',
                                background: roleFilter === r ? 'var(--color-accent)' : 'var(--color-bg)',
                                color: roleFilter === r ? '#fff' : 'var(--color-text-secondary)',
                                borderColor: roleFilter === r ? 'var(--color-accent)' : 'var(--color-border-strong)',
                            }, children: r }, r))) })] }), filtered.length === 0 ? (_jsx(EmptyState, { title: t('employees.empty.title'), description: t('employees.empty.description'), action: { label: t('employees.invite'), onClick: () => { } } })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                }, children: filtered.map((employee) => (_jsx(EmployeeCard, { employee: employee }, employee.id))) }))] }));
}
function EmployeeCard({ employee }) {
    const { t } = useTranslation();
    const fullName = `${employee.firstName} ${employee.lastName}`;
    return (_jsxs("div", { style: {
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'box-shadow var(--transition), border-color var(--transition)',
            boxShadow: 'var(--shadow-xs)',
            opacity: employee.status === 'inactive' ? 0.6 : 1,
        }, onMouseEnter: (e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx(Avatar, { name: fullName, size: "md" }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: fullName }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 1 }, children: employee.department })] })] }), _jsx(Badge, { variant: roleVariant[employee.role], children: employee.role })] }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: employee.email }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid var(--color-border)',
                }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: t('employees.card.tasks') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: employee.tasksCount })] }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: t('employees.card.joined') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }, children: employee.joinDate })] }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: t('employees.card.status') }), _jsx(Badge, { variant: employee.status === 'active' ? 'success' : 'default', dot: true, children: employee.status })] })] })] }));
}
