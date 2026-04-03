import { TasksRepository } from './tasks.repository.js';
import { CreateTaskDto, UpdateTaskDto, ListTasksQuery } from './tasks.schema.js';

export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async listTasks(_tenantId: string, _query: ListTasksQuery) {
    throw new Error('Not implemented');
  }

  async getTaskById(_taskId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }

  async createTask(_tenantId: string, _createdByUserId: string, _data: CreateTaskDto) {
    throw new Error('Not implemented');
  }

  async updateTask(_taskId: string, _tenantId: string, _data: UpdateTaskDto) {
    throw new Error('Not implemented');
  }

  async deleteTask(_taskId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }
}
