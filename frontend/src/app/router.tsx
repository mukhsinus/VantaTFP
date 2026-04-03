import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { EmployeesPage } from '@pages/employees/EmployeesPage';
import { KpiPage } from '@pages/kpi/KpiPage';
import { PayrollPage } from '@pages/payroll/PayrollPage';
import { SettingsPage } from '@pages/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'kpi', element: <KpiPage /> },
      { path: 'payroll', element: <PayrollPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
