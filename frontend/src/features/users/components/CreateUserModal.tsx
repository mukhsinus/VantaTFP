import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '@shared/components/ui';
import type { Role } from '@shared/types/auth.types';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCreateUser } from '../hooks/useCreateUser';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorRole: Role;
}

interface FormState {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
}

const INITIAL_FORM: FormState = {
  email: '',
  password: '',
  role: 'EMPLOYEE',
  firstName: '',
  lastName: '',
};

export function CreateUserModal({ isOpen, onClose, creatorRole }: CreateUserModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { createUser, isPending } = useCreateUser();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(() => {
    if (creatorRole === 'MANAGER') {
      return [{ value: 'EMPLOYEE', label: t('profile.roles.employee') }];
    }
    return [
      { value: 'ADMIN', label: t('profile.roles.admin') },
      { value: 'MANAGER', label: t('profile.roles.manager') },
      { value: 'EMPLOYEE', label: t('profile.roles.employee') },
    ];
  }, [creatorRole, t]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setError(null);
    onClose();
  };

  const validate = (): boolean => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t('employees.modal.errors.nameRequired'));
      return false;
    }
    if (!form.email.trim()) {
      setError(t('employees.modal.errors.emailRequired'));
      return false;
    }
    if (form.password.length < 8) {
      setError(t('employees.modal.errors.passwordShort'));
      return false;
    }
    if (creatorRole === 'MANAGER' && form.role !== 'EMPLOYEE') {
      setError(t('employees.modal.errors.managerRole'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createUser({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      handleClose();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('employees.modal.title')}
      description={t('employees.modal.description')}
      size={isMobile ? 'lg' : 'md'}
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto', gap: 8, width: isMobile ? '100%' : undefined }}>
          <Button variant="secondary" size={isMobile ? 'lg' : 'sm'} onClick={handleClose} disabled={isPending} style={{ width: '100%' }}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" size={isMobile ? 'lg' : 'sm'} onClick={handleSubmit} loading={isPending} style={{ width: '100%' }}>
            {t('employees.modal.submit')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }}>
        {error && (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-danger)',
              background: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius)',
              padding: '8px 10px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          <Input
            label={t('employees.modal.fields.firstName')}
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
          />
          <Input
            label={t('employees.modal.fields.lastName')}
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
          />
        </div>

        <Input
          label={t('employees.modal.fields.email')}
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
        />

        <Input
          label={t('employees.modal.fields.password')}
          type="password"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
        />

        <Select
          label={t('employees.modal.fields.role')}
          value={form.role}
          onChange={(e) => setField('role', e.target.value as Role)}
          options={roleOptions}
        />
      </form>
    </Modal>
  );
}
