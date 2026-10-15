/**
 * useDiesel.ts
 * Shared hooks for all diesel pages.
 *
 * KEY FIX: Every hook that takes a required param (cycle_key, site_id)
 * now skips the fetch when that param is empty/undefined, preventing
 * 404s like /api/reconciliation/?limit=300 (empty cycle_key).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  dashboardApi, cmsApi, gratoApi, tomCardApi,
  reconciliationApi, alertsApi, cyclesApi,
  generatorLedgerApi, siteBudgetApi, validationApi,
  tankLevelApi, tomCardCycleBudgetApi, gainLossApi,
} from '../api/dieselApi';
import type { DieselCycle, DashboardKPIs } from '../types/diesel.types';

// ─── Generic fetch hook ───────────────────────────────────────────────────────
// skip: when true the fetch is bypassed and loading stays false,
//        data stays null — prevents calls with missing required params.
export function useFetch<T>(
  fetcher: () => Promise<any>,
  deps: any[] = [],
  options?: { skip?: boolean; transform?: (r: any) => T }
) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (options?.skip) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (mountedRef.current) {
        setData(options?.transform ? options.transform(res) : (res.data ?? res));
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.response?.data?.message || e.message || 'Error loading data');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Cycle selector hook ──────────────────────────────────────────────────────
export function useCycles() {
  const [cycles,       setCycles]       = useState<DieselCycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState<DieselCycle | null>(null);
  const [selectedKey,  setSelectedKey]  = useState<string>('');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([cyclesApi.list(), cyclesApi.current()])
      .then(([listRes, curRes]) => {
        const list = listRes.data || [];
        const cur  = curRes.data;
        setCycles(list);
        setCurrentCycle(cur);
        setSelectedKey(cur?.cycle_key || list[0]?.cycle_key || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { cycles, currentCycle, selectedKey, setSelectedKey, loading };
}

// // ─── Dashboard hooks ──────────────────────────────────────────────────────────
// export function useDashboard(cycle_key: string) {
//   return useFetch(
//     () => dashboardApi.kpis(cycle_key),
//     [cycle_key],
//     { skip: !cycle_key }
//   );
// }

export function useDashboard(cycle_key: string) {
  return useFetch<DashboardKPIs>(
    () => dashboardApi.kpis(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useDailyTrend(cycle_key: string) {
  return useFetch(
    () => dashboardApi.dailyTrend(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useClusterHeatmap(cycle_key: string) {
  return useFetch(
    () => dashboardApi.clusterMap(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useLowFuel(threshold_l = 500) {
  return useFetch(
    () => dashboardApi.lowFuel(threshold_l),
    [threshold_l]
  );
}

export function useZeroGrid() {
  return useFetch(() => dashboardApi.zeroGrid(), []);
}

// ─── CMS hooks ────────────────────────────────────────────────────────────────
export function useCmsUploads(cycle_key?: string) {
  return useFetch(
    () => cmsApi.uploads({ cycle_key }),
    [cycle_key]
  );
}

// ─── Tank Level ────────────────────────────────────────────────────────────────
export function useTankLevelUploads(params?: any) {
  return useFetch(() => tankLevelApi.uploads(params), [JSON.stringify(params)]);
}
export function useTankLevelReadings(params?: { reading_date?: string; cluster?: string; status?: string }) {
  return useFetch(() => tankLevelApi.readings(params), [JSON.stringify(params)]);
}

// ─── Tom Card Cycle Budget ───────────────────────────────────────────────────────
export function useTomCardCycleBudgetUploads(params?: any) {
  return useFetch(() => tomCardCycleBudgetApi.uploads(params), [JSON.stringify(params)]);
}
export function useTomCardCycleBudget(cycle_key: string) {
  return useFetch(() => tomCardCycleBudgetApi.byCycle(cycle_key), [cycle_key]);
}

export function useMissingDays(cycle_key: string) {
  return useFetch(
    () => cmsApi.missingDays(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

// ─── GRATO hooks ──────────────────────────────────────────────────────────────
export function useGratoUploads(cycle_key?: string) {
  return useFetch(
    () => gratoApi.uploads({ cycle_key }),
    [cycle_key]
  );
}

export function useMissingGrato(cycle_key: string) {
  return useFetch(
    () => gratoApi.missing(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useFieldVisits(cycle_key: string, params?: any) {
  return useFetch(
    () => gratoApi.visitsByCycle(cycle_key, params),
    [cycle_key, JSON.stringify(params)],
    { skip: !cycle_key }
  );
}

// ─── Reconciliation hooks ─────────────────────────────────────────────────────
export function useReconciliation(cycle_key: string, params?: any) {
  return useFetch(
    () => reconciliationApi.byCycle(cycle_key, params),
    [cycle_key, JSON.stringify(params)],
    { skip: !cycle_key }
  );
}

export function useSiteReconciliation(cycle_key: string, site_id: string) {
  return useFetch(
    () => reconciliationApi.bySite(cycle_key, site_id),
    [cycle_key, site_id],
    { skip: !cycle_key || !site_id }
  );
}

export function useClusterSummary(cycle_key: string) {
  return useFetch(
    () => reconciliationApi.clusterSummary(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useTechnicianIntegrity(cycle_key: string, params?: { page?: number; limit?: number }) {
  return useFetch(
    () => reconciliationApi.technicianIntegrity(cycle_key, params),
    [cycle_key, JSON.stringify(params)],
    { skip: !cycle_key }
  );
}

// ─── Gain/Loss Tracker hooks ──────────────────────────────────────────────────
// Live, current-cycle (FieldVisitRecord/CycleReconciliation) — see
// gainLossRoutes.js docblock for why this is NOT the same data source as
// History Analysis's own gain/loss figures.
export function useGainLossTracker(cycle_key: string) {
  return useFetch(
    () => gainLossApi.tracker(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useGainLossDetail(cycle_key: string, site_id: string) {
  return useFetch(
    () => gainLossApi.trackerDetail(cycle_key, site_id),
    [cycle_key, site_id],
    { skip: !cycle_key || !site_id }
  );
}

// ─── Alerts hooks ─────────────────────────────────────────────────────────────
export function useAlerts(params?: any) {
  return useFetch(
    () => alertsApi.list(params),
    [JSON.stringify(params)]
  );
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    alertsApi.unreadCount().then(r => setCount(r.data?.count || 0)).catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);
  return { count, refresh };
}

// ─── Tom Card hooks ───────────────────────────────────────────────────────────
export function useTomCardSummary(cycle_key: string) {
  return useFetch(
    () => tomCardApi.summary(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}

export function useTomCardTransactions(params?: any) {
  return useFetch(
    () => tomCardApi.transactions(params),
    [JSON.stringify(params)]
  );
}

export function useTomCardMappings() {
  return useFetch(() => tomCardApi.mappings(), []);
}

/** Cards/stations still unmapped or weakly matched — ranked by liters, for
 *  the "needs a mapping" panel on TomCardPage. */
