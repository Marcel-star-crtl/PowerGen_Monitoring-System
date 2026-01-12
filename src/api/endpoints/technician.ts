import apiClient from '../client';
import { ApiResponse, PaginationParams } from '@/types/common.types';
import { Maintenance, VisitFormData } from '@/types/maintenance.types';
import { Site } from '@/types/sites.types';

interface TechnicianDashboard {
  drafts: number;
  pending_approval: number;
  approved_tasks: number;
  completed_this_month: number;
  assigned_sites: number;
}

interface PhotoFile extends File {
  category?: string;
  description?: string;
}

export const technicianAPI = {
  getDashboard: async (): Promise<TechnicianDashboard> => {
    const response = await apiClient.get<ApiResponse<TechnicianDashboard>>('/technician/dashboard');
    return response.data.data!;
  },

  getAssignedSites: async (): Promise<{ data: Site[]; count: number }> => {
    const response = await apiClient.get<ApiResponse<Site[]>>('/technician/sites');
    return { data: response.data.data!, count: response.data.data!.length };
  },

  getMaintenanceTasks: async (params?: PaginationParams & { status?: string }) => {
    const response = await apiClient.get<ApiResponse<Maintenance[]>>('/technician/maintenance/tasks', { params });
    return response.data;
  },

  getMaintenanceTask: async (id: string): Promise<Maintenance> => {
    const response = await apiClient.get<ApiResponse<Maintenance>>(`/technician/maintenance/${id}`);
    return response.data.data!;
  },

  getVisitHistory: async (params?: PaginationParams & { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get('/technician/visit-history', { params });
    return response.data;
  },

  submitSiteVisit: async (
    siteId: string,
    visitData: VisitFormData,
    photos: PhotoFile[] = [],
    submitNow: boolean = false
  ) => {
    const formData = new FormData();
    formData.append('submit_type', submitNow ? 'submit' : 'draft');

    Object.keys(visitData).forEach((key) => {
      const value = visitData[key as keyof VisitFormData];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    photos.forEach((photo, index) => {
      formData.append('photos', photo);
      formData.append(`photo_${index}_category`, photo.category || 'general');
      formData.append(`photo_${index}_description`, photo.description || '');
    });

    const response = await apiClient.post(`/sites/${siteId}/visit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  getDrafts: async () => {
    const response = await apiClient.get('/sites/maintenance/my-drafts');
    return response.data;
  },

  updateDraft: async (
    maintenanceId: string,
    updates: Partial<VisitFormData> & { edit_reason?: string },
    newPhotos: PhotoFile[] = [],
    submitNow: boolean = false
  ) => {
    const formData = new FormData();
    formData.append('submit_now', submitNow ? 'true' : 'false');

    Object.keys(updates).forEach((key) => {
      const value = updates[key as keyof typeof updates];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    newPhotos.forEach((photo, index) => {
      formData.append('new_photos', photo);
      formData.append(`photo_${index}_category`, photo.category || 'general');
      formData.append(`photo_${index}_description`, photo.description || '');
    });

    const response = await apiClient.put(`/sites/maintenance/${maintenanceId}/update-draft`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  startMaintenanceTask: async (maintenanceId: string) => {
    const response = await apiClient.post(`/technician/maintenance/${maintenanceId}/start`);
    return response.data;
  },

  completeMaintenanceTask: async (maintenanceId: string, completionNotes: string) => {
    const response = await apiClient.post(`/technician/maintenance/${maintenanceId}/complete`, {
      completion_notes: completionNotes,
    });
    return response.data;
  },
};
