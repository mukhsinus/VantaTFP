import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { HomeRedirect } from './guards/HomeRedirect';
import { LoginPage } from '@pages/login/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { EmployeesPage } from '@pages/employees/EmployeesPage';
import { KpiPage } from '@pages/kpi/KpiPage';
import { PayrollPage } from '@pages/payroll/PayrollPage';
import { ReportsPage } from '@pages/reports/ReportsPage';
import { BillingPage } from '@pages/billing/BillingPage';
import { SettingsPage } from '@pages/settings/SettingsPage';

export const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ── Protected routes (AuthGuard → AppLayout → page) ──────────────────────
  {
    element: <AuthGuard />,       // handles hydration check + redirect
    children: [
      {
        path: '/',
        element: <AppLayout />,   // sidebar + topbar shell
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

  // ── 404 fallback ──────────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/tasks" replace />,
  },
]);
