export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationWsEvent {
  type: string;
  data?: unknown;
}
