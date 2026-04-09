import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(LoginPage, {}),
    },
    {
        element: _jsx(AuthGuard, {}),
        children: [
            {
                path: 'admin',
                element: _jsx(SuperAdminGuard, {}),
                children: [
                    {
                        element: _jsx(AdminLayout, {}),
                        children: [
                            { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) },
                            { path: 'dashboard', element: _jsx(AdminDashboardPage, {}) },
                            { path: 'tenants', element: _jsx(AdminTenantsPage, {}) },
                            { path: 'users', element: _jsx(AdminUsersPage, {}) },
                            { path: 'subscriptions', element: _jsx(AdminSubscriptionsPage, {}) },
                        ],
                    },
                ],
            },
            {
                element: _jsx(TenantRouteGuard, {}),
                children: [
                    {
                        element: _jsx(AppLayout, {}),
                        children: [
                            { index: true, element: _jsx(HomeRedirect, {}) },
                            { path: 'dashboard', element: _jsx(RoleGuard, { path: "/dashboard", children: _jsx(DashboardPage, {}) }) },
                            { path: 'tasks', element: _jsx(RoleGuard, { path: "/tasks", children: _jsx(TasksPage, {}) }) },
                            { path: 'employees', element: _jsx(RoleGuard, { path: "/employees", children: _jsx(EmployeesPage, {}) }) },
                            { path: 'kpi', element: _jsx(RoleGuard, { path: "/kpi", children: _jsx(KpiPage, {}) }) },
                            { path: 'payroll', element: _jsx(RoleGuard, { path: "/payroll", children: _jsx(PayrollPage, {}) }) },
                            { path: 'reports', element: _jsx(RoleGuard, { path: "/reports", children: _jsx(ReportsPage, {}) }) },
                            { path: 'billing', element: _jsx(RoleGuard, { path: "/billing", children: _jsx(BillingPage, {}) }) },
                            { path: 'settings', element: _jsx(RoleGuard, { path: "/settings", children: _jsx(SettingsPage, {}) }) },
                        ],
                    },
                ],
            },
            { path: '*', element: _jsx(WildcardRedirect, {}) },
        ],
    },
]);
