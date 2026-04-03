import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthGuard } from './guards/AuthGuard';
import { LoginPage } from '@pages/login/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { EmployeesPage } from '@pages/employees/EmployeesPage';
import { KpiPage } from '@pages/kpi/KpiPage';
import { PayrollPage } from '@pages/payroll/PayrollPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
export const router = createBrowserRouter([
    // ── Public routes ────────────────────────────────────────────────────────
    {
        path: '/login',
        element: _jsx(LoginPage, {}),
    },
    // ── Protected routes (AuthGuard → AppLayout → page) ──────────────────────
    {
        element: _jsx(AuthGuard, {}), // handles hydration check + redirect
        children: [
            {
                path: '/',
                element: _jsx(AppLayout, {}), // sidebar + topbar shell
                children: [
                    { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) },
                    { path: 'dashboard', element: _jsx(DashboardPage, {}) },
                    { path: 'tasks', element: _jsx(TasksPage, {}) },
                    { path: 'employees', element: _jsx(EmployeesPage, {}) },
                    { path: 'kpi', element: _jsx(KpiPage, {}) },
                    { path: 'payroll', element: _jsx(PayrollPage, {}) },
                    { path: 'settings', element: _jsx(SettingsPage, {}) },
                ],
            },
        ],
    },
    // ── 404 fallback ──────────────────────────────────────────────────────────
    {
        path: '*',
        element: _jsx(Navigate, { to: "/dashboard", replace: true }),
    },
]);
