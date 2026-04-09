import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import { BottomSheet } from './BottomSheet';
import styles from './ConfirmMemberSheet.module.css';
import sheetStyles from './sheet-overrides.module.css';
export function ConfirmMemberSheet({ target, onClose, onConfirm, isPending }) {
    const { t } = useTranslation();
    const isOpen = Boolean(target);
    const variant = target?.variant ?? 'deactivate';
    const title = variant === 'remove' ? t('employees.confirm.removeTitle') : t('employees.confirm.deactivateTitle');
    const body = variant === 'remove' ? t('employees.confirm.removeBody') : t('employees.confirm.deactivateBody');
    return (_jsx(BottomSheet, { isOpen: isOpen, onClose: onClose, title: title, subtitle: target?.employee.displayName, footerClassName: sheetStyles.footerStack, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "lg", onClick: onClose, disabled: isPending, children: t('common.actions.cancel') }), _jsx(Button, { variant: "danger", size: "lg", onClick: onConfirm, loading: isPending, children: variant === 'remove' ? t('employees.actions.remove') : t('employees.actions.deactivate') })] }), children: _jsx("p", { className: styles.body, children: body }) }));
}
