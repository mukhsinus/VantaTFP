import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useExportReport, useGenerateReport, useReportHistory } from '@features/reports/hooks/useReports';
import { ReportBuilderCard } from '@features/reports/components/ReportBuilderCard';
const now = new Date();
const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
const defaultTo = now.toISOString().slice(0, 10);
export function ReportsPage() {
    const [type, setType] = useState('KPI');
    const [dateFrom, setDateFrom] = useState(defaultFrom);
    const [dateTo, setDateTo] = useState(defaultTo);
    const [userId, setUserId] = useState('');
    const [teamId, setTeamId] = useState('');
    const history = useReportHistory(type);
    const generate = useGenerateReport();
    const exportReport = useExportReport();
    const filters = useMemo(() => ({
        type,
        dateFrom: new Date(`${dateFrom}T00:00:00.000Z`).toISOString(),
        dateTo: new Date(`${dateTo}T23:59:59.999Z`).toISOString(),
        ...(userId.trim() ? { userId: userId.trim() } : {}),
        ...(teamId.trim() ? { teamId: teamId.trim() } : {}),
    }), [type, dateFrom, dateTo, userId, teamId]);
    const isBusy = generate.isPending || exportReport.isPending;
    return (_jsxs("div", { className: "page-container", style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: "Reports" }), _jsx("p", { style: { margin: '6px 0 0', color: 'var(--color-text-secondary)' }, children: "Generate KPI, payroll, and task reports with date/user/team filters." })] }), _jsx(ReportBuilderCard, { type: type, setType: setType, dateFrom: dateFrom, setDateFrom: setDateFrom, dateTo: dateTo, setDateTo: setDateTo, userId: userId, setUserId: setUserId, teamId: teamId, setTeamId: setTeamId, onGenerate: () => generate.mutate(filters), onExportCsv: () => exportReport.mutate({ ...filters, format: 'csv' }), onExportPdf: () => exportReport.mutate({ ...filters, format: 'pdf' }), isPending: isBusy }), _jsxs(Card, { children: [_jsxs("h3", { style: { marginTop: 0 }, children: ["Report History (", type, ")"] }), isBusy && (_jsx("p", { style: { margin: '0 0 10px', color: 'var(--color-accent)', fontSize: 'var(--text-sm)', fontWeight: 600 }, children: "Processing request..." })), generate.isError || exportReport.isError ? (_jsx(EmptyState, { title: "Action failed", description: "Please retry. The server rejected this report action." })) : null, history.isLoading ? (_jsx(PageSkeleton, {})) : history.isError ? (_jsx(EmptyState, { title: "Unable to load history", description: "Please try again later.", action: { label: 'Retry', onClick: () => void history.refetch() } })) : !history.data?.data?.length ? (_jsx(EmptyState, { title: "No reports yet", description: "Generate your first report." })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: history.data.data.map((item) => (_jsxs("div", { style: {
                                border: '1px solid var(--color-border)',
                                borderRadius: 10,
                                padding: 10,
                                background: 'var(--color-bg-subtle)',
                            }, children: [_jsxs("p", { style: { margin: 0, fontWeight: 600 }, children: [item.reportType, " \u2022 ", item.format] }), _jsxs("p", { style: { margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }, children: ["Generated at ", new Date(item.createdAt).toLocaleString()] })] }, item.id))) }))] })] }));
}
