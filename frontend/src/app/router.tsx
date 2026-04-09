import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { HomeRedirect } from './guards/HomeRedirect';
import { SuperAdminGuard } from './guards/SuperAdminGuard';
import { TenantRouteGuard } from './guards/TenantRouteGuard';
import { WildcardRedirect } from './guards/WildcardRedirect';
import { LoginPage } from '@pages/login/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { EmployeesPage } from '@pages/employees/EmployeesPage';
import { KpiPage } from '@pages/kpi/KpiPage';
import { PayrollPage } from '@pages/payroll/PayrollPage';
import { ReportsPage } from '@pages/reports/ReportsPage';
import { BillingPage } from '@pages/billing/BillingPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
import { AdminDashboardPage } from '@pages/admin/AdminDashboardPage';
import { AdminTenantsPage } from '@pages/admin/AdminTenantsPage';
import { AdminUsersPage } from '@pages/admin/AdminUsersPage';
import { AdminSubscriptionsPage } from '@pages/admin/AdminSubscriptionsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboardPage /> },
              { path: 'tenants', element: <AdminTenantsPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'subscriptions', element: <AdminSubscriptionsPage /> },
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
              { path: 'dashboard', element: <RoleGuard path="/dashboard"><DashboardPage /></RoleGuard> },
              { path: 'tasks', element: <RoleGuard path="/tasks"><TasksPage /></RoleGuard> },
              { path: 'employees', element: <RoleGuard path="/employees"><EmployeesPage /></RoleGuard> },
              { path: 'kpi', element: <RoleGuard path="/kpi"><KpiPage /></RoleGuard> },
              { path: 'payroll', element: <RoleGuard path="/payroll"><PayrollPage /></RoleGuard> },
              { path: 'reports', element: <RoleGuard path="/reports"><ReportsPage /></RoleGuard> },
              { path: 'billing', element: <RoleGuard path="/billing"><BillingPage /></RoleGuard> },
              { path: 'settings', element: <RoleGuard path="/settings"><SettingsPage /></RoleGuard> },
            ],
          },
        ],
      },

      { path: '*', element: <WildcardRedirect /> },
    ],
  },
]);
