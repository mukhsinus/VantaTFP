export interface AutomationApiDto {
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

export interface AutomationListResponse {
  data: AutomationApiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAutomationPayload {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  actionType: string;
  actionConfig?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateAutomationPayload {
  name?: string;
  description?: string | null;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  actionType?: string;
  actionConfig?: Record<string, unknown>;
  active?: boolean;
}
