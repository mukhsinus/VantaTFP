import { useAuthStore } from '@app/store/auth.store';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface SuperAdminGuardProps {
  children: ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Check if user is authenticated and is a super admin
  const isSuperAdmin = isAuthenticated && user && (user as any)?.is_super_admin === true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>🔒 Access Denied</h1>
        <p>You do not have permission to access the super admin dashboard.</p>
        <p>This area is restricted to super administrators only.</p>
      </div>
    );
  }

  return <>{children}</>;
}
