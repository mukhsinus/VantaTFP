export type ReportType = 'KPI' | 'PAYROLL' | 'TASKS';
export type ReportFormat = 'json' | 'csv' | 'pdf';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  userId?: string;
  teamId?: string;
}

export interface ReportRowDto {
  userId: string;
  userName: string;
  completedTasks: number;
  overdueTasks: number;
  performancePercent: number;
  baseAmount?: number;
  bonusAmount?: number;
  totalAmount?: number;
}

export interface GeneratedReportDto {
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  filters: { userId?: string; teamId?: string };
  rowCount: number;
  rows: ReportRowDto[];
}

export interface GenerateReportResponseDto {
  report: GeneratedReportDto;
  historyId: string;
}

export interface ReportHistoryItemDto {
  id: string;
  reportType: ReportType;
  format: 'JSON' | 'CSV' | 'PDF';
  filters: Record<string, unknown>;
  payload: Record<string, unknown>;
  generatedBy: string;
  createdAt: string;
}

export interface ReportHistoryListDto {
  data: ReportHistoryItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}
