/**
 * dieselApi.ts
 * Axios-based API client for all diesel system endpoints.
 * Wraps every backend route with typed return values.
 *
 * Interceptor pattern (auth header injection, dev logging, 401 refresh-and-retry,
 * centralized error normalization) mirrors apiClient.ts so both clients behave
 * identically in production.
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse as CommonApiResponse } from '@/types/common.types';
import type {
  ApiResponse, DieselCycle, SiteBudget, DieselAlert,
  CycleReconciliation, ClusterSummary, CmsUpload, CmsDailyRecord,
  FieldVisitRecord, TomCardTransaction, TomCardSummary, TomCardMapping,
  GeneratorLedgerEntry, DashboardKPIs, DailyTrend, ValidationUpload, ValidationRecord
} from '../types/diesel.types';

// ─── Base URL ────────────────────────────────────────────────────────────────
// REACT_APP_API_URL is baked in at build time (CRA). Set it in your hosting
// platform's build environment settings — a local .env file alone will not
// affect a build run on Vercel/Netlify/Render/etc.
const API_BASE_URL: string = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  // Fails loudly instead of silently shipping a build wired to localhost.
  console.error(
    '[dieselApi] REACT_APP_API_URL is not set — falling back to localhost, ' +
    'which will not work in production. Set it in your build environment.'
  );
}

// ─── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ─── Response interceptor (dev logging + 401 refresh-and-retry) ─────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<CommonApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data!;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    return Promise.reject(error);
  }
);

// ─── Centralized error normalization ─────────────────────────────────────────
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      switch (status) {
        case 400:
          return { message: data.message || 'Invalid request', errors: data.errors };
        case 401:
          return { message: 'Unauthorized - Please login' };
        case 403:
          return { message: 'Access denied - Insufficient permissions' };
        case 404:
          return { message: data.message || 'Resource not found' };
        case 500:
          return { message: 'Server error - Please try again later' };
        default:
          return { message: data.message || 'An error occurred' };
      }
    } else if (axiosError.request) {
      return { message: 'Network error - Check your connection' };
    }
  }
  return { message: 'An unexpected error occurred' };
};

// ─── Request helpers ─────────────────────────────────────────────────────────
const get   = <T>(url: string, params?: any) => api.get<ApiResponse<T>>(url, { params }).then(r => r.data);
const post  = <T>(url: string, data?: any)   => api.post<ApiResponse<T>>(url, data).then(r => r.data);
const patch = <T>(url: string, data?: any)   => api.patch<ApiResponse<T>>(url, data).then(r => r.data);
const del   = <T>(url: string)               => api.delete<ApiResponse<T>>(url).then(r => r.data);

// async function uploadFile<T>(url: string, file: File, extraFields?: Record<string, string>) {
//   const form = new FormData();
//   form.append('file', file);
//   if (extraFields) Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
//   const r = await api.post<ApiResponse<T>>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
//   return r.data;
// }

async function uploadFile<T>(
  url: string,
  file: File,
  extraFields?: Record<string, string>,
  onProgress?: (percent: number) => void
) {
  const form = new FormData();
  form.append('file', file);
  if (extraFields) Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));

  const r = await api.post<ApiResponse<T>>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutes — uploads/parsing take longer than normal API calls
    onUploadProgress: onProgress
      ? (e) => {
          if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        }
      : undefined,
  });
  return r.data;
}

// ─── Cycles ───────────────────────────────────────────────────────────────────
export const cyclesApi = {
  list:    ()                            => get<DieselCycle[]>('/cycles'),
  current: ()                            => get<DieselCycle>('/cycles/current'),
  close:   (key: string, notes?: string) => patch<DieselCycle>(`/cycles/${key}/close`, { notes }),
  create:  (data: any)                   => post<DieselCycle>('/cycles', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
// ─── Sites Directory (flexible filter/export, not cycle-gated) ────────────────
export const sitesDirectoryApi = {
  list: (params: Record<string, string | undefined>) => {
    const clean: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => { if (v) clean[k] = v; });
    return get<any[]>('/sites', clean);
  },
};

// ─── CMS vs Field Data Source Comparison ────────────────────────────────────
export const dataSourceComparisonApi = {
  get: (cycle_key: string) => get<any>(`/data-sources/${cycle_key}`),
};

// ─── AI Fleet Insights ───────────────────────────────────────────────────────
// ─── Recovered Historical Email Data ────────────────────────────────────────
// Live-system stock reporting — genuinely distinct from
// historicalDataApi below, which serves the recovered email archive.
export const stockApi = {
  live: () => get<any>('/stock/live'),
  cycleSnapshots: () => get<any>('/stock/cycle-snapshots'),
  cycleSnapshot: (cycle_key: string) => get<any>(`/stock/cycle-snapshots/${cycle_key}`),
  snapshotNow: () => post<any>('/stock/snapshot-now'),
  carryover: (cycle_key: string) => get<any>(`/stock/carryover/${cycle_key}`),
};

// ─── Tank Audit — see SITE TANK AUDIT PLAN ──────────────────────────────────
// Reads the same /api/technician/tank-audits routes the mobile app
// submits to; this dashboard view is read-only (list, single record,
// and the summary rollup), not a second write path.
export const tankAuditApi = {
  list: (params?: { status?: string; siteId?: string; severity?: string; logsCollected?: string; page?: number; limit?: number }) =>
    get<any>('/technician/tank-audits', params),
  get: (id: string) => get<any>(`/technician/tank-audits/${id}`),
  summary: () => get<any>('/technician/tank-audits/summary'),
};

export const historicalDataApi = {
  summary: () => get<any>('/historical/summary'),
  reserves: (month_key: string) => get<any>(`/historical/reserves/${month_key}`),
  siteHistory: (site_id: string) => get<any>(`/historical/site/${site_id}`),
  adhocRequests: () => get<any>('/historical/adhoc-requests'),
  midCycleRelease: (release_cycle_key: string) => get<any>(`/historical/mid-cycle-release/${release_cycle_key}`),
  tomCardAllocations: () => get<any>('/historical/tomcard-allocations'),
  requestApproval: (cycle_key: string) => get<any>(`/historical/request-approval/${cycle_key}`),
  debitSummary: () => get<any>('/historical/debit-summary'),
  fieldVisits: (site_id: string) => get<any>(`/historical/field-visits/${site_id}`),
  fieldVisitsSummary: (month_key: string) => get<any>(`/historical/field-visits-summary/${month_key}`),
  fuelPurchases: (month_key: string) => get<any>(`/historical/fuel-purchases/${month_key}`),
  siteStockSnapshots: () => get<any>('/historical/site-stock-snapshots'),
  fullSummary: (month_key: string) => get<any>(`/historical/full-summary/${month_key}`),
  midCycleEstimate: (month_key: string) => get<any>(`/historical/mid-cycle-estimate/${month_key}`),
  plannedVsSupplied: (month_key: string) => get<any>(`/historical/planned-vs-supplied/${month_key}`),
};

export const aiInsightsApi = {
  briefing: (cycle_key: string, refresh = false) =>
    get<any>(`/ai-insights/briefing/${cycle_key}`, refresh ? { refresh: 'true' } : undefined),
};

// ─── Automated Budget Planning ───────────────────────────────────────────────
export const budgetPlanningApi = {
  preview: (cycle_key: string, days?: number) =>
    get<any>(`/budget-plan/${cycle_key}`, days ? { days } : undefined),
  siteDetail: (cycle_key: string, site_id: string, days?: number) =>
    get<any>(`/budget-plan/${cycle_key}/site/${site_id}`, days ? { days } : undefined),
  commit: (cycle_key: string, sites: any[]) =>
    post<any>(`/budget-plan/${cycle_key}/commit`, { sites }),
  history: (site_id: string) => get<any>(`/budget-plan/history/${site_id}`),
  fleetTrend: () => get<any>('/budget-plan/fleet-trend'),
};

// ─── Theft/Anomaly Investigation ────────────────────────────────────────────
export const theftInvestigationApi = {
  get: (site_id: string, cycle_key: string) => get<any>(`/theft-investigation/${site_id}/${cycle_key}`),
};

// ─── Route Optimization ─────────────────────────────────────────────────────
export const routeOptimizationApi = {
  optimize: (site_ids: string[], start_lat: number, start_lng: number) =>
    post<any>('/route-optimize', { site_ids, start_lat, start_lng }),
};

// ─── Technician Tracking (privacy-limited: active jobs only, no history) ───────
export const technicianTrackingApi = {
  active: () => get<any[]>('/technician-tracking/active'),
};

// ─── Sites Map (live map) ──────────────────────────────────────────────────────
export const sitesMapApi = {
  forCycle: (cycle_key: string) => get<any[]>(`/sites-map/${cycle_key}`),
};

export const dashboardApi = {
  kpis:       (cycle_key: string)       => get<DashboardKPIs>(`/dashboard/kpis/${cycle_key}`),
  clusterMap: (cycle_key: string)       => get<ClusterSummary[]>(`/dashboard/cluster-heatmap/${cycle_key}`),
  dailyTrend: (cycle_key: string)       => get<DailyTrend[]>(`/dashboard/daily-trend/${cycle_key}`),
  lowFuel:    (threshold_l?: number)    => get<CmsDailyRecord[]>('/dashboard/low-fuel', { threshold_l }),
  zeroGrid:   ()                        => get<CmsDailyRecord[]>('/dashboard/zero-grid'),
  cycles:     ()                        => get<DieselCycle[]>('/dashboard/cycles'),
};

// ─── CMS ─────────────────────────────────────────────────────────────────────
// ─── Tank Level (daily telemetry) ──────────────────────────────────────────────
// Distinct from cmsApi — different source/format (RMS/telemetry export with
// Value=current fuel level in liters, not the CMS/ERS daily record). See
// models/TankLevelReading.js for the full explanation.
export const tankLevelApi = {
  upload: (file: File, reading_date: string) =>
    uploadFile('/tank-level/upload', file, { reading_date }),
  uploads:  (params?: any) => get<any[]>('/tank-level/uploads', params),
  readings: (params?: { reading_date?: string; cluster?: string; status?: string }) =>
    get<any[]>('/tank-level/readings', params),
  siteLatest: (site_id: string) => get<any>(`/tank-level/site/${site_id}/latest`),
};

// ─── Tom Card Cycle Budget (cycle-opening card budget/limit upload) ────────────
// Distinct from tomCardApi — that's the vendor STATEMENT (transactions
// already spent). This is the cycle-OPENING budget/limit aggregate,
// uploaded once per cycle, that feeds the mobile fuel-purchase card picker
// (GET .../for-purchase-form matches the shape new-fuel-purchase.tsx
// already expects). See models/TomCardCycleBudget.js.
export const tomCardCycleBudgetApi = {
  upload: (file: File, cycle_key: string) =>
    uploadFile('/tomcard-cycle-budget/upload', file, { cycle_key }),
  uploads: (params?: any) => get<any[]>('/tomcard-cycle-budget/uploads', params),
  byCycle: (cycle_key: string) => get<any[]>(`/tomcard-cycle-budget/${cycle_key}`),
};

export const cmsApi = {
  upload: (file: File, cycle_key?: string) =>
    uploadFile('/cms/upload', file, cycle_key ? { cycle_key } : undefined),
  uploads:      (params?: any)          => get<CmsUpload[]>('/cms/uploads', params),
  uploadDetail: (id: string)            => get<CmsUpload>(`/cms/uploads/${id}`),
  missingDays:  (cycle_key: string)     => get<{
    missing_days: string[];
    missing_count: number;
    uploaded_count: number;
  }>(`/cms/missing-days/${cycle_key}`),
  daily:        (site_id: string, params?: any) => get<CmsDailyRecord[]>(`/cms/daily/${site_id}`, params),
  reprocess:    (upload_id: string)     => post(`/cms/reprocess/${upload_id}`),
};

// ─── GRATO ────────────────────────────────────────────────────────────────────
export const gratoApi = {
  uploadMain:    (file: File, cycle_key?: string) =>
    uploadFile('/grato/upload/main', file, cycle_key ? { cycle_key } : undefined),
  uploadBook11:  (file: File, cycle_key: string)  =>
    uploadFile('/grato/upload/book11', file, { cycle_key }),
  uploads:       (params?: any)         => get('/grato/uploads', params),
  visitsBySite:  (site_id: string, params?: any) =>
    get<FieldVisitRecord[]>(`/grato/visits/${site_id}`, params),
  visitsByCycle: (cycle_key: string, params?: any) =>
    get<FieldVisitRecord[]>(`/grato/visits/cycle/${cycle_key}`, params),
  missing:       (cycle_key: string)    => get<{
    missing_count: number;
    sites: SiteBudget[];
  }>(`/grato/missing/${cycle_key}`),
  upload:        (file: File, cycle_key?: string, upload_type = 'auto') =>
    uploadFile('/grato/upload', file, { ...(cycle_key ? { cycle_key } : {}), upload_type }),
  getStats:      (cycle_key: string)    => get<any>(`/grato/stats/${cycle_key}`),
};

// ─── Tom Card ─────────────────────────────────────────────────────────────────
export const tomCardApi = {
  upload:        (file: File, cycle_key?: string) =>
    uploadFile('/tomcard/upload', file, cycle_key ? { cycle_key } : undefined),
  transactions:  (params?: any)         => get<TomCardTransaction[]>('/tomcard/transactions', params),
  summary:       (cycle_key: string)    => get<TomCardSummary>(`/tomcard/summary/${cycle_key}`),
  mappings:      ()                     => get<TomCardMapping[]>('/tomcard/mappings'),
  saveMapping:   (data: any)            => post<TomCardMapping>('/tomcard/mappings', data),
  deleteMapping: (card_num: string)     => del(`/tomcard/mappings/${card_num}`),
  uploads:       ()                     => get('/tomcard/uploads'),
  /**
   * Cards/stations still unmapped or only weakly matched (station-name
   * guess), ranked by liters purchased. Used to prioritize which mappings
   * to add — previously these transactions were invisible once imported.
   */
  unmapped:      (cycle_key?: string)   => get<{
    card_num: string;
    station_name: string;
    mapping_confidence: 'station_match' | 'unlinked';
    total_liters: number;
    total_cfa: number;
    transactions: number;
    last_seen: string;
  }[]>('/tomcard/unmapped', cycle_key ? { cycle_key } : undefined),
};

