import apiClient from '../client';
import { ApiResponse } from '@/types/common.types';

export const intelligenceAPI = {
    // Get maintenance advice
    getMaintenanceAdvice: async (taskDetails: any) => {
        const response = await apiClient.post('/intelligence/advice', { taskDetails });
        return response.data;
    },

    // Enhance report
    enhanceReport: async (notes: string) => {
        const response = await apiClient.post('/intelligence/enhance-report', { notes });
        return response.data;
    },

    // Get cluster insights (Supervisor)
    getClusterInsights: async (stats: any) => {
        const response = await apiClient.post('/intelligence/insights', { stats });
        return response.data;
    },

    // Chat
    chat: async (message: string) => {
        const response = await apiClient.post('/intelligence/chat', { message });
        return response.data;
    },
};
