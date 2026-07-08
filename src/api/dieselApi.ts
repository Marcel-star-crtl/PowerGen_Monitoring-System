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

async function uploadFile<T>(url: string, file: File, extraFields?: Record<string, string>) {
  const form = new FormData();
  form.append('file', file);
  if (extraFields) Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
  const r = await api.post<ApiResponse<T>>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
export const dashboardApi = {
  kpis:       (cycle_key: string)       => get<DashboardKPIs>(`/dashboard/kpis/${cycle_key}`),
  clusterMap: (cycle_key: string)       => get<ClusterSummary[]>(`/dashboard/cluster-heatmap/${cycle_key}`),
  dailyTrend: (cycle_key: string)       => get<DailyTrend[]>(`/dashboard/daily-trend/${cycle_key}`),
  lowFuel:    (threshold_l?: number)    => get<CmsDailyRecord[]>('/dashboard/low-fuel', { threshold_l }),
  zeroGrid:   ()                        => get<CmsDailyRecord[]>('/dashboard/zero-grid'),
  cycles:     ()                        => get<DieselCycle[]>('/dashboard/cycles'),
};

// ─── CMS ─────────────────────────────────────────────────────────────────────
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
  dismiss:     (id: string)             => del(`/notifications/${id}`),
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
   */
  upload:  (file: File, cycle_key: string) =>
    uploadFile('/site-budget/upload', file, { cycle_key }),
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

export default api;








