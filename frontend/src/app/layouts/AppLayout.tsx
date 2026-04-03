import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { MobileBottomTabs } from '@widgets/mobile-bottom-tabs/MobileBottomTabs';
import { ToastRenderer } from '@shared/components/Toast';
import { useIsMobile } from '@shared/hooks/useIsMobile';

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <div
        style={{
          marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
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
            padding: isMobile ? 12 : 28,
            paddingBottom: isMobile ? 86 : 28,
            background: 'var(--color-bg-subtle)',
          }}
        >
          <Outlet />
        </main>
      </div>

      {isMobile && <MobileBottomTabs />}

      {/* Global notification layer — lives outside page content */}
      <ToastRenderer />
    </div>
  );
}
