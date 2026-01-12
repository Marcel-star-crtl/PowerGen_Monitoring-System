import { useState, useCallback } from 'react';
import { sitesAPI, technicianAPI, handleApiError } from '@/api';
import { VisitFormData } from '@/types/maintenance.types';
import { PaginationParams } from '@/types/common.types';

interface PhotoFile extends File {
  category?: string;
  description?: string;
}

interface UseSitesReturn {
  loading: boolean;
  error: string | null;
  getSites: (params?: PaginationParams & { search?: string; region?: string }) => Promise<any>;
  getSite: (siteId: string) => Promise<any>;
  submitVisit: (
    siteId: string,
    visitData: VisitFormData,
    photos?: PhotoFile[],
    submitNow?: boolean
  ) => Promise<any>;
  updateDraft: (
    maintenanceId: string,
    updates: Partial<VisitFormData> & { edit_reason?: string },
    photos?: PhotoFile[],
    submitNow?: boolean
  ) => Promise<any>;
}

export const useSites = (): UseSitesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSites = useCallback(async (params: PaginationParams & { search?: string; region?: string } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await sitesAPI.getSites(params);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSite = useCallback(async (siteId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await sitesAPI.getSite(siteId);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitVisit = useCallback(
    async (siteId: string, visitData: VisitFormData, photos: PhotoFile[] = [], submitNow: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const data = await technicianAPI.submitSiteVisit(siteId, visitData, photos, submitNow);
        return data;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateDraft = useCallback(
    async (
      maintenanceId: string,
      updates: Partial<VisitFormData> & { edit_reason?: string },
      photos: PhotoFile[] = [],
      submitNow: boolean = false
    ) => {
      setLoading(true);
      setError(null);

      try {
        const data = await technicianAPI.updateDraft(maintenanceId, updates, photos, submitNow);
        return data;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getSites,
    getSite,
    submitVisit,
    updateDraft,
  };
};
