import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCreateTask } from '../hooks/useCreateTask';
import type { CreateTaskPayload, TaskPriority } from '@entities/task/task.types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

interface FormErrors {
  title?: string;
}

const PRIORITY_OPTIONS: { value: TaskPriority; labelKey: string }[] = [
  { value: 'LOW',      labelKey: 'status.low' },
  { value: 'MEDIUM',   labelKey: 'status.medium' },
  { value: 'HIGH',     labelKey: 'status.high' },
  { value: 'CRITICAL', labelKey: 'status.critical' },
];

const INITIAL_STATE: FormState = {
  title:       '',
  description: '',
  priority:    'MEDIUM',
  dueDate:     '',
};

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { createTask, isPending } = useCreateTask();
  const priorityOptions = PRIORITY_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }));

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleClose = () => {
    setForm(INITIAL_STATE);
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) {
      newErrors.title = t('tasks.modal.errors.titleRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateTaskPayload = {
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      priority:    form.priority,
      dueDate:     form.dueDate
        ? new Date(form.dueDate).toISOString()
        : undefined,
    };

    try {
      await createTask(payload);
      handleClose();
    } catch {
      // Error toast is handled inside useCreateTask — nothing to do here
    }
  };

  const field = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('tasks.modal.title')}
      description={t('tasks.modal.description')}
      size={isMobile ? 'lg' : 'md'}
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto', gap: 8, width: isMobile ? '100%' : undefined }}>
          <Button variant="secondary" size={isMobile ? 'lg' : 'sm'} onClick={handleClose} disabled={isPending} style={{ width: '100%' }}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            variant="primary"
            size={isMobile ? 'lg' : 'sm'}
            loading={isPending}
            onClick={handleSubmit}
            style={{ width: '100%' }}
          >
            {t('tasks.modal.submit')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
        {/* Title */}
        <Input
          label={t('tasks.modal.fields.title')}
          placeholder={t('tasks.modal.placeholders.title')}
          value={form.title}
          onChange={(e) => field('title', e.target.value)}
          error={errors.title}
          autoFocus
        />

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {t('tasks.modal.fields.description')}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
            placeholder={t('tasks.modal.placeholders.description')}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              transition: 'border-color var(--transition)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-subtle)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-strong)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Priority + Due date row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <Select
            label={t('tasks.modal.fields.priority')}
            value={form.priority}
            options={priorityOptions}
            onChange={(e) => field('priority', e.target.value as TaskPriority)}
          />

          <Input
            label={t('tasks.modal.fields.dueDate')}
            type="date"
            value={form.dueDate}
            onChange={(e) => field('dueDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Hidden submit for Enter key support */}
        <button type="submit" style={{ display: 'none' }} aria-hidden />
      </form>
    </Modal>
  );
}
