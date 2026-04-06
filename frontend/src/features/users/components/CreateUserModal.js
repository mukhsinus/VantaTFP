import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCreateUser } from '../hooks/useCreateUser';
const INITIAL_FORM = {
    email: '',
    password: '',
    role: 'EMPLOYEE',
    firstName: '',
    lastName: '',
};
export function CreateUserModal({ isOpen, onClose, creatorRole }) {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { createUser, isPending } = useCreateUser();
    const [form, setForm] = useState(INITIAL_FORM);
    const [error, setError] = useState(null);
    const roleOptions = useMemo(() => {
        if (creatorRole === 'MANAGER') {
            return [{ value: 'EMPLOYEE', label: t('profile.roles.employee') }];
        }
        return [
            { value: 'ADMIN', label: t('profile.roles.admin') },
            { value: 'MANAGER', label: t('profile.roles.manager') },
            { value: 'EMPLOYEE', label: t('profile.roles.employee') },
        ];
    }, [creatorRole, t]);
    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleClose = () => {
        setForm(INITIAL_FORM);
        setError(null);
        onClose();
    };
    const validate = () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError(t('employees.modal.errors.nameRequired'));
            return false;
        }
        if (!form.email.trim()) {
            setError(t('employees.modal.errors.emailRequired'));
            return false;
        }
        if (form.password.length < 8) {
            setError(t('employees.modal.errors.passwordShort'));
            return false;
        }
        if (creatorRole === 'MANAGER' && form.role !== 'EMPLOYEE') {
            setError(t('employees.modal.errors.managerRole'));
            return false;
        }
        setError(null);
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate())
            return;
        try {
            await createUser({
                email: form.email.trim(),
                password: form.password,
                role: form.role,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
            });
            handleClose();
        }
        catch {
            // toast handled in hook
        }
    };
    return (_jsx(Modal, { isOpen: isOpen, onClose: handleClose, title: t('employees.modal.title'), description: t('employees.modal.description'), size: isMobile ? 'lg' : 'md', footer: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto', gap: 8, width: isMobile ? '100%' : undefined }, children: [_jsx(Button, { variant: "secondary", size: isMobile ? 'lg' : 'sm', onClick: handleClose, disabled: isPending, style: { width: '100%' }, children: t('common.actions.cancel') }), _jsx(Button, { variant: "primary", size: isMobile ? 'lg' : 'sm', onClick: handleSubmit, loading: isPending, style: { width: '100%' }, children: t('employees.modal.submit') })] }), children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }, children: [error && (_jsx("div", { style: {
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-danger)',
                        background: 'var(--color-danger-subtle)',
                        border: '1px solid var(--color-danger-border)',
                        borderRadius: 'var(--radius)',
                        padding: '8px 10px',
                    }, children: error })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }, children: [_jsx(Input, { label: t('employees.modal.fields.firstName'), value: form.firstName, onChange: (e) => setField('firstName', e.target.value) }), _jsx(Input, { label: t('employees.modal.fields.lastName'), value: form.lastName, onChange: (e) => setField('lastName', e.target.value) })] }), _jsx(Input, { label: t('employees.modal.fields.email'), type: "email", value: form.email, onChange: (e) => setField('email', e.target.value) }), _jsx(Input, { label: t('employees.modal.fields.password'), type: "password", value: form.password, onChange: (e) => setField('password', e.target.value) }), _jsx(Select, { label: t('employees.modal.fields.role'), value: form.role, onChange: (e) => setField('role', e.target.value), options: roleOptions })] }) }));
}
