import { ApplicationError } from '../../shared/utils/application-error.js';
import type { SystemRole, TenantRole } from '../../shared/types/common.types.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';
import type {
  ExportReportInput,
  GenerateReportInput,
  ListReportHistoryQuery,
} from './reports.schema.js';
import { ReportsRepository } from './reports.repository.js';

interface ReportRow {
  userId: string;
  userName: string;
  completedTasks: number;
  overdueTasks: number;
  performancePercent: number;
  baseAmount?: number;
  bonusAmount?: number;
  totalAmount?: number;
}

export interface GeneratedReport {
  type: 'KPI' | 'PAYROLL' | 'TASKS';
  dateFrom: string;
  dateTo: string;
  filters: { userId?: string; teamId?: string };
  rowCount: number;
  rows: ReportRow[];
}

export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async generateReport(
    tenantId: string,
    actor: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole },
    input: GenerateReportInput,
    storeAs: 'JSON' | 'CSV' | 'PDF' = 'JSON'
  ): Promise<{ report: GeneratedReport; historyId: string }> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const { from, to } = this.parseRange(input.dateFrom, input.dateTo);
    const filters = await this.applyAccessControl(tenantId, actor, {
      userId: input.userId,
      teamId: input.teamId,
    });

    const assigneeIds = await this.reportsRepository.resolveAssigneeIds(tenantId, filters);
    const users = await this.reportsRepository.findUsersByIds(tenantId, assigneeIds);
    const userById = new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]));

    const rows =
      input.type === 'KPI'
        ? await this.buildKpiRows(tenantId, assigneeIds, from, to, userById)
        : input.type === 'PAYROLL'
          ? await this.buildPayrollRows(tenantId, assigneeIds, from, to, userById)
          : await this.buildTaskRows(tenantId, assigneeIds, from, to, userById);

    const report: GeneratedReport = {
      type: input.type,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      filters,
      rowCount: rows.length,
      rows,
    };

    const history = await this.reportsRepository.insertHistory({
      tenantId,
      reportType: input.type,
      format: storeAs,
      filters: {
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        ...filters,
      },
      payload: {
        rowCount: report.rowCount,
        rows: report.rows,
      },
      generatedBy: actor.userId,
    });
    if (!history) {
      throw ApplicationError.internal('Failed to save report history');
    }

    return { report, historyId: history.id };
  }

  async exportReport(
    tenantId: string,
    actor: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole },
    input: ExportReportInput
  ): Promise<{ filename: string; contentType: string; body: Buffer }> {
    const { report } = await this.generateReport(tenantId, actor, input, input.format.toUpperCase() as
      | 'CSV'
      | 'PDF');
    const slug = report.type.toLowerCase();
    const ext = input.format === 'csv' ? 'csv' : 'pdf';
    const filename = `${slug}-report-${Date.now()}.${ext}`;

    if (input.format === 'csv') {
      const csv = this.toCsv(report);
      return { filename, contentType: 'text/csv; charset=utf-8', body: Buffer.from(csv, 'utf8') };
    }

    const pdf = this.toSimplePdf(report);
    return { filename, contentType: 'application/pdf', body: pdf };
  }

  async listHistory(
    tenantId: string,
    query: ListReportHistoryQuery
  ): Promise<{
    data: Array<{
      id: string;
      reportType: string;
      format: string;
      filters: Record<string, unknown>;
      payload: Record<string, unknown>;
      generatedBy: string;
      createdAt: string;
    }>;
    pagination: { total: number; page: number; limit: number; pages: number; hasMore: boolean };
  }> {
    const [rows, total] = await Promise.all([
      this.reportsRepository.listHistory(tenantId, query),
      this.reportsRepository.countHistory(tenantId, query),
    ]);
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);
    return {
      data: rows.map((r) => {
        assertTenantEntityMatch(r.tenant_id, tenantId, 'Report history');
        return {
          id: r.id,
          reportType: r.report_type,
          format: r.format,
          filters: r.filters,
          payload: r.payload,
          generatedBy: r.generated_by,
          createdAt: r.created_at.toISOString(),
        };
      }),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  private async buildKpiRows(
    tenantId: string,
    userIds: string[],
    from: Date,
    to: Date,
    userById: Map<string, string>
  ): Promise<ReportRow[]> {
    const summaries = await this.reportsRepository.getKpiSummaries(tenantId, userIds, from, to);
    const byUser = new Map(summaries.map((s) => [s.user_id, s]));
    return userIds.map((userId) => {
      const row = byUser.get(userId);
      const completed = row?.tasks_completed ?? 0;
      const onTime = row?.tasks_on_time ?? 0;
      const overdue = row?.tasks_overdue ?? 0;
      const performance = completed === 0 ? 0 : Math.round((onTime / completed) * 10000) / 100;
      return {
        userId,
        userName: userById.get(userId) ?? userId,
        completedTasks: completed,
        overdueTasks: overdue,
        performancePercent: performance,
      };
    });
  }

  private async buildPayrollRows(
    tenantId: string,
    userIds: string[],
    from: Date,
    to: Date,
    userById: Map<string, string>
  ): Promise<ReportRow[]> {
    const kpiRows = await this.buildKpiRows(tenantId, userIds, from, to, userById);
    const payroll = await this.reportsRepository.getPayrollSummaries(tenantId, userIds, from, to);
    const byUser = new Map(payroll.map((p) => [p.user_id, p]));
    return kpiRows.map((k) => {
      const p = byUser.get(k.userId);
      return {
        ...k,
        baseAmount: p?.base_total ?? 0,
        bonusAmount: p?.bonus_total ?? 0,
        totalAmount: p?.total_total ?? 0,
      };
    });
  }

  private async buildTaskRows(
    tenantId: string,
    userIds: string[],
    from: Date,
    to: Date,
    userById: Map<string, string>
  ): Promise<ReportRow[]> {
    const summaries = await this.reportsRepository.getTaskSummaries(tenantId, userIds, from, to);
    const byUser = new Map(summaries.map((s) => [s.user_id, s]));
    return userIds.map((userId) => {
      const row = byUser.get(userId);
      const completed = row?.completed_tasks ?? 0;
      const overdue = row?.overdue_tasks ?? 0;
      const performance = completed === 0 ? 0 : Math.max(0, Math.round(((completed - overdue) / completed) * 10000) / 100);
      return {
        userId,
        userName: userById.get(userId) ?? userId,
        completedTasks: completed,
        overdueTasks: overdue,
        performancePercent: performance,
      };
    });
  }

  private parseRange(dateFrom: string, dateTo: string): { from: Date; to: Date } {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw ApplicationError.badRequest('Invalid date range');
    }
    if (to < from) {
      throw ApplicationError.badRequest('dateTo must be >= dateFrom');
    }
    return { from, to };
  }

  private async applyAccessControl(
    tenantId: string,
    actor: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole },
    requested: { userId?: string; teamId?: string }
  ): Promise<{ userId?: string; teamId?: string }> {
    if (actor.systemRole === 'super_admin' || actor.tenantRole === 'owner') {
      return requested;
    }
    if (actor.tenantRole === 'employee') {
      if (requested.teamId) {
        throw ApplicationError.forbidden('Employees cannot filter by team');
      }
      if (requested.userId && requested.userId !== actor.userId) {
        throw ApplicationError.forbidden('You can only access your own reports');
      }
      return { userId: actor.userId };
    }

    if (actor.tenantRole !== 'manager') {
      throw ApplicationError.forbidden('Insufficient role to access reports');
    }

    // MANAGER
    if (requested.teamId && requested.teamId !== actor.userId) {
      throw ApplicationError.forbidden('Managers can only access their own team');
    }
    if (requested.userId && requested.userId !== actor.userId) {
      const ids = await this.reportsRepository.resolveAssigneeIds(tenantId, { teamId: actor.userId });
      if (!ids.includes(requested.userId)) {
        throw ApplicationError.forbidden('You can only access your direct reports');
      }
    }
    if (!requested.userId && !requested.teamId) {
      return { teamId: actor.userId };
    }
    return requested;
  }

  private toCsv(report: GeneratedReport): string {
    const baseHeaders = ['userId', 'userName', 'completedTasks', 'overdueTasks', 'performancePercent'];
    const payrollHeaders = ['baseAmount', 'bonusAmount', 'totalAmount'];
    const headers =
      report.type === 'PAYROLL' ? [...baseHeaders, ...payrollHeaders] : baseHeaders;

    const esc = (v: unknown) => {
      const s = String(v ?? '');
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replaceAll('"', '""')}"`;
      }
      return s;
    };

    const lines = [
      headers.join(','),
      ...report.rows.map((r) =>
        headers
          .map((h) => esc((r as unknown as Record<string, unknown>)[h]))
          .join(',')
      ),
    ];
    return lines.join('\n');
  }

  // Minimal PDF writer for plain-text tabular exports.
  private toSimplePdf(report: GeneratedReport): Buffer {
    const lines: string[] = [
      `${report.type} REPORT`,
      `From: ${report.dateFrom}`,
      `To: ${report.dateTo}`,
      `Rows: ${report.rowCount}`,
      '',
    ];
    for (const r of report.rows) {
      lines.push(
        `${r.userName} (${r.userId}) | completed=${r.completedTasks} | overdue=${r.overdueTasks} | perf=${r.performancePercent}%` +
          (report.type === 'PAYROLL'
            ? ` | base=${r.baseAmount ?? 0} | bonus=${r.bonusAmount ?? 0} | total=${r.totalAmount ?? 0}`
            : '')
      );
    }

    const text = lines.join('\n').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
    const stream = `BT /F1 10 Tf 40 790 Td (${text.replaceAll('\n', ') Tj T* (')}) Tj ET`;

    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj',
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    ];

    let body = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(body.length);
      body += `${obj}\n`;
    }
    const xrefPos = body.length;
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    return Buffer.from(body, 'utf8');
  }
}
