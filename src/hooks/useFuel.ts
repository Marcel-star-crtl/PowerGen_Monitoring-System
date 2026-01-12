import { useState, useCallback } from 'react';
import { dieselManagerAPI, handleApiError } from '@/api';
import { PaginationParams } from '@/types/common.types';

interface DeliveryData {
  delivered_quantity: number;
  delivered_by: string;
  notes?: string;
}

interface FuelRequestData {
  site_id: string;
  fuel_requested: number;
  request_reason: string;
  request_urgency: string;
  current_fuel_level?: number;
  tank_capacity?: number;
}

interface UseFuelReturn {
  loading: boolean;
  error: string | null;
  getDashboard: (period?: number) => Promise<any>;
  getFuelConsumption: (siteId: string, params?: any) => Promise<any>;
  getPendingRequests: (params?: PaginationParams & { urgency?: string }) => Promise<any>;
  createFuelRequest: (data: FuelRequestData) => Promise<any>;
  approveFuelRequest: (requestId: string, notes: string) => Promise<any>;
  rejectFuelRequest: (requestId: string, reason: string) => Promise<any>;
  markDelivered: (requestId: string, deliveryData: DeliveryData) => Promise<any>;
  getLowFuelAlerts: (threshold?: number) => Promise<any>;
  getSites: () => Promise<any>;
}

export const useFuel = (): UseFuelReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboard = useCallback(async (period: number = 30) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.getDashboard(period);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFuelConsumption = useCallback(async (siteId: string, params: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.getFuelConsumptionBySite(siteId, params);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingRequests = useCallback(async (params: PaginationParams & { urgency?: string } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.getPendingRequests(params);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFuelRequest = useCallback(async (data: FuelRequestData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await dieselManagerAPI.createFuelRequest(data);
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveFuelRequest = useCallback(async (requestId: string, notes: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.approveFuelRequest(requestId, notes);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectFuelRequest = useCallback(async (requestId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.rejectFuelRequest(requestId, reason);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markDelivered = useCallback(async (requestId: string, deliveryData: DeliveryData) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.markFuelDelivered(requestId, deliveryData);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLowFuelAlerts = useCallback(async (threshold: number = 25) => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.getLowFuelAlerts(threshold);
      return data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dieselManagerAPI.getSites();
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
    getDashboard,
    getFuelConsumption,
    getPendingRequests,
    createFuelRequest,
    approveFuelRequest,
    rejectFuelRequest,
    markDelivered,
    getLowFuelAlerts,
    getSites,
  };
};