import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Card, Input, Select } from '@shared/components/ui';
export function ReportBuilderCard(props) {
    return (_jsxs(Card, { children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }, children: [_jsx(Select, { value: props.type, onChange: (e) => props.setType(e.target.value), options: [
                            { value: 'KPI', label: 'KPI' },
                            { value: 'PAYROLL', label: 'Payroll' },
                            { value: 'TASKS', label: 'Tasks' },
                        ] }), _jsx(Input, { type: "date", value: props.dateFrom, onChange: (e) => props.setDateFrom(e.target.value) }), _jsx(Input, { type: "date", value: props.dateTo, onChange: (e) => props.setDateTo(e.target.value) }), _jsx(Input, { placeholder: "User ID (optional)", value: props.userId, onChange: (e) => props.setUserId(e.target.value) }), _jsx(Input, { placeholder: "Team ID (optional)", value: props.teamId, onChange: (e) => props.setTeamId(e.target.value) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }, children: [_jsx(Button, { onClick: props.onGenerate, disabled: props.isPending, children: props.isPending ? 'Generating...' : 'Generate' }), _jsx(Button, { variant: "secondary", onClick: props.onExportCsv, disabled: props.isPending, children: "Export CSV" }), _jsx(Button, { variant: "secondary", onClick: props.onExportPdf, disabled: props.isPending, children: "Export PDF" })] })] }));
}
