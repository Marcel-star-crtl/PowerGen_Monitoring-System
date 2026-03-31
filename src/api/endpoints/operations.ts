import apiClient, { handleApiError } from '../client';

export const operationsAPI = {
  async getSites() {
    try {
      const response = await apiClient.get('/operations/sites');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async listAudits(params: { status?: string; siteId?: string; page?: number; limit?: number } = {}) {
    try {
      const response = await apiClient.get('/operations/audits', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getAudit(id: string) {
    try {
      const response = await apiClient.get(`/operations/audits/${id}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
