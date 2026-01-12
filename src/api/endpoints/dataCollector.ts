import apiClient from '../client';
import { ApiResponse } from '@/types/common.types';

interface DataCollectorDashboard {
  sites: {
    total: number;
    with_visits: number;
    needing_visits: number;
    visit_coverage: number;
  };
  technicians: {
    total: number;
    active: number;
    inactive: number;
  };
  records: {
    maintenance: number;
    fuel: number;
  };
  data_quality: {
    score: number;
    total_sites: number;
    total_fields_checked: number;
    completed_fields: number;
  };
}

export const dataCollectorAPI = {
  getDashboard: async (): Promise<DataCollectorDashboard> => {
    const response = await apiClient.get<ApiResponse<DataCollectorDashboard>>('/data-collector/dashboard');
    return response.data.data!;
  },

  getDataQualityReport: async () => {
    const response = await apiClient.get('/data-collector/reports/data-quality');
    return response.data.data;
  },

  getMissingDataReport: async () => {
    const response = await apiClient.get('/data-collector/reports/missing-data');
    return response.data.data;
  },

  exportAllData: async (dataType: 'all' | 'sites' | 'technicians' | 'maintenance' = 'all') => {
    const response = await apiClient.get('/data-collector/export/all', {
      params: { data_type: dataType },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_export_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Export downloaded successfully' };
  },

  getTechnicianActivityReport: async (period: number = 30) => {
    const response = await apiClient.get('/data-collector/reports/technician-activity', {
      params: { period },
    });
    return response.data.data;
  },

  getVisitCoverageReport: async (groupBy: 'region' | 'cluster' = 'region') => {
    const response = await apiClient.get('/data-collector/reports/visit-coverage', {
      params: { group_by: groupBy },
    });
    return response.data.data;
  },
};



