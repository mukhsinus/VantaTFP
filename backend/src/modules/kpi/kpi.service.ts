import {
  KpiRepository,
  KpiRecord,
  KpiProgressRecord,
  KpiRecordCacheRow,
} from './kpi.repository.js';
import { PayrollService } from '../payroll/payroll.service.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { logger } from '../../shared/utils/logger.js';
import type { SystemRole, TenantRole } from '../../shared/types/common.types.js';
import type { KpiAnalyticsQuery } from './kpi.schema.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';

const KPI_CACHE_MAX_AGE_MS = 60_000;

export interface KpiResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  targetValue: number;
  unit: string;
  period: string;
  assigneeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiProgressResponse {
  id: string;
  kpiId: string;
  tenantId: string;
  actualValue: number;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface KpiListResponse {
  data: KpiResponse[];
  pagination: PaginationMeta;
}

export interface KpiCalculationResponse {
  userId: string;
  periodStart: string;
  periodEnd: string;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksOverdue: number;
  score: number;
}

export interface KpiAnalyticsEmployeeRow {
  userId: string;
  periodStart: string;
  periodEnd: string;
  /** Tasks completed in range (status DONE, completed_at in period). */
  completedTasks: number;
  /** Completed tasks with deadline met or no deadline (same basis as score numerator). */
  onTimeCompletedTasks: number;
  /** Completed tasks finished after deadline. */
  overdueCompletedTasks: number;
  /** Still-open tasks whose deadline is before period end. */
  openOverdueTasks: number;
  /** Same formula as legacy `score`: on-time share among completed tasks with a deadline. */
  performancePercent: number;
}

export interface KpiAnalyticsByEmployeeResponse {
  periodStart: string;
  periodEnd: string;
  data: KpiAnalyticsEmployeeRow[];
}

export interface KpiAnalyticsAggregatedResponse {
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
  /** Always true: analytics are sourced from `kpi_records` only. */
  fromCache: boolean;
}

export class KpiService {
  constructor(
    private readonly kpiRepository: KpiRepository,
    private readonly payrollService?: PayrollService
  ) {}

  async listKpis(tenantId: string): Promise<KpiResponse[]> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpis = await this.kpiRepository.findAllByTenant(tenantId);
    return kpis.map((k) => {
      assertTenantEntityMatch(k.tenant_id, tenantId, 'KPI');
      return this.toResponse(k);
    });
  }

  async listKpisPaginated(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<KpiListResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpis = await this.kpiRepository.findAllByTenantPaginated(tenantId, page, limit);
    const total = await this.kpiRepository.countByTenant(tenantId);
    const pages = Math.ceil(total / limit);

    return {
      data: kpis.map((k) => {
        assertTenantEntityMatch(k.tenant_id, tenantId, 'KPI');
        return this.toResponse(k);
      }),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async getKpiById(kpiId: string, tenantId: string): Promise<KpiResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }
    assertTenantEntityMatch(kpi.tenant_id, tenantId, 'KPI');

    return this.toResponse(kpi);
  }

  async getKpiProgress(kpiId: string, tenantId: string): Promise<KpiProgressResponse[]> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }

    const progress = await this.kpiRepository.findProgressByKpi(kpiId, tenantId);
    return progress.map((p) => {
      assertTenantEntityMatch(p.tenant_id, tenantId, 'KPI progress');
      return this.progressToResponse(p);
    });
  }

  async calculateKPI(
    userId: string,
    tenantId: string,
    periodStartInput: string,
    periodEndInput: string
  ): Promise<KpiCalculationResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const { start: periodStart, end: periodEnd } = this.parsePeriod(
      periodStartInput,
      periodEndInput
    );

    const result = await this.refreshKpiCacheForUser(
      tenantId,
      userId,
      periodStart,
      periodEnd
    );

    if (this.payrollService) {
      try {
        await this.payrollService.calculatePayroll(
          userId,
          tenantId,
          periodStart.toISOString(),
          periodEnd.toISOString()
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            tenantId,
            userId,
            period: {
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
            },
          },
          'Payroll recalculation failed after KPI recalculation'
        );
      }
    }

    return result;
  }

  async getAnalyticsByEmployee(
    tenantId: string,
    query: KpiAnalyticsQuery,
    access: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole }
  ): Promise<KpiAnalyticsByEmployeeResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const { start: periodStart, end: periodEnd } = this.parsePeriod(
      query.periodStart,
      query.periodEnd
    );

    const guarded = await this.guardAnalyticsFilters(tenantId, query, access);
    const assigneeIds = await this.kpiRepository.resolveAnalyticsAssigneeIds({
      tenantId,
      userId: guarded.userId,
      teamId: guarded.teamId,
    });

    if (!(await this.kpiRepository.hasKpiRecordsTable())) {
      const data = await this.analyticsRowsFromTasks(
        tenantId,
        assigneeIds,
        periodStart,
        periodEnd
      );
      return {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        data,
      };
    }

    const cachedRows = await this.ensureKpiRecordsForUsersAndPeriod({
      tenantId,
      userIds: assigneeIds,
      periodStart,
      periodEnd,
      forceRefresh: Boolean(query.refresh),
    });
    const cachedByUser = new Map(cachedRows.map((r) => [r.user_id, r]));

    const data: KpiAnalyticsEmployeeRow[] = [];

    for (const uid of assigneeIds) {
      const cached = cachedByUser.get(uid);
      if (!cached) {
        throw ApplicationError.internal('KPI_CACHE_INCONSISTENT');
      }

      data.push({
        userId: uid,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        completedTasks: cached.tasks_completed,
        onTimeCompletedTasks: cached.tasks_on_time,
        overdueCompletedTasks: cached.tasks_overdue,
        // KPI source-of-truth rule: analytics are derived from kpi_records only.
        openOverdueTasks: cached.tasks_overdue,
        performancePercent: Number(cached.score),
      });
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      data,
    };
  }

  async getAnalyticsAggregated(
    tenantId: string,
    query: KpiAnalyticsQuery,
    access: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole }
  ): Promise<KpiAnalyticsAggregatedResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const { start: periodStart, end: periodEnd } = this.parsePeriod(
      query.periodStart,
      query.periodEnd
    );

    const guarded = await this.guardAnalyticsFilters(tenantId, query, access);
    const assigneeIds = await this.kpiRepository.resolveAnalyticsAssigneeIds({
      tenantId,
      userId: guarded.userId,
      teamId: guarded.teamId,
    });

    const filtersApplied = {
      userId: guarded.userId ?? null,
      teamId: guarded.teamId ?? null,
    };

    if (assigneeIds.length === 0) {
      return {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        assigneeCount: 0,
        completedTasks: 0,
        onTimeCompletedTasks: 0,
        overdueCompletedTasks: 0,
        openOverdueTasks: 0,
        performancePercent: 0,
        filtersApplied,
        fromCache: false,
      };
    }

    if (!(await this.kpiRepository.hasKpiRecordsTable())) {
      const rows = await this.analyticsRowsFromTasks(
        tenantId,
        assigneeIds,
        periodStart,
        periodEnd
      );
      let completedTasks = 0;
      let onTimeCompletedTasks = 0;
      let overdueCompletedTasks = 0;
      let openOverdueTasks = 0;
      for (const r of rows) {
        completedTasks += r.completedTasks;
        onTimeCompletedTasks += r.onTimeCompletedTasks;
        overdueCompletedTasks += r.overdueCompletedTasks;
        openOverdueTasks += r.openOverdueTasks;
      }
      return {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        assigneeCount: assigneeIds.length,
        completedTasks,
        onTimeCompletedTasks,
        overdueCompletedTasks,
        openOverdueTasks,
        performancePercent: this.performancePercentFromTotals(onTimeCompletedTasks, completedTasks),
        filtersApplied,
        fromCache: false,
      };
    }

    let completedTasks = 0;
    let onTimeCompletedTasks = 0;
    let overdueCompletedTasks = 0;
    const cachedRows = await this.ensureKpiRecordsForUsersAndPeriod({
      tenantId,
      userIds: assigneeIds,
      periodStart,
      periodEnd,
      forceRefresh: Boolean(query.refresh),
    });

    for (const row of cachedRows) {
      completedTasks += row.tasks_completed;
      onTimeCompletedTasks += row.tasks_on_time;
      overdueCompletedTasks += row.tasks_overdue;
    }
    const performancePercent = this.performancePercentFromTotals(onTimeCompletedTasks, completedTasks);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      assigneeCount: assigneeIds.length,
      completedTasks,
      onTimeCompletedTasks,
      overdueCompletedTasks,
      // KPI source-of-truth rule: analytics are derived from kpi_records only.
      openOverdueTasks: overdueCompletedTasks,
      performancePercent,
      filtersApplied,
      fromCache: true,
    };
  }

  private parsePeriod(
    periodStartInput: string,
    periodEndInput: string
  ): { start: Date; end: Date } {
    const periodStart = new Date(periodStartInput);
    const periodEnd = new Date(periodEndInput);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw ApplicationError.badRequest('Invalid period');
    }

    if (periodEnd < periodStart) {
      throw ApplicationError.badRequest('periodEnd must be greater than or equal to periodStart');
    }

    return { start: periodStart, end: periodEnd };
  }

  private performancePercentFromTotals(onTimeCompleted: number, completed: number): number {
    if (completed === 0) {
      return 0;
    }
    return Math.round((onTimeCompleted / completed) * 10000) / 100;
  }

  /**
   * Recomputes task KPIs and upserts `kpi_records` (same path as `/calculate/:userId` without payroll).
   */
  private async refreshKpiCacheForUser(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiCalculationResponse> {
    const calculated = await this.kpiRepository.calculateKpiFromTasks(
      tenantId,
      userId,
      periodStart,
      periodEnd
    );

    const cachedRecord = await this.kpiRepository.upsertKpiRecordCache({
      tenantId,
      userId,
      periodStart,
      periodEnd,
      calculated,
    });

    if (!cachedRecord) {
      return {
        userId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        tasksCompleted: calculated.tasks_completed,
        tasksOnTime: calculated.tasks_on_time,
        tasksOverdue: calculated.tasks_overdue,
        score: Number(calculated.score),
      };
    }

    return {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      tasksCompleted: cachedRecord.tasks_completed,
      tasksOnTime: cachedRecord.tasks_on_time,
      tasksOverdue: cachedRecord.tasks_overdue,
      score: Number(cachedRecord.score),
    };
  }

  private async ensureKpiRecordsForUsersAndPeriod(params: {
    tenantId: string;
    userIds: string[];
    periodStart: Date;
    periodEnd: Date;
    forceRefresh: boolean;
  }): Promise<KpiRecordCacheRow[]> {
    if (params.userIds.length === 0) {
      return [];
    }
    if (!(await this.kpiRepository.hasKpiRecordsTable())) {
      return [];
    }

    let cachedRows = await this.kpiRepository.findKpiRecordsForUsersAndPeriod(
      params.tenantId,
      params.userIds,
      params.periodStart,
      params.periodEnd
    );
    const byUser = new Map(cachedRows.map((r) => [r.user_id, r]));
    const staleOrMissing = params.userIds.filter((uid) => {
      if (params.forceRefresh) {
        return true;
      }
      const row = byUser.get(uid);
      return !row || this.isCacheOutdated(row);
    });

    if (staleOrMissing.length > 0) {
      for (const uid of staleOrMissing) {
        await this.refreshKpiCacheForUser(params.tenantId, uid, params.periodStart, params.periodEnd);
      }
      cachedRows = await this.kpiRepository.findKpiRecordsForUsersAndPeriod(
        params.tenantId,
        params.userIds,
        params.periodStart,
        params.periodEnd
      );
    }

    return cachedRows;
  }

  /**
   * When `kpi_records` is not migrated, derive per-user analytics from `tasks` (no persistence).
   */
  private async analyticsRowsFromTasks(
    tenantId: string,
    assigneeIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiAnalyticsEmployeeRow[]> {
    const data: KpiAnalyticsEmployeeRow[] = [];
    for (const uid of assigneeIds) {
      const calc = await this.kpiRepository.calculateKpiFromTasks(
        tenantId,
        uid,
        periodStart,
        periodEnd
      );
      const openOverdue = await this.kpiRepository.countOpenOverdueTasksForAssignees(
        tenantId,
        [uid],
        periodEnd
      );
      data.push({
        userId: uid,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        completedTasks: calc.tasks_completed,
        onTimeCompletedTasks: calc.tasks_on_time,
        overdueCompletedTasks: calc.tasks_overdue,
        openOverdueTasks: openOverdue,
        performancePercent: Number(calc.score),
      });
    }
    return data;
  }

  private isCacheOutdated(row: KpiRecordCacheRow): boolean {
    return Date.now() - row.updated_at.getTime() > KPI_CACHE_MAX_AGE_MS;
  }

  private async guardAnalyticsFilters(
    tenantId: string,
    query: KpiAnalyticsQuery,
    access: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole }
  ): Promise<{ userId?: string; teamId?: string }> {
    return this.guardReportScope(
      tenantId,
      { userId: query.userId, teamId: query.teamId },
      access
    );
  }

  /**
   * Same user/team scope as KPI analytics — used by Reports to align filters without duplicating rules.
   */
  async resolveReportAssigneeIds(
    tenantId: string,
    filters: { userId?: string; teamId?: string },
    access: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole }
  ): Promise<string[]> {
    const guarded = await this.guardReportScope(tenantId, filters, access);
    return this.kpiRepository.resolveAnalyticsAssigneeIds({
      tenantId,
      userId: guarded.userId,
      teamId: guarded.teamId,
    });
  }

  private async guardReportScope(
    tenantId: string,
    filters: { userId?: string; teamId?: string },
    access: { userId: string; tenantRole: TenantRole | null; systemRole: SystemRole }
  ): Promise<{ userId?: string; teamId?: string }> {
    void tenantId;
    let { userId, teamId } = filters;

    if (access.systemRole === 'super_admin' || access.tenantRole === 'owner') {
      return { userId, teamId };
    }

    if (access.tenantRole === 'employee') {
      if (teamId) {
        throw ApplicationError.forbidden('Employees cannot filter analytics by team');
      }
      if (userId && userId !== access.userId) {
        throw ApplicationError.forbidden('You can only view your own KPI analytics');
      }
      return { userId: access.userId };
    }

    if (access.tenantRole === 'manager') {
      if (teamId && teamId !== access.userId) {
        throw ApplicationError.forbidden('Managers may only query analytics for their own team');
      }
      if (!userId && !teamId) {
        teamId = access.userId;
      }
      if (userId && userId !== access.userId) {
        const ok = await this.kpiRepository.isDirectReport(tenantId, access.userId, userId);
        if (!ok) {
          throw ApplicationError.forbidden('You can only view analytics for your direct reports');
        }
      }
      return { userId, teamId };
    }

    throw ApplicationError.forbidden('Insufficient role to access KPI analytics');
  }

  private toResponse(kpi: KpiRecord): KpiResponse {
    return {
      id: kpi.id,
      tenantId: kpi.tenant_id,
      name: kpi.name,
      description: kpi.description,
      targetValue: kpi.target_value,
      unit: kpi.unit,
      period: kpi.period,
      assigneeId: kpi.assignee_id,
      createdBy: kpi.created_by,
      createdAt: kpi.created_at.toISOString(),
      updatedAt: kpi.updated_at.toISOString(),
    };
  }

  private progressToResponse(progress: KpiProgressRecord): KpiProgressResponse {
    return {
      id: progress.id,
      kpiId: progress.kpi_id,
      tenantId: progress.tenant_id,
      actualValue: progress.actual_value,
      recordedAt: progress.recorded_at.toISOString(),
      notes: progress.notes,
      createdAt: progress.created_at.toISOString(),
    };
  }
}
