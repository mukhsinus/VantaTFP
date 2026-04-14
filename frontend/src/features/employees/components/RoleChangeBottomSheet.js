import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import { usePatchEmployeeRole } from '../hooks/usePatchEmployeeRole';
import { BottomSheet } from './BottomSheet';
import sheetStyles from './sheet-overrides.module.css';
import styles from './RoleChangeBottomSheet.module.css';
const ROLES = [
    { value: 'manager', labelKey: 'employees.roles.manager' },
    { value: 'employee', labelKey: 'employees.roles.employee' },
];
export function RoleChangeBottomSheet({ employee, onClose }) {
    const { t } = useTranslation();
    const { patchRoleAsync, isPending } = usePatchEmployeeRole();
    const [draft, setDraft] = useState('employee');
    useEffect(() => {
        if (!employee)
            return;
        setDraft(employee.role === 'employee' ? 'employee' : 'manager');
    }, [employee]);
    const isOpen = Boolean(employee);
    const unchanged = employee && employee.role !== 'owner' && draft === employee.role;
    const handleSave = async () => {
        if (!employee || unchanged)
            return;
        try {
            await patchRoleAsync(employee.id, draft);
            onClose();
        }
        catch {
            /* toast from hook */
        }
    };
    return (_jsxs(BottomSheet, { isOpen: isOpen, onClose: onClose, title: t('employees.sheet.changeRoleTitle'), subtitle: employee?.phone?.trim() || employee?.email, footerClassName: sheetStyles.footerStack, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "lg", onClick: onClose, disabled: isPending, children: t('common.actions.cancel') }), _jsx(Button, { variant: "primary", size: "lg", onClick: handleSave, loading: isPending, disabled: Boolean(unchanged), children: t('common.actions.save') })] }), children: [_jsx("p", { className: styles.legend, children: t('employees.role') }), _jsx("div", { className: styles.options, role: "listbox", "aria-label": t('employees.role'), children: ROLES.map((r) => {
                    const selected = draft === r.value;
                    return (_jsxs("button", { type: "button", role: "option", "aria-selected": selected, className: `${styles.option} ${selected ? styles.optionSelected : ''}`, onClick: () => setDraft(r.value), children: [_jsx("span", { children: t(r.labelKey) }), selected ? (_jsx("span", { className: styles.check, "aria-hidden": true, children: _jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M20 6L9 17l-5-5" }) }) })) : (_jsx("span", { style: { width: 22, height: 22, flexShrink: 0 }, "aria-hidden": true }))] }, r.value));
                }) })] }));
}
