import { ProjectsRepository, ProjectRecord } from './projects.repository.js';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from './projects.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface ProjectResponse {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  archived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  async list(tenantId: string, query: ListProjectsQuery) {
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

  async getById(tenantId: string, projectId: string): Promise<ProjectResponse> {
    const row = await this.repo.findById(tenantId, projectId);
    if (!row) throw ApplicationError.notFound('Project');
    return this.toResponse(row);
  }

  async create(tenantId: string, userId: string, input: CreateProjectInput): Promise<ProjectResponse> {
    if (input.parentId) {
      const parent = await this.repo.findById(tenantId, input.parentId);
      if (!parent) throw ApplicationError.notFound('Parent project');
    }
    const row = await this.repo.create({
      tenant_id: tenantId,
      parent_id: input.parentId ?? null,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#6366f1',
      icon: input.icon ?? 'folder',
      sort_order: 0,
      archived: false,
      created_by: userId,
    });
    return this.toResponse(row);
  }

  async update(tenantId: string, projectId: string, input: UpdateProjectInput): Promise<ProjectResponse> {
    const row = await this.repo.update(tenantId, projectId, {
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      archived: input.archived,
      sort_order: input.sortOrder,
    });
    if (!row) throw ApplicationError.notFound('Project');
    return this.toResponse(row);
  }

  async delete(tenantId: string, projectId: string): Promise<void> {
    const deleted = await this.repo.delete(tenantId, projectId);
    if (!deleted) throw ApplicationError.notFound('Project');
  }

  private toResponse(row: ProjectRecord): ProjectResponse {
    return {
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sort_order,
      archived: row.archived,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
