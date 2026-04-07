import { EventEmitter } from 'events';

export const DOMAIN_EVENT_TASK_COMPLETED = 'TASK_COMPLETED' as const;

export interface TaskCompletedEventPayload {
  tenantId: string;
  taskId: string;
  actorUserId: string;
  assigneeId: string | null;
  completedAt: string;
}

type DomainEventMap = {
  [DOMAIN_EVENT_TASK_COMPLETED]: TaskCompletedEventPayload;
};

class DomainEventBus {
  private readonly emitter = new EventEmitter();

  emit<E extends keyof DomainEventMap>(event: E, payload: DomainEventMap[E]): void {
    this.emitter.emit(event, payload);
  }

  on<E extends keyof DomainEventMap>(
    event: E,
    listener: (payload: DomainEventMap[E]) => void
  ): void {
    this.emitter.on(event, listener);
  }
}

export const domainEvents = new DomainEventBus();
