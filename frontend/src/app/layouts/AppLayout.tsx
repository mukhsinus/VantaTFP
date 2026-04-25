import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { MobileBottomTabs } from '@widgets/mobile-bottom-tabs/MobileBottomTabs';
import { ToastRenderer } from '@shared/components/Toast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useAuthStore } from '@app/store/auth.store';
import { useNotificationsRealtime } from '@features/notifications/hooks/useNotifications';
import { TenantTrialExperience } from '@features/billing/components/TenantTrialExperience';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const isMobile = useIsMobile();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const user = useAuthStore((s) => s.user);
  useNotificationsRealtime();

  const sidebarWidth = !isMobile && isCollapsed ? 64 : !isMobile ? 224 : 0;

  return (
    <div className={styles.container}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!isMobile && <Sidebar />}
      
      <div
        className={styles.mainWrapper}
        style={{
          marginLeft: sidebarWidth,
        }}
      >
        <Topbar />
        
        <main id="main-content" className={styles.mainContent}>
          {user ? <TenantTrialExperience /> : null}
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomTabs />}

      {/* Global notification layer — lives outside page content */}
      <ToastRenderer />
    </div>
  );
}
