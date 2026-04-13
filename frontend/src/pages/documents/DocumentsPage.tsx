import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@features/documents/hooks/useDocuments';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { DocumentApiDto } from '@entities/document/document.types';

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
    return documents.filter((d: DocumentApiDto) =>
      d.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    await createDocument.mutateAsync({ title: formTitle.trim(), content: '', contentType: 'markdown' });
    setFormTitle('');
    setShowForm(false);
  };

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
            {t('documents.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {documents.length} {t('documents.total')}
          </p>
        </div>
        {can('task:create') && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            {t('documents.create')}
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
          <Input placeholder={t('documents.fields.title')} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={createDocument.isPending}>
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
          title={t('documents.empty.title')}
          description={t('documents.empty.description')}
          action={can('task:create') ? { label: t('documents.create'), onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? 10 : 16,
        }}>
          {filtered.map((doc: DocumentApiDto) => (
            <div
              key={doc.id}
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{doc.icon || '📄'}</span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {doc.title}
                </h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
                {can('task:create') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDocument.mutate(doc.id); }}
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
