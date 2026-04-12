import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Avatar } from '@shared/components/ui';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { EmployeeActionsSheet } from './EmployeeActionsSheet';
import styles from './EmployeeCard.module.css';
const roleVariant = {
    owner: 'danger',
    manager: 'warning',
    employee: 'success',
};
export function EmployeeCard({ employee, currentUserId, onOpenRoleSheet, onRequestRemoval }) {
    const { t } = useTranslation();
    const { can } = usePermissions();
    const { isAdmin, isManager } = useCurrentUser();
    const [actionsOpen, setActionsOpen] = useState(false);
    const isSelf = currentUserId === employee.id;
    const isOwnerRow = employee.isOwner || employee.role === 'owner';
    const canChangeRole = can('employee:changeRole') && !isSelf && !isOwnerRow;
    const canDeactivate = can('employee:deactivate') &&
        !isSelf &&
        !isOwnerRow &&
        (isAdmin || (isManager && employee.role === 'employee'));
    const showMenu = canChangeRole || canDeactivate;
    const roleLabel = employee.role === 'owner'
        ? t('employees.roles.owner')
        : t(`employees.roles.${employee.role}`);
    return (_jsxs("article", { className: styles.card, children: [_jsxs("div", { className: styles.row, children: [_jsxs("div", { className: styles.identity, children: [_jsx(Avatar, { name: employee.displayName, size: "md" }), _jsxs("div", { className: styles.textBlock, children: [_jsxs("div", { className: styles.nameRow, children: [_jsx("p", { className: styles.name, children: employee.displayName }), _jsx(Badge, { variant: roleVariant[employee.role], children: roleLabel })] }), _jsx("p", { className: styles.email, children: employee.email })] })] }), showMenu ? (_jsx("button", { type: "button", className: styles.menuBtn, "aria-label": t('employees.actions.openMenu'), "aria-haspopup": "dialog", "aria-expanded": actionsOpen, onClick: () => setActionsOpen(true), children: _jsxs("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "5", r: "2" }), _jsx("circle", { cx: "12", cy: "12", r: "2" }), _jsx("circle", { cx: "12", cy: "19", r: "2" })] }) })) : null] }), isOwnerRow ? _jsx("p", { className: styles.hint, children: t('employees.ownerLockedHint') }) : null, isSelf && !isOwnerRow ? _jsx("p", { className: styles.hint, children: t('employees.actions.self') }) : null, !isOwnerRow && !isSelf && !showMenu ? _jsx("p", { className: styles.hint, children: t('employees.actions.readonly') }) : null, _jsx(EmployeeActionsSheet, { employee: actionsOpen ? employee : null, onClose: () => setActionsOpen(false), canChangeRole: canChangeRole, canDeactivate: canDeactivate, onChangeRole: () => {
                    setActionsOpen(false);
                    onOpenRoleSheet(employee);
                }, onDeactivate: () => {
                    setActionsOpen(false);
                    onRequestRemoval(employee, 'deactivate');
                }, onRemove: () => {
                    setActionsOpen(false);
                    onRequestRemoval(employee, 'remove');
                } })] }));
}
