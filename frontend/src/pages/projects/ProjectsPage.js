import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useProjects, useCreateProject, useDeleteProject } from '@features/projects/hooks/useProjects';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
export function ProjectsPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { can } = usePermissions();
    const { data: projectsResponse, isLoading } = useProjects();
    const projects = projectsResponse?.data ?? [];
    const createProject = useCreateProject();
    const deleteProject = useDeleteProject();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formColor, setFormColor] = useState('#6366f1');
    const filtered = useMemo(() => {
        return projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }, [projects, search]);
    const handleCreate = async () => {
        if (!formName.trim())
            return;
        await createProject.mutateAsync({ name: formName.trim(), description: formDescription.trim(), color: formColor });
        setFormName('');
        setFormDescription('');
        setShowForm(false);
    };
    if (isLoading) {
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx(Skeleton, { height: 32, width: 200 }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }, children: [1, 2, 3].map((i) => (_jsx(Skeleton, { height: 120, borderRadius: "var(--radius-lg)" }, i))) })] }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('projects.title') }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: [projects.length, " ", t('projects.total')] })] }), can('task:create') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowForm(true), children: t('projects.create') }))] }), _jsx("div", { style: { maxWidth: isMobile ? '100%' : 300 }, children: _jsx(Input, { placeholder: t('common.search'), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" })] }) }) }), showForm && (_jsxs("div", { style: {
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }, children: [_jsx(Input, { placeholder: t('projects.fields.name'), value: formName, onChange: (e) => setFormName(e.target.value) }), _jsx(Input, { placeholder: t('projects.fields.description'), value: formDescription, onChange: (e) => setFormDescription(e.target.value) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: t('projects.fields.color') }), _jsx("input", { type: "color", value: formColor, onChange: (e) => setFormColor(e.target.value), style: { width: 32, height: 32, border: 'none', cursor: 'pointer' } })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Button, { variant: "primary", size: "sm", onClick: handleCreate, disabled: createProject.isPending, children: t('common.actions.create') }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setShowForm(false), children: t('common.actions.cancel') })] })] })), filtered.length === 0 ? (_jsx(EmptyState, { title: t('projects.empty.title'), description: t('projects.empty.description'), action: can('task:create') ? { label: t('projects.create'), onClick: () => setShowForm(true) } : undefined })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: isMobile ? 10 : 16,
                }, children: filtered.map((project) => (_jsxs("div", { style: {
                        padding: 16,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("div", { style: {
                                        width: 12, height: 12, borderRadius: '50%',
                                        background: project.color || '#6366f1',
                                        flexShrink: 0,
                                    } }), _jsx("h3", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: project.name })] }), project.description && (_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }, children: project.description })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, children: [_jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: new Date(project.createdAt).toLocaleDateString() }), can('task:create') && (_jsx("button", { onClick: () => deleteProject.mutate(project.id), style: {
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)',
                                    }, children: t('common.delete') }))] })] }, project.id))) }))] }));
}
