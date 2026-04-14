import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useAutomations, useCreateAutomation, useDeleteAutomation } from '@features/automations/hooks/useAutomations';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
const TRIGGER_TYPES = ['status_change', 'assignment', 'due_date_passed', 'field_change'];
const ACTION_TYPES = ['change_status', 'assign_user', 'send_notification', 'create_task'];
export function AutomationsPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { can } = usePermissions();
    const { data: automationsResponse, isLoading } = useAutomations();
    const automations = automationsResponse?.data ?? [];
    const createAutomation = useCreateAutomation();
    const deleteAutomation = useDeleteAutomation();
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formTrigger, setFormTrigger] = useState(TRIGGER_TYPES[0]);
    const [formAction, setFormAction] = useState(ACTION_TYPES[0]);
    const handleCreate = async () => {
        if (!formName.trim())
            return;
        await createAutomation.mutateAsync({
            name: formName.trim(),
            triggerType: formTrigger,
            actionType: formAction,
            triggerConfig: {},
            actionConfig: {},
            active: true,
        });
        setFormName('');
        setShowForm(false);
    };
    if (isLoading) {
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx(Skeleton, { height: 32, width: 200 }), [1, 2, 3].map((i) => (_jsx(Skeleton, { height: 80, borderRadius: "var(--radius-lg)" }, i)))] }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('automations.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('automations.subtitle') })] }), can('tenant:manage') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowForm(true), children: t('automations.create') }))] }), showForm && (_jsxs("div", { style: {
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }, children: [_jsx("input", { type: "text", placeholder: t('automations.fields.name'), value: formName, onChange: (e) => setFormName(e.target.value), style: {
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                            fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                        } }), _jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap' }, children: [_jsxs("div", { style: { flex: 1, minWidth: 200 }, children: [_jsx("label", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }, children: t('automations.fields.trigger') }), _jsx("select", { value: formTrigger, onChange: (e) => setFormTrigger(e.target.value), style: {
                                            width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                                            fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                                        }, children: TRIGGER_TYPES.map((tr) => (_jsx("option", { value: tr, children: t(`automations.triggers.${tr}`) }, tr))) })] }), _jsxs("div", { style: { flex: 1, minWidth: 200 }, children: [_jsx("label", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }, children: t('automations.fields.action') }), _jsx("select", { value: formAction, onChange: (e) => setFormAction(e.target.value), style: {
                                            width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                                            fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                                        }, children: ACTION_TYPES.map((ac) => (_jsx("option", { value: ac, children: t(`automations.actions.${ac}`) }, ac))) })] })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Button, { variant: "primary", size: "sm", onClick: handleCreate, disabled: createAutomation.isPending, children: t('common.actions.create') }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setShowForm(false), children: t('common.actions.cancel') })] })] })), automations.length === 0 ? (_jsx(EmptyState, { title: t('automations.empty.title'), description: t('automations.empty.description'), action: can('tenant:manage') ? { label: t('automations.create'), onClick: () => setShowForm(true) } : undefined })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 12 }, children: automations.map((rule) => (_jsxs("div", { style: {
                        padding: 16,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                    }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: rule.name }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }, children: [t(`automations.triggers.${rule.triggerType}`), " \u2192 ", t(`automations.actions.${rule.actionType}`)] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: {
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 500,
                                        background: rule.active ? 'var(--color-success-bg, #dcfce7)' : 'var(--color-bg-muted)',
                                        color: rule.active ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)',
                                    }, children: rule.active ? t('automations.active') : t('automations.inactive') }), can('tenant:manage') && (_jsx("button", { onClick: () => deleteAutomation.mutate(rule.id), style: {
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)',
                                    }, children: t('common.delete') }))] })] }, rule.id))) }))] }));
}
