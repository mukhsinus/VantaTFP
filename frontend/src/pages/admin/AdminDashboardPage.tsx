import React from 'react';
import { Link } from 'react-router-dom';

const card: React.CSSProperties = {
  display: 'block',
  padding: 20,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  fontWeight: 600,
  boxShadow: 'var(--shadow-xs)',
};

export function AdminDashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>Admin dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 560 }}>
          Platform scope only — tenant workspace (tasks, employees, billing per tenant) is not available here.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        <Link to="/admin/tenants" style={card}>
          Tenants
        </Link>
        <Link to="/admin/users" style={card}>
          Users
        </Link>
        <Link to="/admin/subscriptions" style={card}>
          Subscriptions
        </Link>
      </div>
    </div>
  );
}
