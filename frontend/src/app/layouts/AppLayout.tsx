import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { ToastRenderer } from '@shared/components/Toast';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        <Topbar />
        <main
          style={{
            flex: 1,
            padding: 28,
            background: 'var(--color-bg-subtle)',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Global notification layer — lives outside page content */}
      <ToastRenderer />
    </div>
  );
}
