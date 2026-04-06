import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthGuard } from './guards/AuthGuard';
import { SuperAdminGuard } from './guards/SuperAdminGuard';
import { LoginPage } from '@pages/login/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { EmployeesPage } from '@pages/employees/EmployeesPage';
import { KpiPage } from '@pages/kpi/KpiPage';
import { PayrollPage } from '@pages/payroll/PayrollPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
import { SuperAdminDashboard } from '@pages/superadmin/SuperAdminDashboard';

export const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ── Super Admin routes (exclusive, no sidebar layout) ────────────────────
  {
    path: '/superadmin',
    element: (
      <SuperAdminGuard>
        <SuperAdminDashboard />
      </SuperAdminGuard>
    ),
  },

  // ── Protected routes (AuthGuard → AppLayout → page) ──────────────────────
  {
    element: <AuthGuard />,       // handles hydration check + redirect
    children: [
      {
        path: '/',
        element: <AppLayout />,   // sidebar + topbar shell
        children: [
          { index: true,           element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard',     element: <DashboardPage /> },
          { path: 'tasks',         element: <TasksPage /> },
          { path: 'employees',     element: <EmployeesPage /> },
          { path: 'kpi',           element: <KpiPage /> },
          { path: 'payroll',       element: <PayrollPage /> },
          { path: 'settings',      element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── 404 fallback ──────────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
