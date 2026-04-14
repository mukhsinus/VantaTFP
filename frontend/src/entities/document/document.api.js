import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const documentApi = {
    list: (params) => apiClient.get(API.documents.list, params),
    getById: (docId) => apiClient.get(API.documents.detail(docId)),
    create: (payload) => apiClient.post(API.documents.list, payload),
    update: (docId, payload) => apiClient.patch(API.documents.detail(docId), payload),
    delete: (docId) => apiClient.delete(API.documents.detail(docId)),
};
