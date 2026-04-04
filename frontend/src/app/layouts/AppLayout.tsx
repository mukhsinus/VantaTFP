import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { MobileBottomTabs } from '@widgets/mobile-bottom-tabs/MobileBottomTabs';
import { ToastRenderer } from '@shared/components/Toast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSidebarStore } from '@app/store/sidebar.store';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const isMobile = useIsMobile();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  const sidebarWidth = !isMobile && isCollapsed ? 64 : !isMobile ? 224 : 0;

  return (
    <div className={styles.container}>
      {!isMobile && <Sidebar />}
      
      <div
        className={styles.mainWrapper}
        style={{
          marginLeft: sidebarWidth,
        }}
      >
        <Topbar />
        
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {isMobile && <MobileBottomTabs />}

      {/* Global notification layer — lives outside page content */}
      <ToastRenderer />
    </div>
  );
}
