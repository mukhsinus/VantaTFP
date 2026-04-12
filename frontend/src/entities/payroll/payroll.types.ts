export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface PayrollApiDto {
  id: string;
  tenantId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  notes: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollListApiDto {
  data: PayrollApiDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface PayrollRuleDto {
  id: string;
  tenantId: string;
  name: string;
  type: 'fixed' | 'per_task' | 'kpi_based';
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyPayrollRuleResponseDto {
  ruleId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  breakdown: Record<string, unknown>;
  payment: {
    base: number;
    bonus: number;
    total: number;
  };
}
