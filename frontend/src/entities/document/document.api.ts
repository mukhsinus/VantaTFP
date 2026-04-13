import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { DocumentApiDto, DocumentListResponse, CreateDocumentPayload, UpdateDocumentPayload } from './document.types';

export const documentApi = {
  list: (params?: Record<string, string | number | boolean | null | undefined>): Promise<DocumentListResponse> =>
    apiClient.get<DocumentListResponse>(API.documents.list, params),

  getById: (docId: string): Promise<DocumentApiDto> =>
    apiClient.get<DocumentApiDto>(API.documents.detail(docId)),

  create: (payload: CreateDocumentPayload): Promise<DocumentApiDto> =>
    apiClient.post<DocumentApiDto>(API.documents.list, payload),

  update: (docId: string, payload: UpdateDocumentPayload): Promise<DocumentApiDto> =>
    apiClient.patch<DocumentApiDto>(API.documents.detail(docId), payload),

  delete: (docId: string): Promise<void> =>
    apiClient.delete(API.documents.detail(docId)) as Promise<void>,
};
