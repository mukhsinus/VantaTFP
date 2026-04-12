export type NotificationType =
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_OVERDUE';

export interface NotificationPayload {
  taskId: string;
  actorUserId: string;
  status?: string;
  deadline?: string | null;
  completedAt?: string;
}

export interface NotificationRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
}
