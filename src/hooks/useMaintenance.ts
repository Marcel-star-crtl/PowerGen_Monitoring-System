import { useState, useCallback } from 'react';
import { technicianAPI, supervisorAPI, handleApiError } from '@/api';
import { User, PaginationParams } from '@/types/common.types';

interface UseMaintenanceReturn {
  loading: boolean;
  error: string | null;
  getTasks: (params?: PaginationParams & { status?: string }) => Promise<any>;
  approveMaintenance: (id: string, comments: string) => Promise<any>;
  rejectMaintenance: (id: string, reason: string) => Promise<any>;
  startTask: (id: string) => Promise<any>;
  completeTask: (id: string, notes: string) => Promise<any>;
}

export const useMaintenance = (userRole: User['role']): UseMaintenanceReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTasks = useCallback(
    async (params: PaginationParams & { status?: string } = {}) => {
      setLoading(true);
      setError(null);

      try {
        let data;
        if (userRole === 'technician') {
          data = await technicianAPI.getMaintenanceTasks(params);
        } else if (userRole === 'supervisor') {
          data = await supervisorAPI.getPendingMaintenance(params);
        }
        return data;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userRole]
  );

  const approveMaintenance = useCallback(async (id: string, comments: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await supervisorAPI.approveMaintenance(id, comments);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectMaintenance = useCallback(async (id: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await supervisorAPI.rejectMaintenance(id, reason);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startTask = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await technicianAPI.startMaintenanceTask(id);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTask = useCallback(async (id: string, notes: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await technicianAPI.completeMaintenanceTask(id, notes);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTasks,
    approveMaintenance,
    rejectMaintenance,
    startTask,
    completeTask,
  };
};
