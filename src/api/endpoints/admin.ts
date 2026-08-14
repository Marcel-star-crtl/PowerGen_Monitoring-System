import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';
import { User } from '@/types/common.types';

export const adminAPI = {
    // Remove technician from cluster
    // removeTechnicianFromCluster: async (clusterId: string, technicianId: string) => {
    //   const response = await apiClient.delete(`/clusters/${clusterId}/technicians/${technicianId}`);
    //   return response.data;
    // },
  // User Management
  getUsers: async (params?: PaginationParams & { role?: string; search?: string }) => {
    // Only use this for admin context. For diesel manager, use dieselManagerAPI.getTechnicians
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData: Partial<User> & { password: string }) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const response = await apiClient.put(`/admin/users/${userId}`, updates);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  toggleUserStatus: async (userId: string) => {
    const response = await apiClient.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  resetPassword: async (userId: string, newPassword: string) => {
    const response = await apiClient.post(`/admin/users/${userId}/reset-password`, {
      password: newPassword,
    });
    return response.data;
  },

  // Dashboard Stats
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data.data;
  },

  // Sites Management
  getAllSites: async (params?: PaginationParams & { search?: string; region?: string; cluster?: string }) => {
    const response = await apiClient.get('/admin/sites', { params });
    return response.data;
  },

  createSite: async (siteData: any) => {
    const response = await apiClient.post('/admin/sites', siteData);
    return response.data;
  },

  updateSite: async (siteId: string, updates: any) => {
    const response = await apiClient.put(`/admin/sites/${siteId}`, updates);
    return response.data;
  },

  deleteSite: async (siteId: string) => {
    const response = await apiClient.delete(`/admin/sites/${siteId}`);
    return response.data;
  },

  // Maintenance Management
  getAllMaintenance: async (params?: PaginationParams & { status?: string }) => {
    const response = await apiClient.get('/admin/maintenance', { params });
    return response.data;
  },

  updateMaintenanceStatus: async (maintenanceId: string, status: string) => {
    const response = await apiClient.patch(`/admin/maintenance/${maintenanceId}/status`, {
      status,
    });
    return response.data;
  },

  deleteMaintenance: async (maintenanceId: string) => {
    const response = await apiClient.delete(`/admin/maintenance/${maintenanceId}`);
    return response.data;
  },

  // Clusters Management
  getAllClusters: async () => {
    const response = await apiClient.get('/admin/clusters');
    return response.data;
  },

  createCluster: async (clusterData: any) => {
    const response = await apiClient.post('/admin/clusters', clusterData);
    return response.data;
  },

  updateCluster: async (clusterId: string, updates: any) => {
    const response = await apiClient.put(`/admin/clusters/${clusterId}`, updates);
    return response.data;
  },

  deleteCluster: async (clusterId: string) => {
    const response = await apiClient.delete(`/admin/clusters/${clusterId}`);
    return response.data;
  },

  // Parts Management
  getAllParts: async (params?: PaginationParams & { category?: string }) => {
    const response = await apiClient.get('/admin/parts', { params });
    return response.data;
  },

  createPart: async (partData: any) => {
    const response = await apiClient.post('/admin/parts', partData);
    return response.data;
  },

  updatePart: async (partId: string, updates: any) => {
    const response = await apiClient.put(`/admin/parts/${partId}`, updates);
    return response.data;
  },

  deletePart: async (partId: string) => {
    const response = await apiClient.delete(`/admin/parts/${partId}`);
    return response.data;
  },

  // System Reports
  getSystemReports: async (period: number = 30) => {
    const response = await apiClient.get('/admin/reports', { params: { period } });
    return response.data.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: PaginationParams & { action?: string; userId?: string }) => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  // Assignment
  assignTechnicians: async (supervisorId: string, technicianIds: string[]) => {
    const response = await apiClient.post('/admin/assign-technicians', {
      supervisorId,
      technicianIds,
    });
    return response.data;
  },

  assignTechnicianToCluster: (clusterId: string, technicianId: string) =>
  apiClient.post(`/admin/clusters/${clusterId}/technicians`, { technicianId }),

removeTechnicianFromCluster: (clusterId: string, technicianId: string) =>
  apiClient.delete(`/admin/clusters/${clusterId}/technicians/${technicianId}`),

  // Fuel Request Approval Chain — the six named approvers + CEO threshold,
  // previously hardcoded in the backend and only changeable via a code
  // deploy. Now DB-backed and admin-editable through this endpoint.
  getApprovalChain: async () => {
    const response = await apiClient.get('/admin/approval-chain/fuel-request');
    return response.data;
  },

  updateApprovalChain: async (data: {
    steps: Array<{ level: number; name: string; email: string; role: string; department: string; conditional_ceo_step?: boolean }>;
    ceo_liters_threshold: number;
  }) => {
    const response = await apiClient.put('/admin/approval-chain/fuel-request', data);
    return response.data;
  },

};

