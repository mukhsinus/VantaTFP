export type KpiPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface KpiApiDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  targetValue: number;
  unit: string;
  period: KpiPeriod;
  assigneeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiListApiDto {
  data: KpiApiDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface KpiAnalyticsEmployeeRowDto {
  userId: string;
  periodStart: string;
  periodEnd: string;
  completedTasks: number;
  onTimeCompletedTasks: number;
  overdueCompletedTasks: number;
  openOverdueTasks: number;
  performancePercent: number;
}

export interface KpiAnalyticsByEmployeeDto {
  periodStart: string;
  periodEnd: string;
  data: KpiAnalyticsEmployeeRowDto[];
}

export interface KpiAnalyticsAggregatedDto {
  periodStart: string;
  periodEnd: string;
  assigneeCount: number;
  completedTasks: number;
  onTimeCompletedTasks: number;
  overdueCompletedTasks: number;
  openOverdueTasks: number;
  performancePercent: number;
  filtersApplied: {
    userId: string | null;
    teamId: string | null;
  };
  fromCache: boolean;
}
