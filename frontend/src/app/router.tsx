import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { HomeRedirect } from './guards/HomeRedirect';
import { SuperAdminGuard } from './guards/SuperAdminGuard';
import { TenantRouteGuard } from './guards/TenantRouteGuard';
import { WildcardRedirect } from './guards/WildcardRedirect';
import { AppLoadingScreen } from './guards/AppLoadingScreen';

const LoginPage = lazy(() => import('@pages/login/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('@pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const TasksPage = lazy(() => import('@pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage })));
const EmployeesPage = lazy(() =>
  import('@pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage }))
);
const KpiPage = lazy(() => import('@pages/kpi/KpiPage').then((m) => ({ default: m.KpiPage })));
const PayrollPage = lazy(() =>
  import('@pages/payroll/PayrollPage').then((m) => ({ default: m.PayrollPage }))
);
const ReportsPage = lazy(() =>
  import('@pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const BillingPage = lazy(() =>
  import('@pages/billing/BillingPage').then((m) => ({ default: m.BillingPage }))
);
const SettingsPage = lazy(() =>
  import('@pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AdminDashboardPage = lazy(() =>
  import('@pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminTenantsPage = lazy(() =>
  import('@pages/admin/AdminTenantsPage').then((m) => ({ default: m.AdminTenantsPage }))
);
const AdminUsersPage = lazy(() =>
  import('@pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminSubscriptionsPage = lazy(() =>
  import('@pages/admin/AdminSubscriptionsPage').then((m) => ({ default: m.AdminSubscriptionsPage }))
);
const AdminPaymentsPage = lazy(() =>
  import('@pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage }))
);
const MessagesPage = lazy(() =>
  import('@pages/messages/MessagesPage').then((m) => ({ default: m.MessagesPage }))
);

function withPageLoader(node: React.ReactNode) {
  return <Suspense fallback={<AppLoadingScreen />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withPageLoader(<LoginPage />),
  },

  {
    element: <AuthGuard />,
    children: [
      {
        path: 'admin',
        element: <SuperAdminGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="payments" replace /> },
              { path: 'payments', element: withPageLoader(<AdminPaymentsPage />) },
              { path: 'dashboard', element: withPageLoader(<AdminDashboardPage />) },
              { path: 'tenants', element: withPageLoader(<AdminTenantsPage />) },
              { path: 'users', element: withPageLoader(<AdminUsersPage />) },
              { path: 'subscriptions', element: withPageLoader(<AdminSubscriptionsPage />) },
            ],
          },
        ],
      },

      {
        element: <TenantRouteGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              {
                path: 'dashboard',
                element: <RoleGuard path="/dashboard">{withPageLoader(<DashboardPage />)}</RoleGuard>,
              },
              {
                path: 'tasks',
                element: <RoleGuard path="/tasks">{withPageLoader(<TasksPage />)}</RoleGuard>,
              },
              {
                path: 'employees',
                element: <RoleGuard path="/employees">{withPageLoader(<EmployeesPage />)}</RoleGuard>,
              },
              {
                path: 'kpi',
                element: <RoleGuard path="/kpi">{withPageLoader(<KpiPage />)}</RoleGuard>,
              },
              {
                path: 'payroll',
                element: <RoleGuard path="/payroll">{withPageLoader(<PayrollPage />)}</RoleGuard>,
              },
              {
                path: 'reports',
                element: <RoleGuard path="/reports">{withPageLoader(<ReportsPage />)}</RoleGuard>,
              },
              {
                path: 'billing',
                element: <RoleGuard path="/billing">{withPageLoader(<BillingPage />)}</RoleGuard>,
              },
              {
                path: 'settings',
                element: <RoleGuard path="/settings">{withPageLoader(<SettingsPage />)}</RoleGuard>,
              },
              {
                path: 'messages',
                element: <RoleGuard path="/messages">{withPageLoader(<MessagesPage />)}</RoleGuard>,
              },
            ],
          },
        ],
      },

      { path: '*', element: <WildcardRedirect /> },
    ],
  },
]);
