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
