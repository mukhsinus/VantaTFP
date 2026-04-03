import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Input, EmptyState } from '@shared/components/ui';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
  tasksCount: number;
}

const mockEmployees: Employee[] = [
  { id: '1', firstName: 'Sofia', lastName: 'Chen', email: 'sofia@example.com', role: 'MANAGER', department: 'Engineering', status: 'active', joinDate: 'Jan 2024', tasksCount: 12 },
  { id: '2', firstName: 'James', lastName: 'Park', email: 'james@example.com', role: 'EMPLOYEE', department: 'Design', status: 'active', joinDate: 'Mar 2024', tasksCount: 7 },
  { id: '3', firstName: 'Amara', lastName: 'Diallo', email: 'amara@example.com', role: 'EMPLOYEE', department: 'Operations', status: 'active', joinDate: 'Feb 2023', tasksCount: 5 },
  { id: '4', firstName: 'Luca', lastName: 'Ferrari', email: 'luca@example.com', role: 'MANAGER', department: 'Sales', status: 'active', joinDate: 'Nov 2023', tasksCount: 9 },
  { id: '5', firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', role: 'EMPLOYEE', department: 'Finance', status: 'inactive', joinDate: 'Jun 2022', tasksCount: 0 },
  { id: '6', firstName: 'Alex', lastName: 'Kim', email: 'alex@example.com', role: 'ADMIN', department: 'Management', status: 'active', joinDate: 'Jan 2022', tasksCount: 4 },
];

const roleVariant: Record<Role, 'danger' | 'warning' | 'success'> = {
  ADMIN: 'danger',
  MANAGER: 'warning',
  EMPLOYEE: 'success',
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  const filtered = mockEmployees.filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.department}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('employees.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {mockEmployees.filter((e) => e.status === 'active').length} {t('employees.active')}
            {' · '}
            {mockEmployees.length} {t('employees.total')}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          {t('employees.invite')}
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <Input
            placeholder={t('employees.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            }
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '5px 12px',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                background: roleFilter === r ? 'var(--color-accent)' : 'var(--color-bg)',
                color: roleFilter === r ? '#fff' : 'var(--color-text-secondary)',
                borderColor: roleFilter === r ? 'var(--color-accent)' : 'var(--color-border-strong)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Employee grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={t('employees.empty.title')}
          description={t('employees.empty.description')}
          action={{ label: t('employees.invite'), onClick: () => {} }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const { t } = useTranslation();
  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition), border-color var(--transition)',
        boxShadow: 'var(--shadow-xs)',
        opacity: employee.status === 'inactive' ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={fullName} size="md" />
          <div>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {fullName}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 1 }}>
              {employee.department}
            </p>
          </div>
        </div>
        <Badge variant={roleVariant[employee.role]}>{employee.role}</Badge>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {employee.email}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('employees.card.tasks')}</p>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {employee.tasksCount}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('employees.card.joined')}</p>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {employee.joinDate}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('employees.card.status')}</p>
          <Badge variant={employee.status === 'active' ? 'success' : 'default'} dot>
            {employee.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
