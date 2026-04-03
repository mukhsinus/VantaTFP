import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '@shared/components/ui';
import { useCreateTask } from '../hooks/useCreateTask';
const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
];
const INITIAL_STATE = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
};
export function CreateTaskModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const { createTask, isPending } = useCreateTask();
    const [form, setForm] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});
    const handleClose = () => {
        setForm(INITIAL_STATE);
        setErrors({});
        onClose();
    };
    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) {
            newErrors.title = t('tasks.modal.errors.titleRequired');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate())
            return;
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
            dueDate: form.dueDate
                ? new Date(form.dueDate).toISOString()
                : undefined,
        };
        try {
            await createTask(payload);
            handleClose();
        }
        catch {
            // Error toast is handled inside useCreateTask — nothing to do here
        }
    };
    const field = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    return (_jsx(Modal, { isOpen: isOpen, onClose: handleClose, title: t('tasks.modal.title'), description: t('tasks.modal.description'), size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: handleClose, disabled: isPending, children: t('common.cancel') }), _jsx(Button, { variant: "primary", size: "sm", loading: isPending, onClick: handleSubmit, children: t('tasks.modal.submit') })] }), children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx(Input, { label: t('tasks.modal.fields.title'), placeholder: t('tasks.modal.placeholders.title'), value: form.title, onChange: (e) => field('title', e.target.value), error: errors.title, autoFocus: true }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: [_jsx("label", { style: {
                                fontSize: 'var(--text-sm)',
                                fontWeight: 500,
                                color: 'var(--color-text-primary)',
                            }, children: t('tasks.modal.fields.description') }), _jsx("textarea", { value: form.description, onChange: (e) => field('description', e.target.value), placeholder: t('tasks.modal.placeholders.description'), rows: 3, style: {
                                width: '100%',
                                padding: '8px 10px',
                                fontSize: 'var(--text-base)',
                                color: 'var(--color-text-primary)',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border-strong)',
                                borderRadius: 'var(--radius)',
                                resize: 'vertical',
                                outline: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.5,
                                transition: 'border-color var(--transition)',
                            }, onFocus: (e) => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-subtle)';
                            }, onBlur: (e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                                e.currentTarget.style.boxShadow = 'none';
                            } })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsx(Select, { label: t('tasks.modal.fields.priority'), value: form.priority, options: PRIORITY_OPTIONS, onChange: (e) => field('priority', e.target.value) }), _jsx(Input, { label: t('tasks.modal.fields.dueDate'), type: "date", value: form.dueDate, onChange: (e) => field('dueDate', e.target.value), min: new Date().toISOString().split('T')[0] })] }), _jsx("button", { type: "submit", style: { display: 'none' }, "aria-hidden": true })] }) }));
}
