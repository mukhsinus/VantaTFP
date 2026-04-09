import React from 'react';
import { Button, Card, Input, Select } from '@shared/components/ui';
import type { ReportType } from '@entities/reports/reports.types';

interface Props {
  type: ReportType;
  setType: (value: ReportType) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  userId: string;
  setUserId: (value: string) => void;
  teamId: string;
  setTeamId: (value: string) => void;
  onGenerate: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  isPending: boolean;
}

export function ReportBuilderCard(props: Props) {
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        <Select
          value={props.type}
          onChange={(e) => props.setType(e.target.value as ReportType)}
          options={[
            { value: 'KPI', label: 'KPI' },
            { value: 'PAYROLL', label: 'Payroll' },
            { value: 'TASKS', label: 'Tasks' },
          ]}
        />
        <Input type="date" value={props.dateFrom} onChange={(e) => props.setDateFrom(e.target.value)} />
        <Input type="date" value={props.dateTo} onChange={(e) => props.setDateTo(e.target.value)} />
        <Input placeholder="User ID (optional)" value={props.userId} onChange={(e) => props.setUserId(e.target.value)} />
        <Input placeholder="Team ID (optional)" value={props.teamId} onChange={(e) => props.setTeamId(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Button onClick={props.onGenerate} disabled={props.isPending}>
          {props.isPending ? 'Generating...' : 'Generate'}
        </Button>
        <Button variant="secondary" onClick={props.onExportCsv} disabled={props.isPending}>
          Export CSV
        </Button>
        <Button variant="secondary" onClick={props.onExportPdf} disabled={props.isPending}>
          Export PDF
        </Button>
      </div>
    </Card>
  );
}
