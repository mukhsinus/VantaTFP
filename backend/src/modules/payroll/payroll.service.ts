import { PayrollRepository } from './payroll.repository.js';
import { CreatePayrollEntryDto, UpdatePayrollEntryDto, ListPayrollQuery } from './payroll.schema.js';

export class PayrollService {
  constructor(private readonly payrollRepository: PayrollRepository) {}

  async listPayrollEntries(_tenantId: string, _query: ListPayrollQuery) {
    throw new Error('Not implemented');
  }

  async getPayrollEntryById(_payrollId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }

  async createPayrollEntry(_tenantId: string, _data: CreatePayrollEntryDto) {
    throw new Error('Not implemented');
  }

  async updatePayrollEntry(
    _payrollId: string,
    _tenantId: string,
    _data: UpdatePayrollEntryDto
  ) {
    throw new Error('Not implemented');
  }

  async approvePayrollEntry(
    _payrollId: string,
    _tenantId: string,
    _approvedByUserId: string
  ) {
    throw new Error('Not implemented');
  }
}
