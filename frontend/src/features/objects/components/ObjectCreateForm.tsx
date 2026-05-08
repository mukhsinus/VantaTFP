import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@shared/api/client';
import { Button, Input } from '@shared/components/ui';
import styles from '../objects.module.css';

interface ObjectCreateFormProps {
  onSuccess?: (object: any) => void;
  onCancel?: () => void;
}

export const ObjectCreateForm: React.FC<ObjectCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    object_type: 'equipment' as const,
    status: 'active' as const,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/api/v1/objects', data);
      return res.data;
    },
    onSuccess: (newObject) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      onSuccess?.(newObject);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(t('objects.labels.name') + ' ' + t('common.validation.required'));
      return;
    }
    createMutation.mutate(formData);
  };

  const objectTypes = ['equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other'];

  return (
    <div className={styles['create-form-wrapper']}>
      <h2 className={styles['create-form-title']}>
        {t('objects.actions.create')}
      </h2>

      <form onSubmit={handleSubmit} className={styles['create-form']}>
        <div className={styles['form-group']}>
          <label htmlFor="name">{t('objects.labels.name')} *</label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('objects.labels.name')}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="description">{t('objects.labels.description')}</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('objects.labels.description')}
            rows={3}
          />
        </div>

        <div className={styles['create-form-grid']}>
          <div className={styles['form-group']}>
            <label htmlFor="object_type">{t('objects.labels.type')} *</label>
            <select
              id="object_type"
              value={formData.object_type}
              onChange={(e) =>
                setFormData({ ...formData, object_type: e.target.value as any })
              }
            >
              {objectTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`objects.types.${type}` as any)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="status">{t('objects.labels.status')}</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
            >
              <option value="active">{t('objects.statuses.active')}</option>
              <option value="inactive">{t('objects.statuses.inactive')}</option>
              <option value="archived">{t('objects.statuses.archived')}</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createMutation.isPending}
          >
            {t('objects.actions.create')}
          </Button>
        </div>

        {createMutation.isError && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-danger)',
            fontSize: 'var(--text-sm)',
          }}>
            {t('objects.messages.failed')}
          </div>
        )}
      </form>
    </div>
  );
};
