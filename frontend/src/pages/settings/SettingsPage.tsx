import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, Badge, Card, CardHeader, Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type SettingsSection = 'profile' | 'workspace' | 'notifications' | 'security';

export function SettingsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialSection: SettingsSection =
    tabParam === 'workspace' || tabParam === 'notifications' || tabParam === 'security'
      ? tabParam
      : 'profile';

  const [section, setSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    const nextSection: SettingsSection =
      tabParam === 'workspace' || tabParam === 'notifications' || tabParam === 'security'
        ? tabParam
        : 'profile';
    setSection(nextSection);
  }, [tabParam]);

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: t('settings.section.profile'),
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
    },
    {
      id: 'workspace',
      label: t('settings.section.workspace'),
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    },
    {
      id: 'notifications',
      label: t('settings.section.notifications'),
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
    },
    {
      id: 'security',
      label: t('settings.section.security'),
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 24, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {t('settings.title')}
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {isMobile ? (
        <>
          {/* Mobile tabs */}
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              boxSizing: 'border-box',
              paddingBottom: 2,
            }}
          >
            <div style={{ display: 'flex', gap: 8, width: 'max-content', minWidth: '100%' }}>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSection(s.id);
                    setSearchParams({ tab: s.id });
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: section === s.id ? 'var(--color-accent)' : 'var(--color-border-strong)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    background: section === s.id ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: section === s.id ? '#fff' : 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: '100%' }}>
            {section === 'profile' && <ProfileSection isMobile />}
            {section === 'workspace' && <WorkspaceSection isMobile />}
            {section === 'notifications' && <NotificationsSection isMobile />}
            {section === 'security' && <SecuritySection isMobile />}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Sidebar nav */}
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  setSearchParams({ tab: s.id });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: section === s.id ? 500 : 400,
                  background: section === s.id ? 'var(--color-accent-subtle)' : 'transparent',
                  color: section === s.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  textAlign: 'left',
                  transition: 'background var(--transition), color var(--transition)',
                }}
                onMouseEnter={(e) => {
                  if (section !== s.id) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-muted)';
                }}
                onMouseLeave={(e) => {
                  if (section !== s.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ width: '100%', maxWidth: '100%' }}>
            {section === 'profile' && <ProfileSection isMobile={false} />}
            {section === 'workspace' && <WorkspaceSection isMobile={false} />}
            {section === 'notifications' && <NotificationsSection isMobile={false} />}
            {section === 'security' && <SecuritySection isMobile={false} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ isMobile }: { isMobile: boolean }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader title={t('settings.profile.title')} subtitle={t('settings.profile.subtitle')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user ? `${user.firstName} ${user.lastName}` : 'U'} size="lg" />
          <div>
            <Button variant="secondary" size="sm">{t('settings.profile.changeAvatar')}</Button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {t('settings.profile.avatarHint')}
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, width: '100%' }}>
          <Input label={t('settings.profile.firstName')} defaultValue={user?.firstName} />
          <Input label={t('settings.profile.lastName')} defaultValue={user?.lastName} />
        </div>
        <Input label={t('settings.profile.email')} defaultValue={user?.email} type="email" />
        <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button variant="secondary" size="sm" style={isMobile ? { width: '100%', minHeight: 44 } : undefined}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" style={isMobile ? { width: '100%', minHeight: 44 } : undefined}>{t('common.save')}</Button>
        </div>
      </div>
    </Card>
  );
}

function WorkspaceSection({ isMobile }: { isMobile: boolean }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader title={t('settings.workspace.title')} subtitle={t('settings.workspace.subtitle')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%' }}>
        <Input label={t('settings.workspace.name')} defaultValue={user?.tenantName} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 0,
            padding: '14px 0',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {t('settings.workspace.plan')}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {t('settings.workspace.planDescription')}
            </p>
          </div>
          <Badge variant="accent">{t('settings.workspace.proPlan')}</Badge>
        </div>
        <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
          <Button variant="primary" size="sm" style={isMobile ? { width: '100%', minHeight: 44 } : undefined}>{t('common.save')}</Button>
        </div>
      </div>
    </Card>
  );
}

function NotificationsSection({ isMobile }: { isMobile: boolean }) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState({
    taskOverdue: true,
    taskAssigned: true,
    kpiUpdate: false,
    payrollApproval: true,
  });

  return (
    <Card>
      <CardHeader title={t('settings.notifications.title')} subtitle={t('settings.notifications.subtitle')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', maxWidth: '100%' }}>
        {(Object.keys(prefs) as Array<keyof typeof prefs>).map((key, i, arr) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: '14px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ minWidth: 0, paddingRight: isMobile ? 8 : 0 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                {t(`settings.notifications.${key}`)}
              </p>
            </div>
            <ToggleSwitch
              checked={prefs[key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecuritySection({ isMobile }: { isMobile: boolean }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('settings.security.title')} subtitle={t('settings.security.subtitle')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%' }}>
        <Input label={t('settings.security.currentPassword')} type="password" placeholder="••••••••" />
        <Input label={t('settings.security.newPassword')} type="password" placeholder="••••••••" />
        <Input label={t('settings.security.confirmPassword')} type="password" placeholder="••••••••" />
        <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
          <Button variant="primary" size="sm" style={isMobile ? { width: '100%', minHeight: 44 } : undefined}>{t('settings.security.update')}</Button>
        </div>
      </div>
    </Card>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 'var(--radius-full)',
        background: checked ? 'var(--color-accent)' : 'var(--color-gray-300)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background var(--transition)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left var(--transition)',
        }}
      />
    </button>
  );
}
