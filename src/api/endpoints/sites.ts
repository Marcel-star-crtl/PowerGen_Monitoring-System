import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';
import { Site } from '@/types/sites.types';

export const sitesAPI = {
  getSites: async (params?: PaginationParams & { search?: string; region?: string; priority?: string }) => {
    const response = await apiClient.get('/sites', { params });
    return response.data;
  },

  getSite: async (siteId: string): Promise<Site> => {
    const response = await apiClient.get<ApiResponse<Site>>(`/sites/${siteId}`);
    return response.data.data!;
  },

  getSiteStats: async () => {
    const response = await apiClient.get('/sites/stats');
    return response.data.stats;
  },

  getSitesNeedingMaintenance: async (params?: { priority?: string; region?: string; anomalyType?: string }) => {
    const response = await apiClient.get('/sites/maintenance/needed', { params });
    return response.data;
  },

  updateSite: async (siteId: string, data: any) => {
    const response = await apiClient.put(`/sites/${siteId}`, data);
    return response.data;
  },

  createSite: async (data: any) => {
    const response = await apiClient.post('/sites', data);
    return response.data;
  },
};









// // src/api/endpoints/sites.js
// import apiClient from '../client';

// export const sitesAPI = {
//   /**
//    * Get all sites
//    * @param {Object} params - { search, region, priority, page, limit }
//    */
//   getSites: async (params = {}) => {
//     const response = await apiClient.get('/sites', { params });
//     return response.data;
//   },

//   /**
//    * Get single site
//    */
//   getSite: async (siteId) => {
//     const response = await apiClient.get(`/sites/${siteId}`);
//     return response.data.data;
//   },

//   /**
//    * Get site statistics
//    */
//   getSiteStats: async () => {
//     const response = await apiClient.get('/sites/stats');
//     return response.data.stats;
//   },

//   /**
//    * Get sites needing maintenance
//    * @param {Object} params - { priority, region, anomalyType }
//    */
//   getSitesNeedingMaintenance: async (params = {}) => {
//     const response = await apiClient.get('/sites/maintenance/needed', { params });
//     return response.data;
//   }
// };

