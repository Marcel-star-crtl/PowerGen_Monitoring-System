import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';

export const commonAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data.data;
  },

  getParts: async () => {
    const response = await apiClient.get('/parts');
    return response.data;
  },

  getClusters: async () => {
    const response = await apiClient.get('/clusters');
    return response.data;
  },

  getMaintenance: async (params?: PaginationParams & { status?: string }) => {
    const response = await apiClient.get('/maintenance', { params });
    return response.data;
  },

  getMaintenanceById: async (id: string) => {
    const response = await apiClient.get(`/maintenance/${id}`);
    return response.data.data;
  },

  getGenerators: async () => {
    const response = await apiClient.get('/generators');
    return response.data;
  },
};