export function useTomCardUnmapped(cycle_key?: string) {
  return useFetch(() => tomCardApi.unmapped(cycle_key), [cycle_key]);
}

// ─── Generator ledger hooks ───────────────────────────────────────────────────
export function useGeneratorLedger(params?: any) {
  return useFetch(
    () => generatorLedgerApi.list(params),
    [JSON.stringify(params)]
  );
}

export function useSiteGenHistory(site_id: string) {
  return useFetch(
    () => generatorLedgerApi.siteHistory(site_id),
    [site_id],
    { skip: !site_id }
  );
}

// ─── Site budget hooks ────────────────────────────────────────────────────────
export function useSiteBudgets(cycle_key: string, params?: any) {
  return useFetch(
    () => siteBudgetApi.byCycle(cycle_key, params),
    [cycle_key, JSON.stringify(params)],
    { skip: !cycle_key }
  );
}

// ─── File upload hook ─────────────────────────────────────────────────────────
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<any>(null);
  const [error,     setError]     = useState<string | null>(null);

  const upload = useCallback(async (uploader: () => Promise<any>) => {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploader();
      setResult(res);
      return res;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || 'Upload failed';
      setError(msg);
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    result,
    error,
    upload,
    reset: () => { setResult(null); setError(null); },
  };
}


export function useValidationUploads(params?: any) {
  return useFetch(
    () => validationApi.uploads(params),
    [JSON.stringify(params)]
  );
}
 
export function useValidationRecords(cycle_key: string) {
  return useFetch(
    () => validationApi.records(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}
 
export function useValidationStats(cycle_key: string) {
  return useFetch(
    () => validationApi.stats(cycle_key),
    [cycle_key],
    { skip: !cycle_key }
  );
}
 
export function useSiteBudgetUploads(params?: any) {
  return useFetch(
    () => siteBudgetApi.uploads(params),
    [JSON.stringify(params)]
  );
}
 