// ─── Reconciliation ───────────────────────────────────────────────────────────
export const reconciliationApi = {
  byCycle:        (cycle_key: string, params?: any) =>
    get<CycleReconciliation[]>(`/reconciliation/${cycle_key}`, params),
  bySite:         (cycle_key: string, site_id: string) =>
    get<CycleReconciliation>(`/reconciliation/${cycle_key}/site/${site_id}`),
  clusterSummary: (cycle_key: string)   => get<ClusterSummary[]>(`/reconciliation/cluster/${cycle_key}`),
  run:            (cycle_key: string, site_id?: string) =>
    post(`/reconciliation/run/${cycle_key}`, { site_id }),
  override:       (cycle_key: string, site_id: string, override_notes: string) =>
    patch(`/reconciliation/${cycle_key}/site/${site_id}/override`, { override_notes }),
  alertSummary:   (cycle_key: string)   => get(`/reconciliation/alerts/summary/${cycle_key}`),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  list:        (params?: any)           => get<DieselAlert[]>('/alerts', params),
  unreadCount: ()                       => get<{ count: number }>('/alerts/unread-count'),
  acknowledge: (id: string)             => patch<DieselAlert>(`/alerts/${id}/acknowledge`),
  resolve:     (id: string, note: string) =>
    patch<DieselAlert>(`/alerts/${id}/resolve`, { resolution_note: note }),
  readAll:     ()                       => patch('/alerts/read-all'),
  markRead:    (id: string)             => patch(`/alerts/${id}/read`),
  dismiss:     (id: string)             => del(`/diesel-notifications/${id}`),
};

