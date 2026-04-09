import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import styles from './EmployeesInviteFab.module.css';
const fabStyle = {
    width: 56,
    height: 56,
    minWidth: 56,
    minHeight: 56,
    padding: 0,
    borderRadius: '50%',
    boxShadow: 'var(--shadow-lg)',
};
/** Circular FAB; above mobile tab bar, corner on desktop. */
export function EmployeesInviteFab({ visible, onInvite }) {
    const { t } = useTranslation();
    if (!visible)
        return null;
    return (_jsx("div", { className: styles.wrap, children: _jsx(Button, { variant: "primary", size: "lg", style: fabStyle, onClick: onInvite, "aria-label": t('employees.invite'), title: t('employees.invite'), children: _jsx("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, "aria-hidden": true, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }) }) }));
}
