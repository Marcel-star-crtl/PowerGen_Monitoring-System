import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';
import { FuelConsumption, FuelDashboard, LowFuelAlert } from '@/types/fuel.types';

interface DeliveryData {
  delivered_quantity: number;
  delivered_by: string;
  notes?: string;
}

export const dieselManagerAPI = {
  getDashboard: async (period: number = 30): Promise<FuelDashboard> => {
    const response = await apiClient.get<ApiResponse<FuelDashboard>>('/fuel/dashboard', {
      params: { period },
    });
    return response.data.data!;
  },

  getFuelConsumptionBySite: async (
    siteId: string,
    params?: PaginationParams & { start_date?: string; end_date?: string }
  ) => {
    const response = await apiClient.get(`/fuel/consumption/by-site/${siteId}`, { params });
    return response.data;
  },

  getFuelSummary: async (siteId: string, period: number = 30) => {
    const response = await apiClient.get(`/fuel/consumption/summary/${siteId}`, {
      params: { period },
    });
    return response.data.data;
  },

  getPendingRequests: async (params?: PaginationParams & { urgency?: string }) => {
    const response = await apiClient.get('/fuel/requests/pending', { params });
    return response.data;
  },

  approveFuelRequest: async (requestId: string, notes: string = '') => {
    const response = await apiClient.post(`/fuel/requests/${requestId}/approve`, { notes });
    return response.data;
  },

  rejectFuelRequest: async (requestId: string, reason: string) => {
    const response = await apiClient.post(`/fuel/requests/${requestId}/reject`, { reason });
    return response.data;
  },

  markFuelDelivered: async (requestId: string, deliveryData: DeliveryData) => {
    const response = await apiClient.post(`/fuel/requests/${requestId}/deliver`, deliveryData);
    return response.data;
  },

  getConsumptionTrends: async (period: number = 30) => {
    const response = await apiClient.get('/fuel/analytics/trends', {
      params: { period },
    });
    return response.data.data;
  },

  getLowFuelAlerts: async (threshold: number = 25): Promise<{ data: LowFuelAlert[]; count: number }> => {
    const response = await apiClient.get<ApiResponse<LowFuelAlert[]>>('/fuel/alerts/low-fuel', {
      params: { threshold },
    });
    return { data: response.data.data!, count: response.data.data!.length };
  },

  getSites: async () => {
    const response = await apiClient.get('/diesel/sites');
    return response.data;
  },

  createFuelRequest: async (data: {
    site_id: string;
    fuel_requested: number;
    request_reason: string;
    request_urgency: string;
    current_fuel_level?: number;
    tank_capacity?: number;
  }) => {
    const response = await apiClient.post('/diesel/fuel-requests', data);
    return response.data;
  },

  updateFuelRequest: async (requestId: string, data: any) => {
    const response = await apiClient.put(`/diesel/fuel-requests/${requestId}`, data);
    return response.data;
  },

  deleteFuelRequest: async (requestId: string) => {
    const response = await apiClient.delete(`/diesel/fuel-requests/${requestId}`);
    return response.data;
  },
};