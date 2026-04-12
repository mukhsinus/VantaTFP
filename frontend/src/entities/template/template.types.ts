export interface TemplateApiDto {
  id: string;
  name: string;
  description: string | null;
  defaultPriority: string;
  checklist: string[];
  defaultLabels: string[];
  defaultEstimatePoints: number | null;
  defaultEstimateMinutes: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  defaultPriority?: string;
  checklist?: string[];
  defaultLabels?: string[];
  defaultEstimatePoints?: number;
  defaultEstimateMinutes?: number;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string | null;
  defaultPriority?: string;
  checklist?: string[];
  defaultLabels?: string[];
  defaultEstimatePoints?: number | null;
  defaultEstimateMinutes?: number | null;
}
