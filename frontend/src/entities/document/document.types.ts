export interface DocumentApiDto {
  id: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  content: string;
  contentType: string;
  icon: string;
  coverUrl: string | null;
  isTemplate: boolean;
  archived: boolean;
  sortOrder: number;
  createdBy: string;
  lastEditedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListResponse {
  data: DocumentApiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateDocumentPayload {
  title: string;
  content?: string;
  contentType?: 'markdown' | 'richtext';
  projectId?: string;
  parentId?: string;
  icon?: string;
  isTemplate?: boolean;
}

export interface UpdateDocumentPayload {
  title?: string;
  content?: string;
  icon?: string;
  coverUrl?: string | null;
  archived?: boolean;
  sortOrder?: number;
}
