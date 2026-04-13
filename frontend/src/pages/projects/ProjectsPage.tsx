import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useProjects, useCreateProject, useDeleteProject } from '@features/projects/hooks/useProjects';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { ProjectApiDto } from '@entities/project/project.types';

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
    return projects.filter((p: ProjectApiDto) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createProject.mutateAsync({ name: formName.trim(), description: formDescription.trim(), color: formColor });
    setFormName('');
    setFormDescription('');
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={32} width={200} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} borderRadius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('projects.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {projects.length} {t('projects.total')}
          </p>
        </div>
        {can('task:create') && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            {t('projects.create')}
          </Button>
        )}
      </div>

      <div style={{ maxWidth: isMobile ? '100%' : 300 }}>
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
      </div>

      {showForm && (
        <div style={{
          padding: 16,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <Input placeholder={t('projects.fields.name')} value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input placeholder={t('projects.fields.description')} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{t('projects.fields.color')}</label>
            <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={createProject.isPending}>
              {t('common.actions.create')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={t('projects.empty.title')}
          description={t('projects.empty.description')}
          action={can('task:create') ? { label: t('projects.create'), onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? 10 : 16,
        }}>
          {filtered.map((project: ProjectApiDto) => (
            <div
              key={project.id}
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: project.color || '#6366f1',
                  flexShrink: 0,
                }} />
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {project.name}
                </h3>
              </div>
              {project.description && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {project.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                {can('task:create') && (
                  <button
                    onClick={() => deleteProject.mutate(project.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)',
                    }}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
