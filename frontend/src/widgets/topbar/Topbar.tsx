import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Avatar, Badge } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';

const pageTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/tasks': 'nav.tasks',
  '/employees': 'nav.employees',
  '/kpi': 'nav.kpi',
  '/payroll': 'nav.payroll',
  '/settings': 'nav.settings',
};

const roleVariant: Record<string, 'accent' | 'warning' | 'success'> = {
  ADMIN: 'danger' as never,
  MANAGER: 'warning',
  EMPLOYEE: 'success',
};

export function Topbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');

  const baseRoute = '/' + location.pathname.split('/')[1];
  const titleKey = pageTitles[baseRoute] ?? 'nav.dashboard';

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-topbar)' as React.CSSProperties['zIndex'],
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          flexShrink: 0,
        }}
      >
        {t(titleKey)}
      </h1>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            placeholder={t('topbar.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 32,
              padding: '0 12px 0 32px',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              outline: 'none',
              transition: 'border-color var(--transition), background var(--transition)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.background = 'var(--color-bg)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-subtle)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-bg-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <kbd
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              background: 'var(--color-bg-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '1px 4px',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Notifications bell */}
        <button
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-danger)',
              border: '1.5px solid var(--color-bg)',
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

        {/* User */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {user.firstName} {user.lastName}
              </p>
              <Badge variant={roleVariant[user.role] ?? 'default'} style={{ fontSize: 10, padding: '1px 6px' }}>
                {user.role}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
