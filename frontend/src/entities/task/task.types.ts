// ─── Shared enums (aligned with backend schema) ───────────────────────────────

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Backend API DTO ──────────────────────────────────────────────────────────
// Shape the backend will return from GET /tasks and POST /tasks.
// Uses camelCase — the backend service layer will serialize in this format.

export interface TaskAssigneeDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TaskApiDto {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  assignee: TaskAssigneeDto | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;   // ISO 8601 datetime string
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListApiResponse {
  data: TaskApiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;         // ISO 8601 datetime string
  priority?: TaskPriority;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface ListTasksParams {
  status?: TaskStatus;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

// ─── UI model ─────────────────────────────────────────────────────────────────
// The shape components consume. Never leaks backend internals into JSX.

export interface TaskUiModel {
  id: string;
  title: string;
  description: string | null;
  assignee: string;          // "First Last" or "Unassigned"
  assigneeId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;           // Formatted e.g. "Apr 5"
  dueDateIso: string | null; // Raw ISO for comparisons
  overdue: boolean;
  createdAt: string;
}
