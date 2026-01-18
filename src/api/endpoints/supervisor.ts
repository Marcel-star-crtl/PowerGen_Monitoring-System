import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';
import { Maintenance } from '@/types/maintenance.types';

interface SupervisorDashboard {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  avg_approval_time_hours: number;
}

interface MaintenanceStats {
  period_days: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  avg_approval_time_hours: number;
  by_priority: Record<string, number>;
  by_visit_type: Record<string, number>;
}

interface ScheduleMaintenanceData {
  technician: string;
  tower: string;
  type: 'routine' | 'repair' | 'inspection' | 'emergency';
  scheduledDate: string;
  priority: string;
  notes?: string;
  estimated_duration?: number;
}

export const supervisorAPI = {
  getDashboard: async (): Promise<SupervisorDashboard> => {
    const response = await apiClient.get<ApiResponse<SupervisorDashboard>>('/supervisor/dashboard');
    return response.data.data!;
  },

  getPendingMaintenance: async (params?: PaginationParams & { priority?: string; site_id?: string }) => {
    const response = await apiClient.get('/supervisor/maintenance/pending', { params });
    return response.data;
  },

  getScheduledMaintenance: async (params?: PaginationParams & { status?: string; site_id?: string }) => {
    const response = await apiClient.get('/supervisor/maintenance/scheduled', { params });
    return response.data;
  },

  scheduleMaintenance: async (data: ScheduleMaintenanceData) => {
    const response = await apiClient.post('/supervisor/maintenance/schedule', data);
    return response.data;
  },

  updateScheduledMaintenance: async (maintenanceId: string, data: Partial<ScheduleMaintenanceData>) => {
    const response = await apiClient.put(`/supervisor/maintenance/${maintenanceId}`, data);
    return response.data;
  },

  approveMaintenance: async (maintenanceId: string, comments: string = '') => {
    const response = await apiClient.post(`/supervisor/maintenance/${maintenanceId}/approve`, { comments });
    return response.data;
  },

  rejectMaintenance: async (maintenanceId: string, reason: string) => {
    const response = await apiClient.post(`/supervisor/maintenance/${maintenanceId}/reject`, { reason });
    return response.data;
  },

  getMaintenanceStats: async (period: number = 30): Promise<MaintenanceStats> => {
    const response = await apiClient.get<ApiResponse<MaintenanceStats>>('/supervisor/maintenance/stats', {
      params: { period },
    });
    return response.data.data!;
  },

  getTechnicians: async () => {
    const response = await apiClient.get('/supervisor/technicians');
    return response.data;
  },

  getSites: async () => {
    const response = await apiClient.get('/supervisor/sites');
    return response.data;
  },

  getMaintenanceDetails: async (maintenanceId: string) => {
    const response = await apiClient.get(`/supervisor/maintenance/${maintenanceId}`);
    return response.data;
  },

  deleteScheduledMaintenance: async (maintenanceId: string) => {
    const response = await apiClient.delete(`/supervisor/maintenance/${maintenanceId}`);
    return response.data;
  },

  assignTechnician: async (maintenanceId: string, technicianId: string) => {
    const response = await apiClient.post(`/supervisor/maintenance/${maintenanceId}/assign`, {
      technician_id: technicianId,
    });
    return response.data;
  },

  // Get all visits from technicians assigned to supervisor
  getTechnicianVisits: async (supervisorId: string, params?: PaginationParams & { start_date?: string; end_date?: string; status?: string }) => {
    const response = await apiClient.get(`/sites/supervisor/${supervisorId}/technician-visits`, { params });
    return response.data;
  },

};