// // ─── Reports ──────────────────────────────────────────────────────────────────
// export const reportsApi = {
//   downloadCycle:   (cycle_key: string) =>
//     `${API_BASE_URL}/reports/cycle/${cycle_key}/excel`,
//   downloadSite:    (site_id: string, cycle_key: string) =>
//     `${API_BASE_URL}/reports/site/${site_id}/${cycle_key}/excel`,
//   downloadTomCard: (cycle_key: string) =>
//     `${API_BASE_URL}/reports/tomcard/${cycle_key}/excel`,

//   /**
//    * Authenticated programmatic download.
//    * Uses fetch with the same accessToken as the interceptor — avoids a bare
//    * <a href> which would strip the Authorization header.
//    */
//   downloadFile: async (url: string, filename: string): Promise<void> => {
//     const token = localStorage.getItem('accessToken');
//     const res = await fetch(`${API_BASE_URL}${url}`, {
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     });
//     if (!res.ok) {
//       const err = await res.text();
//       throw new Error(`Download failed (${res.status}): ${err.slice(0, 200)}`);
//     }
//     const blob = await res.blob();
//     const a = document.createElement('a');
//     a.href = URL.createObjectURL(blob);
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(a.href);
//   },
// };


// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  // These return paths relative to API_BASE_URL for use with downloadFile
  cyclePath:   (cycle_key: string) => `/reports/cycle/${cycle_key}/excel`,
  sitePath:    (site_id: string, cycle_key: string) => `/reports/site/${site_id}/${cycle_key}/excel`,
  tomCardPath: (cycle_key: string) => `/reports/tomcard/${cycle_key}/excel`,

  downloadFile: async (path: string, filename: string): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    const url = `${API_BASE_URL}${path}`;          // single, controlled prefix
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Download failed (${res.status}): ${err.slice(0, 200)}`);
    }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },
};

// ─── Generator Ledger ─────────────────────────────────────────────────────────
export const generatorLedgerApi = {
  list:        (params?: any)           => get<GeneratorLedgerEntry[]>('/generator-ledger', params),
  siteHistory: (site_id: string)        => get<GeneratorLedgerEntry[]>(`/generator-ledger/site/${site_id}`),
  assign:      (data: any)              => post<GeneratorLedgerEntry>('/generator-ledger/assign', data),
  swap:        (data: any)              => post('/generator-ledger/swap', data),
};

// ─── Site Budget ──────────────────────────────────────────────────────────────
export const siteBudgetApi = {
  byCycle: (cycle_key: string, params?: any) =>
    get<SiteBudget[]>(`/site-budget/${cycle_key}`, params),
  bySite:  (cycle_key: string, site_id: string) =>
    get<SiteBudget>(`/site-budget/${cycle_key}/${site_id}`),
  update:  (cycle_key: string, site_id: string, data: any) =>
    patch<SiteBudget>(`/site-budget/${cycle_key}/${site_id}`, data),

  /**
   * Upload the Book11 Budget file. cycle_key is REQUIRED — this file has
   * no per-row date column the backend can derive a cycle from (unlike
   * CMS/Validation), so the person uploading must pick the cycle explicitly.
   *
   * NOTE: path is '/site-budget-upload' (its own mount), not
   * '/site-budget/upload' — the latter has no matching backend route.
   */
  upload:  (file: File, cycle_key: string) =>
    uploadFile('/site-budget-upload', file, { cycle_key }),
  uploads: (params?: any) => get<any[]>('/site-budget/uploads', params),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: any) => get<DieselAlert[]>('/notifications', params),
};

// ─── Validation ───────────────────────────────────────────────────────────────
export const validationApi = {
  /**
   * Upload the GRATO Validation Template file (.xlsx with "Main" and
   * "Validation" sheets). No cycle_key is sent — the backend derives the
   * cycle independently for each Validation-sheet row from its own
   * "CURRENT DATE" column (the two sheets in a single file are not
   * guaranteed to share a cycle).
   */
  upload:  (file: File) => uploadFile('/validation/upload', file),
  uploads: (params?: any) => get<ValidationUpload[]>('/validation/uploads', params),
  records: (cycle_key: string) => get<ValidationRecord[]>(`/validation/records/${cycle_key}`),
  stats:   (cycle_key: string) => get<any>(`/validation/stats/${cycle_key}`),
};


// ── Fuel Request Approval Chain API ──────────────────────────────────────────
// New 6-level approval system (Coordinator → Operations → Technical → Finance → HOB → CEO)
export const fuelRequestApi = {
  create:         (data: any)                  => api.post('/fuel-requests', data).then(r => r.data),
  list:           (params?: any)               => api.get('/fuel-requests', { params }).then(r => r.data),
  get:            (id: string)                 => api.get(`/fuel-requests/${id}`).then(r => r.data),
  pendingForMe:   ()                           => api.get('/fuel-requests/pending-for-me').then(r => r.data),
  scheduledForMe: ()                           => api.get('/fuel-requests/scheduled-for-me').then(r => r.data),
  sites:          (params?: any)               => api.get('/fuel-requests/sites', { params }).then(r => r.data),
  siteCycle:      (siteId: string, key: string) => api.get(`/fuel-requests/site/${siteId}/cycle/${key}`).then(r => r.data),
  budgetAlerts:   (threshold = 50)             => api.get('/fuel-requests/budget-alerts', { params: { threshold_liters: threshold } }).then(r => r.data),
  financeReport:  (cycle: string)              => api.get(`/fuel-requests/finance-report/${cycle}`).then(r => r.data),
  approve:        (id: string, data?: any)     => api.patch(`/fuel-requests/${id}/approve`, data || {}).then(r => r.data),
  reject:         (id: string, comments: string) => api.patch(`/fuel-requests/${id}/reject`, { comments }).then(r => r.data),
  assign:         (id: string, data: any)      => api.patch(`/fuel-requests/${id}/assign`, data).then(r => r.data),
  disburse:       (id: string, data: any)      => api.patch(`/fuel-requests/${id}/disburse`, data).then(r => r.data),
  linkRefuel:       (id: string, data: any)    => api.patch(`/fuel-requests/${id}/link-refuel`, data).then(r => r.data),
  cancel:           (id: string, data?: { reason?: string }) => api.patch(`/fuel-requests/${id}/cancel`, data).then(r => r.data),
  emergencyApprove: (id: string, data: { override_reason: string; liters_approved?: number; comments?: string }) =>
    api.patch(`/fuel-requests/${id}/emergency-approve`, data).then(r => r.data),
};

export const fuelPlanningApi = {
  predict:     (cycle: string, params?: any)      => api.get(`/fuel-planning/predict/${cycle}`, { params }).then(r => r.data),
  predictSite: (cycle: string, siteId: string, gemini = false) =>
    api.get(`/fuel-planning/predict/${cycle}/site/${siteId}`, { params: { gemini: gemini ? 1 : 0 } }).then(r => r.data),
  schedule:    (cycle: string)                   => api.get(`/fuel-planning/schedule/${cycle}`).then(r => r.data),
  summary:     (cycle: string)                   => api.get(`/fuel-planning/summary/${cycle}`).then(r => r.data),
  autoRequest: (cycle: string)                   => api.post(`/fuel-planning/auto-request/${cycle}`).then(r => r.data),
};

export default api;








