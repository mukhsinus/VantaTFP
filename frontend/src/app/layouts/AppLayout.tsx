import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { ToastRenderer } from '@shared/components/Toast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useAuthStore } from '@app/store/auth.store';
import { useNotificationsRealtime } from '@features/notifications/hooks/useNotifications';
import { TenantTrialExperience } from '@features/billing/components/TenantTrialExperience';
import { MobileBottomTabs } from '@widgets/mobile-bottom-tabs/MobileBottomTabs';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  useNotificationsRealtime();

  const sidebarWidth = !isMobile ? 260 : 0;

  return (
    <div className={styles.container}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      
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

      {isMobile && user ? <MobileBottomTabs /> : null}

      {/* Global notification layer — lives outside page content */}
      <ToastRenderer />
    </div>
  );
}
