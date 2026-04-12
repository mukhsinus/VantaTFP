export interface LabelApiDto {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateLabelPayload {
  name: string;
  color?: string;
}

export interface UpdateLabelPayload {
  name?: string;
  color?: string;
}
