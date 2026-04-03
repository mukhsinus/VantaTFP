import { Pool } from 'pg';
import { ListTasksQuery } from './tasks.schema.js';

export interface TaskRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class TasksRepository {
  constructor(private readonly db: Pool) {}

  async findAllByTenant(_tenantId: string, _filters: ListTasksQuery): Promise<TaskRecord[]> {
    throw new Error('Not implemented');
  }

  async findByIdAndTenant(_taskId: string, _tenantId: string): Promise<TaskRecord | null> {
    throw new Error('Not implemented');
  }

  async create(_data: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TaskRecord> {
    throw new Error('Not implemented');
  }

  async update(
    _taskId: string,
    _tenantId: string,
    _data: Partial<Pick<TaskRecord, 'title' | 'description' | 'assignee_id' | 'status' | 'priority' | 'due_date'>>
  ): Promise<TaskRecord> {
    throw new Error('Not implemented');
  }

  async delete(_taskId: string, _tenantId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async countByTenant(_tenantId: string, _filters: Omit<ListTasksQuery, 'page' | 'limit'>): Promise<number> {
    throw new Error('Not implemented');
  }
}
