/**
 * fuelRequestAPI.ts
 * src/api/endpoints/fuelRequest.ts
 *
 * ADD THIS FILE to your project at src/api/endpoints/fuelRequest.ts
 *
 * Exports fuelRequestApi — the typed client for all /api/fuel-requests endpoints.
 * Uses the same apiClient that every other endpoint in this project uses,
 * so auth headers, interceptors, and token refresh all apply automatically.
 *
 * HOW TO USE:
 *   import { fuelRequestApi } from '@/api/endpoints/fuelRequest';
 *
 * Also add to your API barrel (src/api/index.ts):
 *   export { fuelRequestApi } from './endpoints/fuelRequest';
 *
 * NOTE: FuelRequestsPage.tsx and ScheduledPage.tsx contain an inline copy
 * of fuelRequestApi so they compile immediately without this file existing.
 * Once you create this file you can remove the inline copies from those pages
 * and import from here instead.
 */

import apiClient from '../client';

export const fuelRequestApi = {
  /** Create a new fuel request (web: diesel_manager/admin; mobile: technician/fuel) */
  create: (data: {
    site_id: string;
    liters_requested: number;
    request_reason: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    current_fuel_level?: number;
    tank_capacity?: number;
    assigned_to?: string;
    scheduled_date?: string;
    client_id?: string;
    request_source?: 'web' | 'mobile';
  }) => apiClient.post('/fuel-requests', data).then(r => r.data),

  /** List requests with optional filters */
  list: (params?: {
    status?: string;
    cycle_key?: string;
    site_id?: string;
    urgency?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get('/fuel-requests', { params }).then(r => r.data),

  /** Single request detail */
  get: (id: string) =>
    apiClient.get(`/fuel-requests/${id}`).then(r => r.data),

  /** Requests pending the authenticated user's approval (respects hierarchy) */
  pendingForMe: () =>
    apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),

  /** Approved/scheduled requests assigned to the authenticated refueler */
  scheduledForMe: () =>
    apiClient.get('/fuel-requests/scheduled-for-me').then(r => r.data),

  /** Full lifecycle view: budget → requests → approvals → refuels for one site × cycle */
  siteCycleLifecycle: (siteId: string, cycleKey: string) =>
    apiClient.get(`/fuel-requests/site/${siteId}/cycle/${cycleKey}`).then(r => r.data),

  /** Approve at the caller's level — Finance can override liters_approved */
  approve: (id: string, data?: { comments?: string; liters_approved?: number }) =>
    apiClient.patch(`/fuel-requests/${id}/approve`, data || {}).then(r => r.data),

  /** Reject at the caller's level — comments required */
  reject: (id: string, comments: string) =>
    apiClient.patch(`/fuel-requests/${id}/reject`, { comments }).then(r => r.data),

  /** Assign a refueler and optional scheduled date (diesel_manager/admin only, post full-approval) */
  assign: (id: string, data: { assigned_to: string; scheduled_date?: string }) =>
    apiClient.patch(`/fuel-requests/${id}/assign`, data).then(r => r.data),

  /** Link actual refuel (FuelConsumption) back to the request — closes the lifecycle */
  linkRefuel: (id: string, data: {
    fuel_consumption_id?: string;
    fuel_purchase_id?: string;
    liters_actually_added?: number;
  }) => apiClient.patch(`/fuel-requests/${id}/link-refuel`, data).then(r => r.data),

  /** Sites where remaining budget < threshold litres for the current cycle */
  budgetAlerts: (thresholdLiters = 50) =>
    apiClient.get('/fuel-requests/budget-alerts', {
      params: { threshold_liters: thresholdLiters },
    }).then(r => r.data),
};
