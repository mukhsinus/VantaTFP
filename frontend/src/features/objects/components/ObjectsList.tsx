import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@shared/api/client';
import { Badge, Button, EmptyState, PageSkeleton } from '@shared/components/ui';
import styles from '../objects.module.css';

interface Object {
  id: string;
  name: string;
  description: string | null;
  object_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ObjectsListProps {
  onObjectSelect?: (object: Object) => void;
  showCreate?: boolean;
  onCreateClick?: () => void;
}

export const ObjectsList: React.FC<ObjectsListProps> = ({
  onObjectSelect,
  showCreate = true,
  onCreateClick,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [objectType, setObjectType] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['objects', page, objectType, searchTerm],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          ...(objectType && { object_type: objectType }),
          ...(searchTerm && { search: searchTerm }),
        });
        const res = await apiClient.get(`/api/v1/objects?${params}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching objects:', err);
        if (err instanceof Error) {
          throw new Error(`Failed to load objects: ${err.message}`);
        }
        throw new Error('Failed to load objects. Please check your connection and try again.');
      }
    },
    staleTime: 30000,
    retry: 2,
  });

  const objectTypes = ['equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other'];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title={t('objects.messages.failed')}
        description={error instanceof Error ? error.message : t('common.errors.unexpected')}
        action={{ label: t('common.actions.retry'), onClick: () => refetch() }}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
    );
  }

  const objects = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className={styles['objects-list']}>
      <div className={styles['objects-list__header']}>
        <h2>{t('objects.title')}</h2>
        {showCreate && (
          <Button
            variant="primary"
            onClick={onCreateClick}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            {t('objects.actions.create')}
          </Button>
        )}
      </div>

      <div className={styles['objects-list__filters']}>
        <input
          type="text"
          placeholder={t('objects.actions.search')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className={styles['objects-list__search-input']}
        />

        <select
          value={objectType || ''}
          onChange={(e) => {
            setObjectType(e.target.value || undefined);
            setPage(1);
          }}
          className={styles['objects-list__type-select']}
        >
          <option value="">{t('objects.actions.filterByType')}</option>
          {objectTypes.map((type) => (
            <option key={type} value={type}>
              {t(`objects.types.${type}` as any)}
            </option>
          ))}
        </select>
      </div>

      {objects.length === 0 ? (
        <EmptyState
          title={t('objects.empty.title')}
          description={t('objects.empty.description')}
          action={showCreate ? { label: t('objects.empty.action'), onClick: onCreateClick } : undefined}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 15h6" />
            </svg>
          }
        />
      ) : (
        <>
          <div className={styles['objects-list__grid']}>
            {objects.map((object: Object) => (
              <div
                key={object.id}
                className={styles['object-card']}
                onClick={() => onObjectSelect?.(object)}
                role="button"
                tabIndex={0}
              >
                <div className={styles['object-card__header']}>
                  <h3>{object.name}</h3>
                  <Badge variant="default">{object.object_type}</Badge>
                </div>
                {object.description && (
                  <p className={styles['object-card__description']}>{object.description}</p>
                )}
                <div className={styles['object-card__meta']}>
                  <span className={`${styles['object-card__status']} ${styles[`object-card__status--${object.status}`]}`}>
                    {object.status}
                  </span>
                  <span className={styles['object-card__date']}>
                    {new Date(object.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles['objects-list__pagination']}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← {t('common.actions.previous')}
              </Button>
              <span className={styles['objects-list__pagination-info']}>
                {t('common.pagination.page')} {page} {t('common.pagination.of')} {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('common.actions.next')} →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
