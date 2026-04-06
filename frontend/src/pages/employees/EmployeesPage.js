import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Input, EmptyState, PageSkeleton, Select } from '@shared/components/ui';
import { useUsers } from '@features/users/hooks/useUsers';
import { useUpdateUser } from '@features/users/hooks/useUpdateUser';
import { useDeleteUser } from '@features/users/hooks/useDeleteUser';
import { CreateUserModal } from '@features/users/components/CreateUserModal';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useIsMobile } from '@shared/hooks/useIsMobile';
const roleVariant = {
    ADMIN: 'danger',
    MANAGER: 'warning',
    EMPLOYEE: 'success',
};
export function EmployeesPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { users, isLoading, isError } = useUsers();
    const { can } = usePermissions();
    const { role: currentRole, user: currentUser } = useCurrentUser();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const filtered = useMemo(() => {
        return users.filter((e) => {
            const matchSearch = `${e.fullName} ${e.email}`.toLowerCase().includes(search.toLowerCase());
            const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [users, search, roleFilter]);
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        return (_jsx(EmptyState, { title: t('errors.loadFailed.title'), description: t('errors.loadFailed.description'), action: { label: t('common.actions.retry'), onClick: () => window.location.reload() } }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('employees.title') }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: [users.length, " ", t('employees.total')] })] }), can('employee:invite') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowCreateModal(true), leftIcon: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), children: t('employees.invite') }))] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }, children: [_jsx("div", { style: { flex: 1, maxWidth: isMobile ? '100%' : 300, width: '100%' }, children: _jsx(Input, { placeholder: t('common.search'), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" })] }) }) }), _jsx("div", { style: { display: 'flex', gap: 6, width: isMobile ? '100%' : undefined, overflowX: isMobile ? 'auto' : undefined }, children: ['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'].map((r) => (_jsx("button", { onClick: () => setRoleFilter(r), style: {
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
                                    }, children: r === 'ALL'
                                        ? t('profile.roles.all')
                                        : r === 'ADMIN'
                                            ? t('profile.roles.admin')
                                            : r === 'MANAGER'
                                                ? t('profile.roles.manager')
                                                : t('profile.roles.employee') }, r))) })] }), filtered.length === 0 ? (_jsx(EmptyState, { title: t('employees.empty.title'), description: t('employees.empty.description'), action: can('employee:invite') ? { label: t('employees.invite'), onClick: () => setShowCreateModal(true) } : undefined })) : (_jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: isMobile ? 10 : 16,
                        }, children: filtered.map((employee) => (_jsx(EmployeeCard, { employee: employee, currentRole: currentRole, currentUserId: currentUser?.userId ?? null }, employee.id))) }))] }), currentRole && (_jsx(CreateUserModal, { isOpen: showCreateModal, onClose: () => setShowCreateModal(false), creatorRole: currentRole }))] }));
}
function EmployeeCard({ employee, currentRole, currentUserId, }) {
    const { t } = useTranslation();
    const { updateUser, isPending: isUpdating } = useUpdateUser();
    const { deleteUser, isPending: isDeleting } = useDeleteUser();
    const { can } = usePermissions();
    const [roleDraft, setRoleDraft] = useState(employee.role);
    const isSelf = currentUserId === employee.id;
    const canManage = can('employee:manage') && !isSelf;
    const managerCannotManageTarget = currentRole === 'MANAGER' && employee.role !== 'EMPLOYEE';
    const canEditThisUser = canManage && !managerCannotManageTarget;
    const availableRoleOptions = currentRole === 'MANAGER'
        ? [{ value: 'EMPLOYEE', label: t('profile.roles.employee') }]
        : [
            { value: 'ADMIN', label: t('profile.roles.admin') },
            { value: 'MANAGER', label: t('profile.roles.manager') },
            { value: 'EMPLOYEE', label: t('profile.roles.employee') },
        ];
    return (_jsxs("div", { style: {
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            transition: 'box-shadow var(--transition), border-color var(--transition)',
            boxShadow: 'var(--shadow-xs)',
        }, onMouseEnter: (e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx(Avatar, { name: employee.fullName, size: "md" }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: employee.fullName }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 1 }, children: employee.createdAtLabel })] })] }), _jsx(Badge, { variant: roleVariant[employee.role], children: employee.role === 'ADMIN'
                            ? t('profile.roles.admin')
                            : employee.role === 'MANAGER'
                                ? t('profile.roles.manager')
                                : t('profile.roles.employee') })] }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: employee.email }), canEditThisUser ? (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 6 }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx(Select, { label: t('employees.role'), value: roleDraft, options: availableRoleOptions, onChange: (e) => setRoleDraft(e.target.value) }) }), _jsx(Button, { size: "sm", variant: "secondary", disabled: isUpdating || roleDraft === employee.role, onClick: () => updateUser(employee.id, { role: roleDraft }), children: t('common.actions.save') }), _jsx(Button, { size: "sm", variant: "danger", disabled: isDeleting, onClick: () => deleteUser(employee.id), children: t('employees.actions.deactivate') })] })) : (_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 8 }, children: isSelf ? t('employees.actions.self') : t('employees.actions.readonly') }))] }));
}
