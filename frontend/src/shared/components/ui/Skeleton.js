import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Skeleton({ width = '100%', height = 16, borderRadius = 'var(--radius-sm)', style }) {
    return (_jsx("div", { style: {
            width,
            height,
            borderRadius,
            background: 'linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            ...style,
        }, children: _jsx("style", { children: `@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }` }) }));
}
export function PageSkeleton() {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx(Skeleton, { height: 32, width: 200 }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }, children: [1, 2, 3].map((i) => (_jsx(Skeleton, { height: 96, borderRadius: "var(--radius-lg)" }, i))) }), _jsx(Skeleton, { height: 320, borderRadius: "var(--radius-lg)" })] }));
}
