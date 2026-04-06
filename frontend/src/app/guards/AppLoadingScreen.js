import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Shown while Zustand is rehydrating from localStorage.
 * Prevents any flash of protected content or /login redirect
 * before the stored session has been read.
 */
export function AppLoadingScreen() {
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            zIndex: 9999,
        }, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }, children: [_jsx("div", { style: {
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), _jsx("div", { style: {
                        width: 20,
                        height: 20,
                        border: '2px solid var(--color-border)',
                        borderTopColor: 'var(--color-accent)',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                    } }), _jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg) } }` })] }) }));
}
