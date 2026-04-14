import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Button, Skeleton, Input } from '@shared/components/ui';
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '@features/templates/hooks/useTemplates';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
export function TemplatesPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { can } = usePermissions();
    const { data: templates = [], isLoading } = useTemplates();
    const createTemplate = useCreateTemplate();
    const deleteTemplate = useDeleteTemplate();
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const handleCreate = async () => {
        if (!formName.trim())
            return;
        await createTemplate.mutateAsync({
            name: formName.trim(),
            description: formDescription.trim(),
            defaultPriority: 'medium',
        });
        setFormName('');
        setFormDescription('');
        setShowForm(false);
    };
    if (isLoading) {
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx(Skeleton, { height: 32, width: 200 }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }, children: [1, 2, 3].map((i) => (_jsx(Skeleton, { height: 100, borderRadius: "var(--radius-lg)" }, i))) })] }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('templates.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('templates.subtitle') })] }), can('task:create') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowForm(true), children: t('templates.create') }))] }), showForm && (_jsxs("div", { style: {
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }, children: [_jsx(Input, { placeholder: t('templates.fields.name'), value: formName, onChange: (e) => setFormName(e.target.value) }), _jsx(Input, { placeholder: t('templates.fields.description'), value: formDescription, onChange: (e) => setFormDescription(e.target.value) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Button, { variant: "primary", size: "sm", onClick: handleCreate, disabled: createTemplate.isPending, children: t('common.actions.create') }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setShowForm(false), children: t('common.actions.cancel') })] })] })), templates.length === 0 ? (_jsx(EmptyState, { title: t('templates.empty.title'), description: t('templates.empty.description'), action: can('task:create') ? { label: t('templates.create'), onClick: () => setShowForm(true) } : undefined })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: isMobile ? 10 : 16,
                }, children: templates.map((tpl) => (_jsxs("div", { style: {
                        padding: 16,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }, children: [_jsx("h3", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: tpl.name }), tpl.description && (_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }, children: tpl.description })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, children: [_jsx("span", { style: {
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 500,
                                        background: 'var(--color-bg-muted)',
                                        color: 'var(--color-text-muted)',
                                    }, children: tpl.defaultPriority || 'medium' }), can('task:create') && (_jsx("button", { onClick: () => deleteTemplate.mutate(tpl.id), style: {
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)',
                                    }, children: t('common.delete') }))] })] }, tpl.id))) }))] }));
}
