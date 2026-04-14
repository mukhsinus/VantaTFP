import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@features/documents/hooks/useDocuments';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
export function DocumentsPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { can } = usePermissions();
    const { data: documentsResponse, isLoading } = useDocuments();
    const documents = documentsResponse?.data ?? [];
    const createDocument = useCreateDocument();
    const deleteDocument = useDeleteDocument();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const filtered = useMemo(() => {
        return documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
    }, [documents, search]);
    const handleCreate = async () => {
        if (!formTitle.trim())
            return;
        await createDocument.mutateAsync({ title: formTitle.trim(), content: '', contentType: 'markdown' });
        setFormTitle('');
        setShowForm(false);
    };
    if (isLoading) {
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx(Skeleton, { height: 32, width: 200 }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }, children: [1, 2, 3].map((i) => (_jsx(Skeleton, { height: 100, borderRadius: "var(--radius-lg)" }, i))) })] }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('documents.title') }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: [documents.length, " ", t('documents.total')] })] }), can('task:create') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowForm(true), children: t('documents.create') }))] }), _jsx("div", { style: { maxWidth: isMobile ? '100%' : 300 }, children: _jsx(Input, { placeholder: t('common.search'), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" })] }) }) }), showForm && (_jsxs("div", { style: {
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }, children: [_jsx(Input, { placeholder: t('documents.fields.title'), value: formTitle, onChange: (e) => setFormTitle(e.target.value) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Button, { variant: "primary", size: "sm", onClick: handleCreate, disabled: createDocument.isPending, children: t('common.actions.create') }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setShowForm(false), children: t('common.actions.cancel') })] })] })), filtered.length === 0 ? (_jsx(EmptyState, { title: t('documents.empty.title'), description: t('documents.empty.description'), action: can('task:create') ? { label: t('documents.create'), onClick: () => setShowForm(true) } : undefined })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: isMobile ? 10 : 16,
                }, children: filtered.map((doc) => (_jsxs("div", { style: {
                        padding: 16,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        cursor: 'pointer',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 18 }, children: doc.icon || '📄' }), _jsx("h3", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: doc.title })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, children: [_jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: new Date(doc.updatedAt).toLocaleDateString() }), can('task:create') && (_jsx("button", { onClick: (e) => { e.stopPropagation(); deleteDocument.mutate(doc.id); }, style: {
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)',
                                    }, children: t('common.delete') }))] })] }, doc.id))) }))] }));
}
