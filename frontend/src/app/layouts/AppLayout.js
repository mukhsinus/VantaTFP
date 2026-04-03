import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { ToastRenderer } from '@shared/components/Toast';
export function AppLayout() {
    return (_jsxs("div", { style: { display: 'flex', minHeight: '100vh' }, children: [_jsx(Sidebar, {}), _jsxs("div", { style: {
                    marginLeft: 'var(--sidebar-width)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    minWidth: 0,
                }, children: [_jsx(Topbar, {}), _jsx("main", { style: {
                            flex: 1,
                            padding: 28,
                            background: 'var(--color-bg-subtle)',
                        }, children: _jsx(Outlet, {}) })] }), _jsx(ToastRenderer, {})] }));
}
