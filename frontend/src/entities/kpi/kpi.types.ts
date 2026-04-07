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
