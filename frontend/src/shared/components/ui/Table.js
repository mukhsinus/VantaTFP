import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export function Table({ columns, data, keyExtractor, onRowClick, loading = false, emptyState, }) {
    return (_jsx("div", { style: {
            overflowX: 'auto',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
        }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: {
                            background: 'var(--color-bg-subtle)',
                            borderBottom: '1px solid var(--color-border)',
                        }, children: columns.map((col) => (_jsx("th", { style: {
                                padding: '10px 16px',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                color: 'var(--color-text-secondary)',
                                textAlign: col.align ?? 'left',
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                                width: col.width,
                                whiteSpace: 'nowrap',
                            }, children: col.header }, col.key))) }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: _jsx(TableSkeleton, { rows: 5, cols: columns.length }) }) })) : data.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, style: { padding: '48px 16px', textAlign: 'center' }, children: emptyState ?? _jsx(DefaultEmptyState, {}) }) })) : (data.map((row, index) => (_jsx("tr", { onClick: () => onRowClick?.(row), style: {
                            borderBottom: '1px solid var(--color-border)',
                            cursor: onRowClick ? 'pointer' : undefined,
                            transition: 'background var(--transition-fast)',
                        }, onMouseEnter: (e) => {
                            if (onRowClick)
                                e.currentTarget.style.background = 'var(--color-bg-subtle)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.background = 'transparent';
                        }, children: columns.map((col) => (_jsx("td", { style: {
                                padding: '12px 16px',
                                fontSize: 'var(--text-base)',
                                color: 'var(--color-text-primary)',
                                textAlign: col.align ?? 'left',
                                verticalAlign: 'middle',
                            }, children: col.render
                                ? col.render(row, index)
                                : String(row[col.key] ?? '—') }, col.key))) }, keyExtractor(row, index))))) })] }) }));
}
function DefaultEmptyState() {
    const { t } = useTranslation();
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }, children: [_jsx("div", { style: {
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-gray-400)", strokeWidth: 1.5, children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M9 9h.01M15 9h.01M9 15h6" })] }) }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }, children: t('common.emptyState.title') }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: t('common.emptyState.description') })] }));
}
function TableSkeleton({ rows, cols }) {
    return (_jsx("div", { style: { padding: '0 16px' }, children: Array.from({ length: rows }).map((_, r) => (_jsx("div", { style: {
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 12,
                padding: '14px 0',
                borderBottom: '1px solid var(--color-border)',
            }, children: Array.from({ length: cols }).map((_, c) => (_jsx(SkeletonLine, { width: c === 0 ? '60%' : '80%' }, c))) }, r))) }));
}
export function SkeletonLine({ width = '100%', height = 14 }) {
    return (_jsx("div", { style: {
            width,
            height,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
        }, children: _jsx("style", { children: `@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }` }) }));
}
