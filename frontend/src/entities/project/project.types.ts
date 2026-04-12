export interface ProjectApiDto {
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

export interface ProjectListResponse {
  data: ProjectApiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  archived?: boolean;
  sortOrder?: number;
}
