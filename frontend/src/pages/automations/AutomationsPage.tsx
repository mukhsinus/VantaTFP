import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Button, Skeleton } from '@shared/components/ui';
import { useAutomations, useCreateAutomation, useDeleteAutomation } from '@features/automations/hooks/useAutomations';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { AutomationApiDto } from '@entities/automation/automation.types';

const TRIGGER_TYPES = ['status_change', 'assignment', 'due_date_passed', 'field_change'] as const;
const ACTION_TYPES = ['change_status', 'assign_user', 'send_notification', 'create_task'] as const;

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
  const [formTrigger, setFormTrigger] = useState<string>(TRIGGER_TYPES[0]);
  const [formAction, setFormAction] = useState<string>(ACTION_TYPES[0]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={32} width={200} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} borderRadius="var(--radius-lg)" />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('automations.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('automations.subtitle')}
          </p>
        </div>
        {can('tenant:manage') && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            {t('automations.create')}
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
          <input
            type="text"
            placeholder={t('automations.fields.name')}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'var(--color-bg)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
            }}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                {t('automations.fields.trigger')}
              </label>
              <select
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                }}
              >
                {TRIGGER_TYPES.map((tr) => (
                  <option key={tr} value={tr}>{t(`automations.triggers.${tr}`)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                {t('automations.fields.action')}
              </label>
              <select
                value={formAction}
                onChange={(e) => setFormAction(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                }}
              >
                {ACTION_TYPES.map((ac) => (
                  <option key={ac} value={ac}>{t(`automations.actions.${ac}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={createAutomation.isPending}>
              {t('common.actions.create')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </div>
      )}

      {automations.length === 0 ? (
        <EmptyState
          title={t('automations.empty.title')}
          description={t('automations.empty.description')}
          action={can('tenant:manage') ? { label: t('automations.create'), onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 12 }}>
          {automations.map((rule: AutomationApiDto) => (
            <div
              key={rule.id}
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {rule.name}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {t(`automations.triggers.${rule.triggerType}`)} → {t(`automations.actions.${rule.actionType}`)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  background: rule.active ? 'var(--color-success-bg, #dcfce7)' : 'var(--color-bg-muted)',
                  color: rule.active ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)',
                }}>
                  {rule.active ? t('automations.active') : t('automations.inactive')}
                </span>
                {can('tenant:manage') && (
                  <button
                    onClick={() => deleteAutomation.mutate(rule.id)}
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
