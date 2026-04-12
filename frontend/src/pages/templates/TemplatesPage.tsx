import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Button, Skeleton, Input } from '@shared/components/ui';
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '@features/templates/hooks/useTemplates';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useFeature } from '@app/store/feature-flags.store';
import type { TemplateApiDto } from '@entities/template/template.types';

export function TemplatesPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const enabled = useFeature('templates');
  const { can } = usePermissions();
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createTemplate.mutateAsync({
      name: formName.trim(),
      description: formDescription.trim(),
      defaultPriority: 'medium',
    });
    setFormName('');
    setFormDescription('');
    setShowForm(false);
  };

  if (!enabled) {
    return (
      <EmptyState
        title={t('templates.disabled.title')}
        description={t('templates.disabled.description')}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={32} width={200} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={100} borderRadius="var(--radius-lg)" />
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
            {t('templates.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('templates.subtitle')}
          </p>
        </div>
        {can('task:create') && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            {t('templates.create')}
          </Button>
        )}
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
          <Input placeholder={t('templates.fields.name')} value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input placeholder={t('templates.fields.description')} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={createTemplate.isPending}>
              {t('common.actions.create')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          title={t('templates.empty.title')}
          description={t('templates.empty.description')}
          action={can('task:create') ? { label: t('templates.create'), onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? 10 : 16,
        }}>
          {templates.map((tpl: TemplateApiDto) => (
            <div
              key={tpl.id}
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
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {tpl.name}
              </h3>
              {tpl.description && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {tpl.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  background: 'var(--color-bg-muted)',
                  color: 'var(--color-text-muted)',
                }}>
                  {tpl.defaultPriority || 'medium'}
                </span>
                {can('task:create') && (
                  <button
                    onClick={() => deleteTemplate.mutate(tpl.id)}
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
