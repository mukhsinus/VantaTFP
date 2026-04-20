import React from 'react';
import { Button, Card, Input, Select } from '@shared/components/ui';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        <Select
          value={props.type}
          onChange={(e) => props.setType(e.target.value as ReportType)}
          options={[
            { value: 'KPI', label: t('reports.builder.types.kpi') },
            { value: 'PAYROLL', label: t('reports.builder.types.payroll') },
            { value: 'TASKS', label: t('reports.builder.types.tasks') },
          ]}
        />
        <Input type="date" value={props.dateFrom} onChange={(e) => props.setDateFrom(e.target.value)} />
        <Input type="date" value={props.dateTo} onChange={(e) => props.setDateTo(e.target.value)} />
        <Input placeholder={t('reports.builder.placeholders.userId')} value={props.userId} onChange={(e) => props.setUserId(e.target.value)} />
        <Input placeholder={t('reports.builder.placeholders.teamId')} value={props.teamId} onChange={(e) => props.setTeamId(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Button onClick={props.onGenerate} disabled={props.isPending}>
          {props.isPending ? t('reports.builder.actions.generating') : t('reports.builder.actions.generate')}
        </Button>
        <Button variant="secondary" onClick={props.onExportCsv} disabled={props.isPending}>
          {t('reports.builder.actions.exportCsv')}
        </Button>
        <Button variant="secondary" onClick={props.onExportPdf} disabled={props.isPending}>
          {t('reports.builder.actions.exportPdf')}
        </Button>
      </div>
    </Card>
  );
}
