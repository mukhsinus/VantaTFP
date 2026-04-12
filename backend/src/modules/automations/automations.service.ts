import { AutomationsRepository, AutomationRecord } from './automations.repository.js';
import { CreateAutomationInput, UpdateAutomationInput, ListAutomationsQuery } from './automations.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface AutomationResponse {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  active: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class AutomationsService {
  constructor(private readonly repo: AutomationsRepository) {}

  async list(tenantId: string, query: ListAutomationsQuery) {
    const [rows, total] = await Promise.all([
      this.repo.findAll(tenantId, query),
      this.repo.count(tenantId),
    ]);
    return {
      data: rows.map((r) => this.toResponse(r)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getById(tenantId: string, ruleId: string): Promise<AutomationResponse> {
    const row = await this.repo.findById(tenantId, ruleId);
    if (!row) throw ApplicationError.notFound('Automation rule');
    return this.toResponse(row);
  }

  async create(tenantId: string, userId: string, input: CreateAutomationInput): Promise<AutomationResponse> {
    const row = await this.repo.create({
      tenant_id: tenantId,
      name: input.name,
      description: input.description ?? null,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig,
      action_type: input.actionType,
      action_config: input.actionConfig,
      active: input.active,
      created_by: userId,
    });
    return this.toResponse(row);
  }

  async update(tenantId: string, ruleId: string, input: UpdateAutomationInput): Promise<AutomationResponse> {
    const row = await this.repo.update(tenantId, ruleId, {
      name: input.name,
      description: input.description,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig,
      action_type: input.actionType,
      action_config: input.actionConfig,
      active: input.active,
    });
    if (!row) throw ApplicationError.notFound('Automation rule');
    return this.toResponse(row);
  }

  async delete(tenantId: string, ruleId: string): Promise<void> {
    const ok = await this.repo.delete(tenantId, ruleId);
    if (!ok) throw ApplicationError.notFound('Automation rule');
  }

  /** Called by domain event handlers to execute matching automations */
  async executeForTrigger(tenantId: string, triggerType: string, _context: Record<string, unknown>): Promise<void> {
    const rules = await this.repo.findActiveByTrigger(tenantId, triggerType);
    for (const rule of rules) {
      // TODO: execute action based on rule.action_type & rule.action_config
      // For now, just increment execution counter
      await this.repo.incrementExecution(tenantId, rule.id);
    }
  }

  private toResponse(row: AutomationRecord): AutomationResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      triggerType: row.trigger_type,
      triggerConfig: row.trigger_config,
      actionType: row.action_type,
      actionConfig: row.action_config,
      active: row.active,
      executionCount: row.execution_count,
      lastExecutedAt: row.last_executed_at?.toISOString() ?? null,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
