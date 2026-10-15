/**
 * HistoricalAnalysisPage.tsx
 *
 * A dedicated page for the consolidated "everything done for this
 * site/cluster, this cycle" reports (Phase 143's endpoints:
 * /historical/site-cycle-report and /historical/cluster-cycle-report) —
 * split out from HistoricalDataPage.tsx (Phase 144) so this data gets
 * real charts and room to breathe, rather than living as an
 * expand-in-place panel bolted onto the Site-by-Site Reserves table.
 * HistoricalDataPage.tsx itself is untouched by this page's existence.
 *
 * Color roles are fixed and consistent across every chart on this page
 * (never re-cycled per-chart): Initial-budget figures are always blue,
 * Extra/emergency-fuel figures are always amber, Approved is always
 * green, and the four extra-fuel decision statuses use exactly the
 * same colors as HistoricalDataPage's own EXTRA_FUEL_STATUS lookup, so
 * "approved" (for example) reads as the same color everywhere in this
 * app, not just within one chart.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { historicalDataApi, reportsApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, status as statusTokens, font } from '../../styles/dieselTokens';

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function monthLabel(key: string) {
  if (!key) return key;
  const [y, m] = key.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[Number(m) - 1]} '${y.slice(2)}`;
}
const CYCLES = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];

// This page's own stated scope everywhere else — "December 2025 onward" —
// applied to the Global Summary tab's aggregates specifically (Phase 151).
// `HistoricalMonthlyRecord`/`MonthlyDebitSummary` genuinely also hold real
// April–November 2025 data (Phase 88/90), which is why the fleet-wide
// `/summary` and `/debit-summary` endpoints returned it by default — never
// exposed anywhere else on this page (CYCLES above already starts at
// Dec '25), so it only ever showed up as an unexplained May '25 start on
// these specific trend charts.
const GLOBAL_MIN_MONTH_KEY = '2025-12';

// ─── Fixed color roles — one meaning, one color, everywhere on this page ──
const COLOR = {
  initial: '#2563eb',      // blue  — regular/initial budget component
  extra: '#d97706',        // amber — extra/emergency-fuel component
  approved: '#16a34a',     // green — approved
  requested: '#64748b',    // slate — requested (neutral, not yet decided)
  delivered: '#2563eb',    // blue  — actually delivered
  fuelFound: '#0891b2',    // cyan  — tank level found at a visit
  fuelLeft: '#7c3aed',     // violet — tank level left after a visit
  fuelAdded: '#16a34a',    // green — a refuel event
  trueCph: '#d97706',      // amber — the new derived True CPH
  contractual: '#6b7280',  // gray, dashed — the fixed contractual reference
  anomaly: '#dc2626',      // red   — flagged anomaly
};
// Mirrors HistoricalDataPage.tsx's own EXTRA_FUEL_STATUS exactly (not
// imported, to keep these two pages independently deployable — but kept
// byte-for-byte identical in color so "Approved" reads the same
// everywhere this app shows an extra-fuel decision status).
const EXTRA_FUEL_STATUS: Record<string, { label: string; fg: string; bg: string }> = {
  approved: { label: 'Approved', fg: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'Rejected (0 L)', fg: '#dc2626', bg: '#fef2f2' },
  delivered: { label: 'Delivered (confirmed)', fg: '#2563eb', bg: '#eff6ff' },
  pending: { label: 'Pending — no decision recorded', fg: '#d97706', bg: '#fffbeb' },
};
function extraFuelStatusMeta(status: string) {
  return EXTRA_FUEL_STATUS[status] || EXTRA_FUEL_STATUS.pending;
}
// Fixed-order categorical set for open-ended dimensions (vendors, cards) —
// assigned by position, never re-cycled once assigned within a render.
const CATEGORICAL = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#dc2626'];

const CARD_STYLE: React.CSSProperties = { border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20, background: '#fff' };
const CHART_CARD_STYLE: React.CSSProperties = { border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 14 };
const AXIS_TICK = { fontSize: 11 };

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={CHART_CARD_STYLE}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{title}</div>
      {sub && <div style={{ fontSize: 10, color: neutral[400], marginBottom: 8 }}>{sub}</div>}
      {children}
    </div>
  );
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || ink }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: neutral[400] }}>{sub}</div>}
    </div>
  );
}

export default function HistoricalAnalysisPage() {
  const [tab, setTab] = useState<'site' | 'cluster' | 'global'>('site');

  // Phase 152 — "these reports in an excel file with charts and graphs":
  // one workbook, built live server-side, covering Global Summary, Site
  // Cycle Analysis, Cluster Cycle Analysis, and Historical Data's Complete
  // Monthly Summary all at once — not scoped to whichever tab is open.
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  async function handleExportExcel() {
    setExporting(true);
    setExportError(null);
    try {
      const filename = `PowerGen_Historical_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      await reportsApi.downloadFile(historicalDataApi.exportExcelPath(), filename);
    } catch (err: any) {
      setExportError(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  // ── Site tab ─────────────────────────────────────────────────────────
  // Phase 147: the page now shows every site's Total Requested/Approved,
  // Delivered to Site, Consumed, and Reserve immediately on landing —
  // no search-then-select step first — via one summary call per cycle
  // (`site-cycle-summary`), with a "Full Report →" button per row that
  // loads the full detail (visits, engineering, True CPH, charts) below.
  const [siteCycleKey, setSiteCycleKey] = useState('2026-07');
  const [siteSummaryList, setSiteSummaryList] = useState<any[]>([]);
  const [siteSummaryFleetCob, setSiteSummaryFleetCob] = useState<any>(null);
  const [siteSummaryLoading, setSiteSummaryLoading] = useState(true);
  const [siteQuery, setSiteQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteReport, setSiteReport] = useState<any>(null);
  const [siteReportLoading, setSiteReportLoading] = useState(false);
  const [siteReportError, setSiteReportError] = useState<string | null>(null);

  useEffect(() => {
    setSiteSummaryLoading(true);
    setSelectedSiteId('');
    setSiteReport(null);
    historicalDataApi.siteCycleSummary(siteCycleKey)
      .then((res: any) => {
        setSiteSummaryList((res as any)?.data?.sites || []);
        setSiteSummaryFleetCob((res as any)?.data?.totals?.carried_over_stock_burn || null);
      })
      .catch(() => { setSiteSummaryList([]); setSiteSummaryFleetCob(null); })
      .finally(() => setSiteSummaryLoading(false));
  }, [siteCycleKey]);

  // ── Sorting & filtering (Phase 168) — "I need to be able to
  // personally sort and filter through all this." Client-side, over the
  // already-loaded summary list, so every column below sorts/filters
  // instantly with no extra request. Accessors pull each column's value
  // (some nested, e.g. gain_loss.gain_loss_l) out of a site row; nulls
  // always sort to the bottom regardless of direction, so "no data yet"
  // never masquerades as the highest or lowest real value.
  const [siteSort, setSiteSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'site', dir: 'asc' });
  const [siteFilterCluster, setSiteFilterCluster] = useState('');
  const [siteFilterAnomalyOnly, setSiteFilterAnomalyOnly] = useState(false);

  const SITE_SORT_ACCESSORS: Record<string, (s: any) => any> = {
    site: s => (s.site_name || s.site_id || '').toLowerCase(),
    cluster: s => (s.cluster || '').toLowerCase(),
    total_requested: s => s.total_requested?.total_l,
    total_approved: s => s.total_approved?.total_l,
    delivered: s => s.delivered_to_site_l,
    consumed: s => s.consumed_l,
    gain_loss: s => s.gain_loss?.gain_loss_l,
    cob: s => s.carried_over_stock_burn?.net_change_l,
    visits: s => s.visits_this_cycle_count,
    run_hours: s => s.run_hours_total_this_cycle,
    true_cph: s => s.avg_true_cph_this_cycle,
    cph_gap: s => s.true_cph_vs_contractual,
    stability: s => s.consumption_stability?.coefficient_of_variation,
    anomalies: s => s.consumption_stability?.anomaly_interval_count,
    has_stock: s => s.has_stock,
  };
  // Text columns default to A→Z on first click; every numeric/metric
  // column defaults to "highest first" (desc), since that's what
  // "sites with the highest X" / "biggest gap" naturally means.
  const SITE_SORT_DEFAULT_DIR: Record<string, 'asc' | 'desc'> = { site: 'asc', cluster: 'asc' };
  function toggleSiteSort(key: string) {
    setSiteSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: SITE_SORT_DEFAULT_DIR[key] || 'desc' });
  }
  function sortIndicator(key: string) {
    if (siteSort.key !== key) return '';
    return siteSort.dir === 'asc' ? ' ▲' : ' ▼';
  }
  function compareSites(a: any, b: any, key: string, dir: 'asc' | 'desc') {
    const acc = SITE_SORT_ACCESSORS[key];
    const av = acc(a), bv = acc(b);
    const aNull = av == null, bNull = bv == null;
    if (aNull && bNull) return 0;
    if (aNull) return 1; // nulls always last
    if (bNull) return -1;
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    if (typeof av === 'boolean') return dir === 'asc' ? (av === bv ? 0 : av ? 1 : -1) : (av === bv ? 0 : av ? -1 : 1);
    return dir === 'asc' ? av - bv : bv - av;
  }

  const siteClusterOptions = useMemo(() => {
    const set = new Set<string>(siteSummaryList.map((s: any) => s.cluster).filter(Boolean));
    return [...set].sort();
  }, [siteSummaryList]);

  const filteredSiteSummary = useMemo(() => {
    let list = siteSummaryList;
    if (siteQuery.trim()) {
      const q = siteQuery.toLowerCase();
      list = list.filter((s: any) => (s.site_name || '').toLowerCase().includes(q) || (s.site_id || '').toLowerCase().includes(q));
    }
    if (siteFilterCluster) list = list.filter((s: any) => s.cluster === siteFilterCluster);
    if (siteFilterAnomalyOnly) list = list.filter((s: any) => s.consumption_stability?.anomaly_flag === true);
    return [...list].sort((a, b) => compareSites(a, b, siteSort.key, siteSort.dir));
  }, [siteSummaryList, siteQuery, siteFilterCluster, siteFilterAnomalyOnly, siteSort]);

  async function loadSite(site_id: string) {
    setSelectedSiteId(site_id);
    setSiteReportLoading(true);
    setSiteReportError(null);
    try {
      const res = await historicalDataApi.siteCycleReport(site_id, siteCycleKey);
      setSiteReport((res as any)?.data || res);
    } catch (err: any) {
      setSiteReport(null);
      setSiteReportError(err?.response?.data?.error || `No cycle report found for "${site_id}" in ${monthLabel(siteCycleKey)}.`);
    } finally {
      setSiteReportLoading(false);
    }
  }

  // Chart-ready derivations for the site report — recomputed only when the report itself changes.
  const reqApprovalChartData = useMemo(() => {
    if (!siteReport) return [];
    return [
      { name: 'Requested', Initial: siteReport.total_requested?.initial_l || 0, Extra: siteReport.total_requested?.extra_fuel_l || 0 },
      { name: 'Approved', Initial: siteReport.total_approved?.initial_l || 0, Extra: siteReport.total_approved?.extra_fuel_l || 0 },
    ];
  }, [siteReport]);

  const extraFuelStatusChartData = useMemo(() => {
    if (!siteReport?.extra_fuel?.totals) return [];
    const t = siteReport.extra_fuel.totals;
    return ['approved', 'rejected', 'pending', 'delivered']
      .map(status => ({ name: extraFuelStatusMeta(status).label, key: status, value: t[`${status}_count`] || 0 }))
      .filter(d => d.value > 0);
  }, [siteReport]);

  const fuelLevelChartData = useMemo(() => {
    if (!siteReport?.visits) return [];
    return siteReport.visits.map((v: any) => ({
      date: v.visit_date ? new Date(v.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
      'Fuel Found': v.fuel_found_l,
      'Fuel Left': v.fuel_left_l,
      'Fuel Added': v.fuel_added_l || 0,
    }));
  }, [siteReport]);

  const trueCphChartData = useMemo(() => {
    if (!siteReport?.visits) return [];
    return siteReport.visits
      .filter((v: any) => v.interval_true_cph != null)
      .map((v: any) => ({
        date: v.visit_date ? new Date(v.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
        'True CPH': v.interval_true_cph,
        anomaly: !!v.interval_anomaly,
      }));
  }, [siteReport]);

  // ── Cluster tab ──────────────────────────────────────────────────────
  // Phase 148: reverted back to Phase 146's dropdown-plus-Load pattern
  // for THIS tab specifically. Phase 147's cluster-cycle-summary listing
  // is real but broken: it unions every `cluster` value it sees across
  // BudgetRequestApproval/AdHocFuelRequest/TomCardAllocation/
  // HistoricalMonthlyRecord, and AdHocFuelRequest's own `cluster` field
  // is read verbatim from that source spreadsheet's own "Grato Cluster"
  // column (see importAdHocFuelRequests.js) — which for ~74 of the 1,266
  // recovered records genuinely has a SITE name typed into that column
  // in the source file itself, not a real cluster (confirmed directly:
  // e.g. "Bodjongo", "Bihaing", "Apouh" each appear exactly once as a
  // `cluster` value, vs. hundreds of records each for the 8 real
  // clusters — Edea, Bonaberi 1/2, Pouma 1/2, Kotto, Ndogbong, Yassa).
  // That's a genuine source-data quality issue, not an import bug — but
  // Phase 147's summary endpoint trusted it at face value and listed
  // those ~74 site names as if they were clusters. `/historical/reserves`
  // (HistoricalMonthlyRecord.cluster, canonical) doesn't have this
  // problem, so the cluster picker is sourced from there again, exactly
  // as it was before Phase 147. `cluster-cycle-summary` is left in the
  // backend, unused by this tab for now — see the Phase 148 changelog
  // entry for what a real fix would need.
  const [clusterCycleKey, setClusterCycleKey] = useState('2026-07');
  const [clustersForCycle, setClustersForCycle] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [clusterReport, setClusterReport] = useState<any>(null);
  const [clusterReportLoading, setClusterReportLoading] = useState(false);
  const [clusterReportError, setClusterReportError] = useState<string | null>(null);

  useEffect(() => {
    historicalDataApi.reserves(clusterCycleKey)
      .then((res: any) => {
        const sites = (res as any)?.data?.sites || [];
        const set = new Set<string>(sites.map((s: any) => s.cluster).filter(Boolean));
        const list = [...set].sort();
        setClustersForCycle(list);
        setSelectedCluster(prev => (prev && list.includes(prev)) ? prev : (list[0] || ''));
      })
      .catch(() => setClustersForCycle([]));
  }, [clusterCycleKey]);

  // ── Compare Clusters (Phase 168) — "I need to be able to compare
  // clusters as well." Uses /cluster-cycle-summary/:cycle_key, which was
  // already in the backend but unused by this tab (Phase 148 — its own
  // `cluster` unioning picks up ~74 real SITE names mistyped into
  // AdHocFuelRequest's source "Grato Cluster" column). Filtered here
  // down to `clustersForCycle` — the same canonical 8-cluster list
  // (sourced from HistoricalMonthlyRecord via /reserves) the picker
  // above already trusts — so this comparison table never surfaces
  // those bogus rows.
  const [clusterCompareList, setClusterCompareList] = useState<any[]>([]);
  const [clusterCompareLoading, setClusterCompareLoading] = useState(true);
  useEffect(() => {
    setClusterCompareLoading(true);
    historicalDataApi.clusterCycleSummary(clusterCycleKey)
      .then((res: any) => setClusterCompareList((res as any)?.data?.clusters || []))
      .catch(() => setClusterCompareList([]))
      .finally(() => setClusterCompareLoading(false));
  }, [clusterCycleKey]);

  const filteredClusterCompare = useMemo(() => {
    if (!clustersForCycle.length) return clusterCompareList;
    const canonical = new Set(clustersForCycle);
    return clusterCompareList.filter((c: any) => canonical.has(c.cluster));
  }, [clusterCompareList, clustersForCycle]);

  const [clusterSort, setClusterSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'cluster', dir: 'asc' });
  const CLUSTER_SORT_ACCESSORS: Record<string, (c: any) => any> = {
    cluster: c => (c.cluster || '').toLowerCase(),
    requested: c => c.requested_l,
    approved: c => c.approved_l,
    consumed: c => c.consumed_l,
    gain_loss: c => c.gain_loss_l,
    purchases: c => c.purchases_l,
    tomcard: c => c.tomcard_total_incl_extra_l,
    cob: c => c.carried_over_stock_burn_l,
    run_hours: c => c.run_hours_total,
    true_cph: c => c.avg_true_cph_this_cycle,
    has_stock: c => c.has_stock_count,
  };
  const CLUSTER_SORT_DEFAULT_DIR: Record<string, 'asc' | 'desc'> = { cluster: 'asc' };
  function toggleClusterSort(key: string) {
    setClusterSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: CLUSTER_SORT_DEFAULT_DIR[key] || 'desc' });
  }
  function clusterSortIndicator(key: string) {
    if (clusterSort.key !== key) return '';
    return clusterSort.dir === 'asc' ? ' ▲' : ' ▼';
  }
  const sortedClusterCompare = useMemo(() => {
    const acc = CLUSTER_SORT_ACCESSORS[clusterSort.key];
    const dir = clusterSort.dir;
    return [...filteredClusterCompare].sort((a, b) => {
      const av = acc(a), bv = acc(b);
      const aNull = av == null, bNull = bv == null;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === 'asc' ? av - bv : bv - av;
    });
  }, [filteredClusterCompare, clusterSort]);

  // Fleet-wide monthly debit/credit settlement (submitted vs approved
  // consumption, purchases, actual XAF settlement) — genuinely NOT a
  // per-cluster figure (see MonthlyDebitSummary's own model comment and
  // historicalDataRoutes.js's /full-summary docblock: fabricating a
  // per-cluster split of a fleet-level number would misrepresent the
  // source data). Fetched once, independent of which cluster/cycle is
  // selected, then looked up by cycle_key below — shown here labeled
  // exactly as fleet-wide, never blended into the cluster's own totals.
  const [fleetDebitSummary, setFleetDebitSummary] = useState<any[]>([]);
  const [fleetDebitSummaryLoading, setFleetDebitSummaryLoading] = useState(true);
  useEffect(() => {
    historicalDataApi.debitSummary()
      .then((res: any) => setFleetDebitSummary((res as any)?.data?.months || []))
      .catch(() => setFleetDebitSummary([]))
      .finally(() => setFleetDebitSummaryLoading(false));
  }, []);
  // Phase 156 — keyed on clusterReport?.cycle_key (the cycle the loaded
  // report actually belongs to), NOT clusterCycleKey (the dropdown's
  // current value). Those two can genuinely diverge: loadCluster() is a
  // manually-triggered fetch, not an effect keyed on clusterCycleKey, so
  // changing the cycle dropdown after a report is already loaded does
  // NOT re-fetch it — clusterReport keeps showing the OLD cycle's data
  // while clusterCycleKey has already moved on. Before this fix, the
  // Fleet-Wide Debit/Credit banner and the Estimated Share of Settlement
  // below it both read clusterCycleKey directly, so they'd silently
  // start showing a DIFFERENT cycle's fleet-wide figures than the one in
  // the report's own header and cluster totals — and the Estimated Share
  // XAF figure isn't just mislabeled in that case, it's actively wrong,
  // since it multiplies this cluster's real consumption for the loaded
  // cycle against another cycle's fleet-wide approved consumption and
  // settlement amount. Confirmed directly against a real screenshot:
  // header read "Bonaberi 1 — Jun '26" while the banner read "Fleet-Wide
  // Debit/Credit for Jul '26", because the user had loaded June's report
  // and then changed the cycle dropdown to July afterward without
  // clicking Load again.
  const fleetDebitForCycle = useMemo(
    () => fleetDebitSummary.find((m: any) => m.cycle_key === clusterReport?.cycle_key) || null,
    [fleetDebitSummary, clusterReport]
  );

  // Phase 149 — "I need per cluster Analysis" for the Debit/Credit panel.
  // Checked directly against the recovered source: Jul2026_Validation.xlsx's
  // own "Debit" sheet has exactly one data row, labeled "GRATO - Littoral"
  // (the whole SBC) — no cluster or site breakdown exists anywhere in that
  // document. A true per-cluster split of the XAF settlement figure isn't
  // recoverable, so this computes a clearly-labeled ESTIMATE instead:
  // the fleet-wide settlement allocated in proportion to this cluster's
  // share of the fleet's Approved Consumption — using `monthly.totals`
  // (Phase 149's new, genuinely real per-cluster consumption total) as the
  // allocation key, since consumption vs. purchases is exactly what the
  // settlement itself measures. Returns null (and the panel below explains
  // why) whenever any input is missing or any site in the cluster lacks a
  // recovered consumption figure — a partial cluster total would silently
  // understate the cluster's true share.
  const clusterDebitEstimate = useMemo(() => {
    const totals = clusterReport?.monthly?.totals;
    const sites = clusterReport?.monthly?.sites;
    const fleetApproved = fleetDebitForCycle?.approved_consumption_l;
    const fleetDebitCredit = fleetDebitForCycle?.debit_credit_amount_xaf;
    if (!totals || !sites || !sites.length) return null;
    if (totals.consumed_count !== sites.length) return null; // partial cluster data — don't estimate off it
    if (!fleetApproved || fleetDebitCredit == null) return null;
    const share = totals.total_consumed_l / fleetApproved;
    return { share, estimated_xaf: share * fleetDebitCredit, clusterConsumed: totals.total_consumed_l, fleetApproved };
  }, [clusterReport, fleetDebitForCycle]);

  // ── Global Summary tab — fleet-wide, across EVERY recovered month, not
  // scoped to one site or cluster. `fleetDebitSummary` above is reused
  // directly here (already fetched, already fleet-wide) rather than
  // fetched a second time. ─────────────────────────────────────────────
  const [globalSummary, setGlobalSummary] = useState<any>(null);
  const [globalSummaryLoading, setGlobalSummaryLoading] = useState(true);
  const [globalAdhoc, setGlobalAdhoc] = useState<any>(null);
  const [globalAdhocLoading, setGlobalAdhocLoading] = useState(true);
  const [globalTomCard, setGlobalTomCard] = useState<any>(null);
  const [globalTomCardLoading, setGlobalTomCardLoading] = useState(true);

  useEffect(() => {
    historicalDataApi.summary(GLOBAL_MIN_MONTH_KEY)
      .then((res: any) => setGlobalSummary((res as any)?.data || res))
      .catch(() => setGlobalSummary(null))
      .finally(() => setGlobalSummaryLoading(false));
    historicalDataApi.adhocRequests()
      .then((res: any) => setGlobalAdhoc((res as any)?.data || res))
      .catch(() => setGlobalAdhoc(null))
      .finally(() => setGlobalAdhocLoading(false));
    historicalDataApi.tomCardAllocations()
      .then((res: any) => setGlobalTomCard((res as any)?.data || res))
      .catch(() => setGlobalTomCard(null))
      .finally(() => setGlobalTomCardLoading(false));
  }, []);

  const globalLoading = globalSummaryLoading || globalAdhocLoading || globalTomCardLoading || fleetDebitSummaryLoading;

  const budgetTrendData = useMemo(() => {
    if (!globalSummary?.by_month) return [];
    // Phase 167: "Gain / Loss" (Delivered + Fuel Found on 1st visit −
    // Consumed) replaces the old budget-based Reserve line here — see
    // computeGainLoss() docblock in historicalDataRoutes.js. Left
    // unrenamed below: 'Has Reserve' (Sites Exhausted chart) and
    // 'Avg Reserve (L)' (Chronically Exhausted Sites table), since both
    // still key off the budget-based fully_exhausted/reserve_liters
    // fields, which this change does not touch.
    return globalSummary.by_month.map((m: any) => ({
      month: monthLabel(m.month_key), Budget: m.total_budget_l, Consumed: m.total_consumption_l, 'Gain / Loss': m.gain_loss_l,
    }));
  }, [globalSummary]);

  // Phase 168: replaces the old budget-based "Exhausted vs Has Reserve"
  // split with a physical one — each site's own LAST field visit of the
  // cycle, fuel_left_l > 0 (Has Stock) or not (No Stock). Sites with no
  // qualifying reading that month are excluded from both bars, not
  // folded into either (see has_stock_count/no_stock_count docblock in
  // historicalDataRoutes.js).
  const stockStatusTrendData = useMemo(() => {
    if (!globalSummary?.by_month) return [];
    return globalSummary.by_month.map((m: any) => ({
      month: monthLabel(m.month_key),
      'Has Stock': m.has_stock_count || 0,
      'No Stock': m.no_stock_count || 0,
      sites_reporting: m.stock_status_sites_reporting || 0,
    }));
  }, [globalSummary]);

  const extraFuelTrendData = useMemo(() => {
    if (!globalAdhoc?.by_month) return [];
    return globalAdhoc.by_month.map((m: any) => ({
      month: monthLabel(m.month_key), Requested: m.total_l || 0, Approved: m.total_approved_l || 0, Delivered: m.total_delivered_l || 0,
    }));
  }, [globalAdhoc]);

  const debitTrendData = useMemo(() => {
    // MonthlyDebitSummary also holds real April–November 2025 rows
    // (Phase 90) — `fleetDebitSummary` itself stays unfiltered (the
    // Cluster tab's per-cycle box needs those months too, for whichever
    // cycle is picked there), filtered down to this page's stated
    // "December 2025 onward" scope only here, for the Global chart.
    return fleetDebitSummary
      .filter((m: any) => m.cycle_key >= GLOBAL_MIN_MONTH_KEY)
      .sort((a: any, b: any) => a.cycle_key.localeCompare(b.cycle_key))
      .map((m: any) => ({ month: monthLabel(m.cycle_key), 'Debit/Credit (XAF)': m.debit_credit_amount_xaf ?? 0 }));
  }, [fleetDebitSummary]);

  const tomCardTrendData = useMemo(() => {
    if (!globalTomCard?.cycles) return [];
    return [...globalTomCard.cycles]
      .sort((a: any, b: any) => a.funded_cycle_key.localeCompare(b.funded_cycle_key))
      .map((c: any) => ({ month: monthLabel(c.funded_cycle_key), 'Funded (L)': c.totals?.quantity_l || 0 }));
  }, [globalTomCard]);

  const carriedOverStockBurnTrendData = useMemo(() => {
    if (!globalSummary?.by_month) return [];
    return globalSummary.by_month
      .filter((m: any) => m.carried_over_stock_burn_l != null)
      .map((m: any) => ({
        month: monthLabel(m.month_key),
        'Carried-Over Stock Burned (L)': m.carried_over_stock_burn_l,
        sites_reporting: m.carried_over_stock_burn_sites_reporting,
      }));
  }, [globalSummary]);

  const globalTotals = useMemo(() => {
    const months = globalSummary?.by_month || [];
    return {
      totalBudget: months.reduce((s: number, m: any) => s + (m.total_budget_l || 0), 0),
      totalConsumed: months.reduce((s: number, m: any) => s + (m.total_consumption_l || 0), 0),
      totalGainLoss: months.reduce((s: number, m: any) => s + (m.gain_loss_l || 0), 0),
      monthsCovered: months.length,
      extraRequested: globalAdhoc?.summary?.total_l ?? null,
      extraRequests: globalAdhoc?.summary?.total_requests ?? null,
      chronicSites: globalSummary?.chronically_exhausted_sites?.length ?? 0,
    };
  }, [globalSummary, globalAdhoc]);

  async function loadCluster(clusterOverride?: string) {
    // Phase 168 — the Compare Clusters table's "Full Report →" button
    // passes its own row's cluster directly, since setSelectedCluster()
    // right before this call wouldn't be visible yet in this closure
    // (state updates aren't synchronous) — same reason the dropdown's
    // own onChange never auto-triggers this, per the Phase 148 note above.
    const cluster = clusterOverride ?? selectedCluster;
    if (!cluster) return;
    setClusterReportLoading(true);
    setClusterReportError(null);
    try {
      const res = await historicalDataApi.clusterCycleReport(cluster, clusterCycleKey);
      setClusterReport((res as any)?.data || res);
    } catch (err: any) {
      setClusterReport(null);
      setClusterReportError(err?.response?.data?.error || 'Failed to load cluster cycle report');
    } finally {
      setClusterReportLoading(false);
    }
  }

  const reqApprovalBySiteData = useMemo(() => {
    if (!clusterReport?.request_approval?.sites) return [];
    return [...clusterReport.request_approval.sites]
      .sort((a: any, b: any) => (b.sbc_requested_l || 0) - (a.sbc_requested_l || 0))
      .slice(0, 15)
      .map((s: any) => ({ name: s.site_name || s.site_id, Requested: s.sbc_requested_l || 0, Approved: s.ihs_approved_l || 0 }));
  }, [clusterReport]);

  const extraFuelBySiteData = useMemo(() => {
    if (!clusterReport?.extra_fuel?.requests) return [];
    const bySite = new Map<string, { name: string; Requested: number; Approved: number; Delivered: number }>();
    for (const r of clusterReport.extra_fuel.requests) {
      const key = r.site_id;
      if (!bySite.has(key)) bySite.set(key, { name: r.site_name || r.site_id, Requested: 0, Approved: 0, Delivered: 0 });
      const row = bySite.get(key)!;
      row.Requested += r.requested_l || 0;
      row.Approved += r.approved_l || 0;
      row.Delivered += r.delivered_l || 0;
    }
    return [...bySite.values()].sort((a, b) => b.Requested - a.Requested).slice(0, 15);
  }, [clusterReport]);

  const purchasesByVendorData = useMemo(() => {
    if (!clusterReport?.purchases?.transactions) return [];
    const byVendor = new Map<string, number>();
    for (const p of clusterReport.purchases.transactions) {
      const key = p.vendor || 'Unknown';
      byVendor.set(key, (byVendor.get(key) || 0) + (p.quantity_l || 0));
    }
    return [...byVendor.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [clusterReport]);

  const tomCardChartData = useMemo(() => {
    if (!clusterReport?.tomcard_allocation?.allocations) return [];
    return clusterReport.tomcard_allocation.allocations.map((t: any, i: number) => ({
      name: t.card_number || `Card ${i + 1}`,
      Base: t.base_l || 0,
      'Round 1': t.extra_round1_approved_l || 0,
      'Round 2': t.extra_round2_approved_l || 0,
      'Round 3': t.extra_round3_approved_l || 0,
    }));
  }, [clusterReport]);

  const midCycleChartData = useMemo(() => {
    if (!clusterReport?.mid_cycle_release?.sites) return [];
    return clusterReport.mid_cycle_release.sites.map((s: any) => ({
      name: s.site_name || s.site_id, Delivered: s.delivered_l || 0, Released: s.released_budget_l || 0,
    }));
  }, [clusterReport]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="📈 History Analysis"
        subtitle="Everything done for one site, or one cluster, in one cycle — request → approval, extra fuel, field visits, deliveries, and the new Approximate True CPH — with charts, not just tables."
        actions={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <Btn size="sm" onClick={handleExportExcel} loading={exporting}>
              📊 Export to Excel
            </Btn>
            {exportError && <span style={{ fontSize: 11, color: urgency.critical.fg }}>{exportError}</span>}
          </div>
        }
      />
      <div style={{ fontSize: 11, color: neutral[400], marginTop: -16, marginBottom: 16 }}>
        The exported workbook covers all four reports — Global Summary, Site Cycle Analysis, Cluster Cycle Analysis, and the Complete Monthly Summary — with charts, not just this page's current tab. It can take a little while to build.
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${neutral[200]}` }}>
        {[
          { key: 'site', label: '📋 Site Cycle Analysis' },
          { key: 'cluster', label: '🏘️ Cluster Cycle Analysis' },
          { key: 'global', label: '🌍 Global Summary' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              padding: '10px 4px', marginRight: 20, fontSize: 14, fontWeight: 700,
              color: tab === t.key ? ink : neutral[400],
              borderBottom: tab === t.key ? `2px solid ${ink}` : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════ SITE TAB ══════════════════════════════ */}
      {tab === 'site' && (
        <>
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: neutral[500] }}>Cycle:</span>
              <select value={siteCycleKey} onChange={e => setSiteCycleKey(e.target.value)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                {CYCLES.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
              <input
                value={siteQuery}
                onChange={e => setSiteQuery(e.target.value)}
                placeholder="Filter by site name or ID…"
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, flex: 1, minWidth: 200, maxWidth: 320 }}
              />
              <select value={siteFilterCluster} onChange={e => setSiteFilterCluster(e.target.value)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                <option value="">All clusters</option>
                {siteClusterOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: neutral[500], cursor: 'pointer' }}>
                <input type="checkbox" checked={siteFilterAnomalyOnly} onChange={e => setSiteFilterAnomalyOnly(e.target.checked)} />
                Anomalies only
              </label>
              <span style={{ fontSize: 11, color: neutral[400] }}>{filteredSiteSummary.length} site(s)</span>
            </div>
            <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
              Every site with activity this cycle. Click any column header to sort by it (click again to reverse). Click "Full Report →" on any row for the full breakdown — visits, extra-fuel isolated detail, engineering, and True CPH.
            </div>
            {!siteSummaryLoading && siteSummaryFleetCob && (
              <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
                Fleet-wide net stock change this cycle (last visit stock − first visit found, negative = net burned): <strong style={{ color: (siteSummaryFleetCob.total_l ?? 0) < 0 ? urgency.critical.fg : ink }}>{fmt(siteSummaryFleetCob.total_l)} L</strong> ({siteSummaryFleetCob.sites_reporting}/{siteSummaryFleetCob.site_count} sites reporting)
              </div>
            )}

            {siteSummaryLoading ? <Spinner /> : filteredSiteSummary.length === 0 ? (
              <EmptyState icon="📋" title="No sites for this cycle" desc="This cycle may not have any recovered historical data yet." />
            ) : (
              <div style={{ overflow: 'auto', maxHeight: 480 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
                    <tr>
                      {[
                        { key: 'site', label: 'Site' },
                        { key: 'cluster', label: 'Cluster' },
                        { key: 'total_requested', label: 'Total Requested (L)' },
                        { key: 'total_approved', label: 'Total Approved (L)' },
                        { key: 'delivered', label: 'Delivered to Site (L)' },
                        { key: 'consumed', label: 'Consumed (L)' },
                        { key: 'gain_loss', label: 'Gain / Loss (L)' },
                        { key: 'cob', label: 'Carried-Over Stock Burned (L)' },
                        { key: 'visits', label: 'Visits' },
                        { key: 'run_hours', label: 'Run Hours' },
                        { key: 'true_cph', label: 'Avg True CPH' },
                        { key: 'cph_gap', label: 'CPH Gap vs Contractual' },
                        { key: 'stability', label: 'Stability (CoV)' },
                        { key: 'anomalies', label: 'Anomaly Intervals' },
                        { key: 'has_stock', label: 'Has Stock' },
                      ].map(h => (
                        <th key={h.key} onClick={() => toggleSiteSort(h.key)}
                          style={{ textAlign: 'left', padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}`, color: siteSort.key === h.key ? ink : neutral[500], cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontWeight: siteSort.key === h.key ? 700 : 400 }}
                          title="Click to sort">
                          {h.label}{sortIndicator(h.key)}
                        </th>
                      ))}
                      <th style={{ padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}` }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSiteSummary.map((s: any) => (
                      <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}`, background: selectedSiteId === s.site_id ? `${urgency.high.fg}08` : undefined }}>
                        <td style={{ padding: '6px 9px' }}>
                          <div style={{ fontWeight: 600 }}>{s.site_name || s.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id}</div>
                        </td>
                        <td style={{ padding: '6px 9px' }}>{s.cluster || '—'}</td>
                        <td style={{ padding: '6px 9px' }}>
                          {fmt(s.total_requested?.total_l)}{s.total_requested?.is_partial ? <span title="Only one of Initial/Extra has real data — this total is partial." style={{ marginLeft: 3 }}>⚠</span> : ''}
                        </td>
                        <td style={{ padding: '6px 9px' }}>
                          {fmt(s.total_approved?.total_l)}{s.total_approved?.is_partial ? <span title="Only one of Initial/Extra has real data — this total is partial." style={{ marginLeft: 3 }}>⚠</span> : ''}
                        </td>
                        <td style={{ padding: '6px 9px' }}>{fmt(s.delivered_to_site_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(s.consumed_l)}</td>
                        <td style={{ padding: '6px 9px', fontWeight: 700, color: s.gain_loss?.gain_loss_l != null && s.gain_loss.gain_loss_l < 0 ? urgency.critical.fg : ink }} title={s.gain_loss?.note || undefined}>{fmt(s.gain_loss?.gain_loss_l)}</td>
                        <td style={{ padding: '6px 9px', color: (s.carried_over_stock_burn?.net_change_l ?? 0) < 0 ? urgency.critical.fg : ink }} title="Last visit's stock (fuel_left_l) minus first visit's found stock (fuel_found_l) this cycle. Negative = net stock decreased (burned); positive = net increased.">
                          {fmt(s.carried_over_stock_burn?.net_change_l)}
                        </td>
                        <td style={{ padding: '6px 9px' }}>{s.visits_this_cycle_count ?? '—'}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(s.run_hours_total_this_cycle)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(s.avg_true_cph_this_cycle)}</td>
                        <td style={{ padding: '6px 9px', color: s.true_cph_vs_contractual != null && Math.abs(s.true_cph_vs_contractual) > (s.contractual_cph || 0) * 0.25 ? urgency.critical.fg : ink }} title={s.contractual_cph != null ? `Contractual: ${fmt(s.contractual_cph)} L/hr` : undefined}>
                          {s.true_cph_vs_contractual != null ? `${s.true_cph_vs_contractual > 0 ? '+' : ''}${fmt(s.true_cph_vs_contractual)}` : '—'}
                        </td>
                        <td style={{ padding: '6px 9px' }} title={s.consumption_stability?.note || undefined}>
                          {s.consumption_stability?.coefficient_of_variation != null ? s.consumption_stability.coefficient_of_variation.toFixed(3) : '—'}
                        </td>
                        <td style={{ padding: '6px 9px', color: (s.consumption_stability?.anomaly_interval_count || 0) > 0 ? urgency.critical.fg : ink, fontWeight: s.consumption_stability?.anomaly_flag ? 700 : 400 }}>
                          {s.consumption_stability?.anomaly_flag ? `⚠ ${s.consumption_stability.anomaly_interval_count}` : (s.consumption_stability?.interval_count >= 2 ? '0' : '—')}
                        </td>
                        <td style={{ padding: '6px 9px', color: s.has_stock === false ? urgency.critical.fg : s.has_stock === true ? urgency.ok.fg : neutral[400], fontWeight: 600 }}>
                          {s.has_stock === true ? 'Yes' : s.has_stock === false ? 'No' : '—'}
                        </td>
                        <td style={{ padding: '6px 9px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => loadSite(s.site_id)}
                            style={{ border: 'none', background: 'none', color: urgency.high.fg, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          >
                            📋 Full Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {siteReportError && <ErrorBox message={siteReportError} />}

          {siteReportLoading ? <Spinner /> : !siteReport ? null : (
            <>
              <div style={CARD_STYLE}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{siteReport.site_name || siteReport.site_id} — Full Cycle Report</div>
                    <div style={{ fontSize: 11, color: neutral[400] }}>{siteReport.site_id} · {siteReport.cluster || '—'} · {siteReport.region || '—'} · {siteReport.topology || '—'} · {monthLabel(siteReport.cycle_key)}</div>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => { setSiteReport(null); setSelectedSiteId(''); }}>Close</Btn>
                </div>

                {/* ── KPI strip ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
                  <KpiTile
                    label={`Total Requested ${siteReport.total_requested?.is_partial ? '⚠' : ''}`}
                    value={`${fmt(siteReport.total_requested?.total_l)} L`}
                    sub={`Initial ${fmt(siteReport.total_requested?.initial_l)} + Extra ${fmt(siteReport.total_requested?.extra_fuel_l)}`}
                  />
                  <KpiTile
                    label={`Total Approved ${siteReport.total_approved?.is_partial ? '⚠' : ''}`}
                    value={`${fmt(siteReport.total_approved?.total_l)} L`}
                    sub={`Initial ${fmt(siteReport.total_approved?.initial_l)} + Extra ${fmt(siteReport.total_approved?.extra_fuel_l)}`}
                  />
                  <KpiTile label="Delivered to Site" value={`${fmt(siteReport.delivered_to_site_l)} L`} sub={`${siteReport.visits_this_cycle_count} visit(s) this cycle`} />
                  <KpiTile label="Consumed" value={`${fmt(siteReport.consumed_l)} L`} />
                  <KpiTile
                    label="Gain / Loss"
                    value={siteReport.gain_loss?.gain_loss_l != null ? `${fmt(siteReport.gain_loss.gain_loss_l)} L` : '—'}
                    color={(siteReport.gain_loss?.gain_loss_l ?? 0) < 0 ? urgency.critical.fg : ink}
                    sub={
                      siteReport.gain_loss?.gain_loss_l != null
                        ? `(Delivered ${fmt(siteReport.gain_loss.delivered_to_site_l)} + Found on 1st visit ${fmt(siteReport.gain_loss.first_visit_fuel_found_l)}) − Consumed ${fmt(siteReport.gain_loss.consumed_l)}`
                        : (siteReport.gain_loss?.note || undefined)
                    }
                  />
                  <KpiTile
                    label="Stock on Site (Last Visit)"
                    value={siteReport.end_of_cycle_stock?.stock_l != null ? `${fmt(siteReport.end_of_cycle_stock.stock_l)} L` : '—'}
                    sub={
                      siteReport.end_of_cycle_stock?.as_of_date
                        ? `As of ${new Date(siteReport.end_of_cycle_stock.as_of_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        : (siteReport.end_of_cycle_stock?.note || undefined)
                    }
                  />
                  <KpiTile
                    label="Carried-Over Stock Burned"
                    value={siteReport.carried_over_stock_burn?.net_change_l != null ? `${fmt(siteReport.carried_over_stock_burn.net_change_l)} L` : '—'}
                    color={(siteReport.carried_over_stock_burn?.net_change_l ?? 0) < 0 ? urgency.critical.fg : ink}
                    sub={
                      siteReport.carried_over_stock_burn?.net_change_l != null
                        ? `Last visit ${fmt(siteReport.carried_over_stock_burn.last_visit_stock_l)} L − 1st visit found ${fmt(siteReport.carried_over_stock_burn.first_visit_found_l)} L`
                        : (siteReport.carried_over_stock_burn?.note || undefined)
                    }
                  />
                </div>

                {/* ── Engineering strip ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18, background: neutral[50], border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400] }}>Generator KVA</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{siteReport.engineering?.generator_kva ?? '—'}</div>
                    {siteReport.engineering?.generator_kva_source && <div style={{ fontSize: 9, color: neutral[400] }}>via {siteReport.engineering.generator_kva_source}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400] }}>Contractual CPH (L/h)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLOR.contractual }}>{fmt(siteReport.engineering?.contractual_cph, 2)}</div>
                    {siteReport.engineering?.contractual_cph_source && <div style={{ fontSize: 9, color: neutral[400] }}>via {siteReport.engineering.contractual_cph_source}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400] }}>Approx. True CPH this cycle (L/h)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLOR.trueCph }}>{fmt(siteReport.engineering?.avg_true_cph_this_cycle, 2)}</div>
                    <div style={{ fontSize: 9, color: neutral[400] }}>from {siteReport.engineering?.interval_count_this_cycle ?? 0} field-derived interval(s)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400] }}>Variance vs Contractual</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: siteReport.engineering?.true_cph_vs_contractual == null ? neutral[400] : siteReport.engineering.true_cph_vs_contractual > 0 ? urgency.critical.fg : urgency.ok.fg }}>
                      {siteReport.engineering?.true_cph_vs_contractual != null ? `${siteReport.engineering.true_cph_vs_contractual > 0 ? '+' : ''}${fmt(siteReport.engineering.true_cph_vs_contractual, 2)} L/h` : '—'}
                    </div>
                  </div>
                </div>

                {/* ── Charts grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14 }}>
                  <ChartCard title="Request & Approval Breakdown" sub="Initial (regular budget) vs Extra (emergency) — Requested and Approved, side by side">
                    {reqApprovalChartData.every(d => !d.Initial && !d.Extra) ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No request/approval data for this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={reqApprovalChartData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="name" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={50} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Initial" stackId="a" fill={COLOR.initial} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Extra" stackId="a" fill={COLOR.extra} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Extra Fuel — Decision Status" sub="Every isolated request this cycle, by outcome">
                    {extraFuelStatusChartData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No extra-fuel requests this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={extraFuelStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {extraFuelStatusChartData.map((d) => <Cell key={d.key} fill={extraFuelStatusMeta(d.key).fg} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v} request(s)`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Fuel Level Across the Cycle" sub="Found / Left per visit, with each delivery event">
                    {fuelLevelChartData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No field visits this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={fuelLevelChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="date" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={50} label={{ value: 'Liters', angle: -90, position: 'insideLeft', fontSize: 10, fill: neutral[400] }} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Fuel Added" fill={COLOR.fuelAdded} radius={[3, 3, 0, 0]} barSize={18} />
                          <Line type="monotone" dataKey="Fuel Found" stroke={COLOR.fuelFound} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Fuel Left" stroke={COLOR.fuelLeft} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Approximate True CPH per Visit vs Contractual" sub="Field-derived consumption rate, compared against the fixed contractual figure">
                    {trueCphChartData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>Not enough consecutive visits this cycle to derive a True CPH.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={trueCphChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="date" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={40} label={{ value: 'L/h', angle: -90, position: 'insideLeft', fontSize: 10, fill: neutral[400] }} />
                          <Tooltip formatter={(v: number) => `${fmt(v, 2)} L/h`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {siteReport.engineering?.contractual_cph != null && (
                            <ReferenceLine y={siteReport.engineering.contractual_cph} stroke={COLOR.contractual} strokeDasharray="5 4" label={{ value: 'Contractual', position: 'right', fontSize: 10, fill: COLOR.contractual }} />
                          )}
                          <Line
                            type="monotone" dataKey="True CPH" stroke={COLOR.trueCph} strokeWidth={2}
                            dot={(props: any) => {
                              const { cx, cy, payload, index } = props;
                              return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={payload.anomaly ? COLOR.anomaly : COLOR.trueCph} stroke="#fff" strokeWidth={1} />;
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                </div>
              </div>

              {/* ── Detail tables — the isolated, untouched records behind every chart above ── */}
              <div style={CARD_STYLE}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🆘 Extra / Emergency Fuel — isolated detail</div>
                {!siteReport.extra_fuel?.requests?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400] }}>No extra-fuel requests recorded for this site this cycle.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 240, marginBottom: 18 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr>{['Round', 'Date', 'Requested (L)', 'Approved (L)', 'Delivered (L)', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: neutral[400], fontWeight: 600, borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {siteReport.extra_fuel.requests.map((d: any, i: number) => {
                          const meta = extraFuelStatusMeta(d.status);
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                              <td style={{ padding: '4px 8px' }}>{d.request_round || '—'}</td>
                              <td style={{ padding: '4px 8px' }}>{String(d.planned_date).slice(0, 10)}</td>
                              <td style={{ padding: '4px 8px' }}>{fmt(d.requested_l)}</td>
                              <td style={{ padding: '4px 8px' }}>{d.approved_l != null ? fmt(d.approved_l) : '—'}</td>
                              <td style={{ padding: '4px 8px' }}>{d.delivered_l != null ? fmt(d.delivered_l) : '—'}</td>
                              <td style={{ padding: '4px 8px' }}><span style={{ color: meta.fg, background: meta.bg, borderRadius: 6, padding: '2px 6px', fontWeight: 600, fontSize: 10 }}>{meta.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🔧 Field Visits This Cycle</div>
                {!siteReport.visits?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400] }}>No field visits recorded for this site this cycle.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 320 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                        <tr>{['Visit Date', 'Meter Reading', 'RH', 'Fuel Found (L)', 'Fuel Added (L)', 'Fuel Left (L)', 'Generator Status', 'True CPH (L/h)'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {siteReport.visits.map((v: any, i: number) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}`, background: v.interval_anomaly ? `${urgency.critical.fg}08` : undefined }}>
                            <td style={{ padding: '5px 8px' }}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.generator_meter_reading)}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.run_hours, 1)}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.fuel_found_l)}</td>
                            <td style={{ padding: '5px 8px', fontWeight: v.fuel_added_l ? 700 : 400, color: v.fuel_added_l ? urgency.ok.fg : neutral[400] }}>{v.fuel_added_l ? fmt(v.fuel_added_l) : '—'}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.fuel_left_l)}</td>
                            <td style={{ padding: '5px 8px', color: neutral[600] }}>{v.generator_status || '—'}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 700, color: v.interval_anomaly ? urgency.critical.fg : ink }}>
                              {v.interval_true_cph != null ? fmt(v.interval_true_cph, 2) : '—'}
                              {v.interval_crosses_cycle_boundary && <span title="Interval started in the previous cycle" style={{ color: neutral[400], marginLeft: 3 }}>†</span>}
                              {v.interval_anomaly && <span title="Fuel found exceeds what was left previously" style={{ marginLeft: 3 }}>⚠</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10, color: neutral[400], marginTop: 4 }}>† interval started in the previous cycle · ⚠ anomaly, shown not hidden.</div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════ CLUSTER TAB ══════════════════════════════ */}
      {tab === 'cluster' && (
        <>
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: neutral[500] }}>Cycle:</span>
              <select value={clusterCycleKey} onChange={e => setClusterCycleKey(e.target.value)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                {CYCLES.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
              <span style={{ fontSize: 12, fontWeight: 700, color: neutral[500], marginLeft: 10 }}>Cluster:</span>
              <select value={selectedCluster} onChange={e => setSelectedCluster(e.target.value)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                {clustersForCycle.length === 0 && <option value="">No clusters found for this cycle</option>}
                {clustersForCycle.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Btn size="sm" onClick={() => loadCluster()} loading={clusterReportLoading} disabled={!selectedCluster}>Load</Btn>
            </div>
            {clusterReport && clusterReport.cycle_key !== clusterCycleKey && (
              // Phase 156 — the cycle dropdown above has moved on since
              // this report was loaded (e.g. changed after clicking Load
              // rather than before). Everything below is still showing
              // clusterReport.cycle_key, not the dropdown's current
              // value — say so plainly rather than let the two silently
              // disagree, since the site count, KPIs, and Estimated
              // Share of Settlement all belong to the OLD cycle until
              // Load is clicked again.
              <div style={{ fontSize: 11, color: urgency.critical.fg, marginTop: 8, fontWeight: 600 }}>
                ⚠ Showing {monthLabel(clusterReport.cycle_key)} — the cycle picker above has since changed to {monthLabel(clusterCycleKey)}. Click Load to refresh.
              </div>
            )}
            <div style={{ fontSize: 11, color: neutral[400], marginTop: 6 }}>
              Purchases carry no site/cluster field in the source data — attributed here only via the card number(s) named on this cluster's own Tom Card Allocation for this exact cycle. See the note under Purchases below before treating that figure as complete.
            </div>
          </div>

          {/* ── Compare Clusters (Phase 168) — sortable, all clusters for the cycle above ── */}
          <div style={CARD_STYLE}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Compare Clusters — {monthLabel(clusterCycleKey)}</div>
            <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
              Every cluster for this cycle, side by side. Click any column header to sort by it (click again to reverse).
            </div>
            {clusterCompareLoading ? <Spinner /> : sortedClusterCompare.length === 0 ? (
              <EmptyState icon="🏘️" title="No clusters for this cycle" desc="This cycle may not have any recovered historical data yet." />
            ) : (
              <div style={{ overflow: 'auto', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
                    <tr>
                      {[
                        { key: 'cluster', label: 'Cluster' },
                        { key: 'requested', label: 'Requested (L)' },
                        { key: 'approved', label: 'Approved (L)' },
                        { key: 'consumed', label: 'Consumed (L)' },
                        { key: 'gain_loss', label: 'Gain / Loss (L)' },
                        { key: 'purchases', label: 'Purchases (L)' },
                        { key: 'tomcard', label: 'Card Funding incl. Extra (L)' },
                        { key: 'cob', label: 'Carried-Over Stock Burned (L)' },
                        { key: 'run_hours', label: 'Run Hours' },
                        { key: 'true_cph', label: 'Avg True CPH' },
                        { key: 'has_stock', label: 'Has Stock (sites)' },
                      ].map(h => (
                        <th key={h.key} onClick={() => toggleClusterSort(h.key)}
                          style={{ textAlign: 'left', padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}`, color: clusterSort.key === h.key ? ink : neutral[500], cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontWeight: clusterSort.key === h.key ? 700 : 400 }}
                          title="Click to sort">
                          {h.label}{clusterSortIndicator(h.key)}
                        </th>
                      ))}
                      <th style={{ padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}` }} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedClusterCompare.map((c: any) => (
                      <tr key={c.cluster} style={{ borderBottom: `1px solid ${neutral[100]}`, background: selectedCluster === c.cluster ? `${urgency.high.fg}08` : undefined }}>
                        <td style={{ padding: '6px 9px', fontWeight: 600 }}>{c.cluster}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.requested_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.approved_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.consumed_l)}</td>
                        <td style={{ padding: '6px 9px', fontWeight: 700, color: c.gain_loss_l != null && c.gain_loss_l < 0 ? urgency.critical.fg : ink }}>{fmt(c.gain_loss_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.purchases_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.tomcard_total_incl_extra_l)}</td>
                        <td style={{ padding: '6px 9px', color: (c.carried_over_stock_burn_l ?? 0) < 0 ? urgency.critical.fg : ink }}>{fmt(c.carried_over_stock_burn_l)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.run_hours_total)}</td>
                        <td style={{ padding: '6px 9px' }}>{fmt(c.avg_true_cph_this_cycle)}</td>
                        <td style={{ padding: '6px 9px' }}>{c.has_stock_count ?? 0} / {(c.has_stock_count ?? 0) + (c.no_stock_count ?? 0)}</td>
                        <td style={{ padding: '6px 9px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => { setSelectedCluster(c.cluster); loadCluster(c.cluster); }}
                            style={{ border: 'none', background: 'none', color: urgency.high.fg, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          >
                            📋 Full Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {clusterReportError && <ErrorBox message={clusterReportError} />}

          {clusterReportLoading ? <Spinner /> : !clusterReport ? (
            <EmptyState icon="🏘️" title="Pick a cluster and cycle, then Load" desc="Consolidates request/approval, extra fuel, purchases, and Tom Card Allocation for that cluster and cycle." />
          ) : (
            <>
              <div style={CARD_STYLE}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{clusterReport.cluster} — {monthLabel(clusterReport.cycle_key)}</div>
                    <div style={{ fontSize: 11, color: neutral[400] }}>{clusterReport.site_count} site(s) with activity this cycle</div>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => { setClusterReport(null); setSelectedCluster(''); }}>Close</Btn>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
                  <KpiTile label="Requested (regular)" value={`${fmt(clusterReport.request_approval?.totals?.total_requested_l)} L`} />
                  <KpiTile label="Approved (regular)" value={`${fmt(clusterReport.request_approval?.totals?.total_approved_l)} L`} color={COLOR.approved} />
                  <KpiTile label="Extra Fuel Requested" value={`${fmt(clusterReport.extra_fuel?.totals?.requested_l)} L`} color={COLOR.extra} />
                  <KpiTile label="Purchases (actual)" value={`${fmt(clusterReport.purchases?.totals?.total_l)} L`} sub={`${fmt(clusterReport.purchases?.totals?.total_xaf)} XAF · ${clusterReport.purchases?.totals?.count ?? 0} txns`} />
                  <KpiTile label="Card Funding incl. Extra Rounds" value={`${fmt(clusterReport.tomcard_allocation?.totals?.total_incl_extra_l)} L`} sub={`${fmt(clusterReport.tomcard_allocation?.totals?.total_incl_extra_xaf)} XAF`} />
                  <KpiTile label="Consumed (actual)" value={`${fmt(clusterReport.monthly?.totals?.total_consumed_l)} L`}
                    sub={clusterReport.monthly?.totals && clusterReport.monthly.totals.consumed_count < clusterReport.monthly.site_count ? `${clusterReport.monthly.totals.consumed_count}/${clusterReport.monthly.site_count} sites reporting` : undefined} />
                  <KpiTile label="Gain / Loss" value={`${fmt(clusterReport.gain_loss?.total_l)} L`}
                    color={(clusterReport.gain_loss?.total_l ?? 0) < 0 ? urgency.critical.fg : ink}
                    sub={clusterReport.gain_loss ? `${clusterReport.gain_loss.sites_reporting}/${clusterReport.gain_loss.site_count} sites reporting` : undefined} />
                  <KpiTile label="Stock on Site (Last Visit)" value={`${fmt(clusterReport.end_of_cycle_stock?.total_l)} L`}
                    sub={`${clusterReport.end_of_cycle_stock?.sites_reporting ?? 0} site(s) reporting`} />
                  <KpiTile label="Carried-Over Stock Burned" value={`${fmt(clusterReport.carried_over_stock_burn?.total_l)} L`}
                    color={(clusterReport.carried_over_stock_burn?.total_l ?? 0) < 0 ? urgency.critical.fg : ink}
                    sub={`${clusterReport.carried_over_stock_burn?.sites_reporting ?? 0}/${clusterReport.carried_over_stock_burn?.site_count ?? 0} sites reporting`} />
                </div>

                {/* ── Fleet-Wide Debit/Credit Settlement — genuinely NOT a
                    per-cluster figure (MonthlyDebitSummary has no
                    cluster/site split in the source data at all), shown
                    here as fleet-wide context for the cycle being
                    analyzed, not folded into any of the cluster totals
                    above. Same figure, same labeling, as the "Complete
                    Monthly Summary" section of Historical Data. ── */}
                {fleetDebitSummaryLoading ? null : fleetDebitForCycle ? (
                  <div style={{ marginBottom: 18, border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12, background: neutral[50] }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Fleet-Wide Debit/Credit for {monthLabel(clusterReport.cycle_key)} (not a per-cluster figure)</div>
                    <div style={{ fontSize: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <span>Submitted: <strong>{fmt(fleetDebitForCycle.submitted_consumption_l)} L</strong></span>
                      <span>Approved: <strong>{fmt(fleetDebitForCycle.approved_consumption_l)} L</strong></span>
                      <span>Purchases: <strong>{fmt(fleetDebitForCycle.purchases_l)} L</strong></span>
                      <span>Reserve (Stock Left): <strong>{fmt(fleetDebitForCycle.stock_left_l)} L</strong></span>
                      <span>Debit/Credit: <strong style={{ color: (fleetDebitForCycle.debit_credit_amount_xaf ?? 0) < 0 ? urgency.critical.fg : urgency.ok.fg }}>{fmt(fleetDebitForCycle.debit_credit_amount_xaf)} XAF</strong></span>
                      {fleetDebitForCycle.bb_sites_stock_l != null && (
                        <span>BB Sites Stock (not in debit): <strong>{fmt(fleetDebitForCycle.bb_sites_stock_l)} L</strong></span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: neutral[400], marginTop: 4 }}>
                      Reserve (Stock Left) = Purchases − Approved Consumption, straight from the source Debit sheet, not derived. BB (backbone/external-tank) sites' own stock is tracked separately and excluded from this settlement.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: neutral[400], marginBottom: 18 }}>ℹ No fleet-wide debit/credit settlement recovered for {monthLabel(clusterReport.cycle_key)}.</div>
                )}

                {/* ── Per-Cluster Analysis of that settlement (Phase 149) ──
                    The recovered "Debit" sheet has exactly one row for the
                    whole SBC — no cluster split exists in the source at
                    all, so this cannot be a recorded figure. What CAN be
                    shown honestly: this cluster's own real, recovered
                    Consumed/Reserve totals above (a straight sum of real
                    per-site rows, not an estimate), plus — only when every
                    site in the cluster has a recovered consumption figure
                    — a clearly-labeled ESTIMATE of this cluster's share of
                    the fleet-wide settlement, proportional to its share of
                    fleet Approved Consumption. ── */}
                {clusterDebitEstimate ? (
                  <div style={{ marginBottom: 18, border: `1px dashed ${neutral[300]}`, borderRadius: 10, padding: 12, background: statusTokens.warning.bg }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>≈ Estimated Share of Settlement — {clusterReport.cluster}</div>
                    <div style={{ fontSize: 11, color: neutral[500], marginBottom: 8, lineHeight: 1.5 }}>
                      The source settlement document has no cluster-level breakdown at all (confirmed directly against the recovered "Debit" sheet — one row, for the entire SBC). This is a <strong>computed allocation</strong>, not a recorded figure: the fleet-wide Debit/Credit spread in proportion to this cluster's share of fleet Approved Consumption ({fmt(clusterDebitEstimate.clusterConsumed)} L of {fmt(clusterDebitEstimate.fleetApproved)} L fleet-wide = {(clusterDebitEstimate.share * 100).toFixed(1)}%). Treat it as directional only.
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Estimated Debit/Credit for {clusterReport.cluster}: <strong style={{ color: clusterDebitEstimate.estimated_xaf < 0 ? urgency.critical.fg : urgency.ok.fg }}>{fmt(clusterDebitEstimate.estimated_xaf)} XAF</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: neutral[400], marginBottom: 18, lineHeight: 1.5 }}>
                    ℹ Can't estimate {clusterReport.cluster}'s share of the settlement{!clusterReport.monthly?.sites?.length ? ' — no recovered monthly consumption records for this cluster this cycle.' : clusterReport.monthly.totals.consumed_count < clusterReport.monthly.site_count ? ` — only ${clusterReport.monthly.totals.consumed_count} of ${clusterReport.monthly.site_count} sites have a recovered consumption figure this cycle; a partial total would understate this cluster's real share.` : ' — no fleet-wide settlement recovered for this cycle to allocate.'}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14 }}>
                  <ChartCard title="Request vs Approval, per Site" sub="Top 15 sites by requested liters, this cluster this cycle">
                    {reqApprovalBySiteData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No regular request/approval data.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(220, reqApprovalBySiteData.length * 26)}>
                        <BarChart data={reqApprovalBySiteData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} horizontal={false} />
                          <XAxis type="number" tick={AXIS_TICK} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Requested" fill={COLOR.requested} radius={[0, 3, 3, 0]} barSize={9} />
                          <Bar dataKey="Approved" fill={COLOR.approved} radius={[0, 3, 3, 0]} barSize={9} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Extra Fuel, per Site" sub="Top 15 sites by extra-fuel requested, isolated then merged per site">
                    {extraFuelBySiteData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No extra-fuel requests this cluster this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(220, extraFuelBySiteData.length * 26)}>
                        <BarChart data={extraFuelBySiteData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} horizontal={false} />
                          <XAxis type="number" tick={AXIS_TICK} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Requested" fill={COLOR.requested} radius={[0, 3, 3, 0]} barSize={7} />
                          <Bar dataKey="Approved" fill={COLOR.approved} radius={[0, 3, 3, 0]} barSize={7} />
                          <Bar dataKey="Delivered" fill={COLOR.delivered} radius={[0, 3, 3, 0]} barSize={7} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Purchases by Vendor" sub="Actual card purchases attributed to this cluster this cycle">
                    {purchasesByVendorData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No purchases attributed to this cluster this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={purchasesByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {purchasesByVendorData.map((d, i) => <Cell key={d.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Tom Card Funding, per Card" sub="Base allocation plus each mid-cycle extra round, itemized">
                    {tomCardChartData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No Tom Card Allocation recovered for this cluster this cycle.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={tomCardChartData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={AXIS_TICK} width={50} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Base" stackId="a" fill={neutral[400]} />
                          <Bar dataKey="Round 1" stackId="a" fill={urgency.medium.fg} />
                          <Bar dataKey="Round 2" stackId="a" fill={urgency.high.fg} />
                          <Bar dataKey="Round 3" stackId="a" fill={urgency.critical.fg} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  {midCycleChartData.length > 0 && (
                    <ChartCard title="Mid-Cycle Early Budget Release" sub="Delivered vs Released, per site">
                      <ResponsiveContainer width="100%" height={Math.max(220, midCycleChartData.length * 26)}>
                        <BarChart data={midCycleChartData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} horizontal={false} />
                          <XAxis type="number" tick={AXIS_TICK} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Delivered" fill={COLOR.delivered} radius={[0, 3, 3, 0]} barSize={9} />
                          <Bar dataKey="Released" fill={neutral[400]} radius={[0, 3, 3, 0]} barSize={9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
              </div>

              {/* ── Detail tables ── */}
              <div style={CARD_STYLE}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📨 Request → Approval, per site</div>
                {!clusterReport.request_approval?.sites?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400], marginBottom: 16 }}>No regular request/approval data recovered for this cluster this cycle.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 240, marginBottom: 18 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead><tr>{['Site', 'Requested (L)', 'Approved (L)', 'Variance'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: neutral[400], fontWeight: 600, borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>
                        {clusterReport.request_approval.sites.map((s: any) => (
                          <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '4px 8px' }}>{s.site_name || s.site_id}</td>
                            <td style={{ padding: '4px 8px' }}>{fmt(s.sbc_requested_l)}</td>
                            <td style={{ padding: '4px 8px' }}>{fmt(s.ihs_approved_l)}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 700, color: (s.variance_l ?? 0) < 0 ? urgency.high.fg : (s.variance_l ?? 0) > 0 ? urgency.ok.fg : neutral[400] }}>
                              {s.variance_l != null ? `${s.variance_l > 0 ? '+' : ''}${fmt(s.variance_l)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>💳 Tom Card Allocation — Fuel Card Funding Request</div>
                {!clusterReport.tomcard_allocation?.allocations?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400], marginBottom: 16 }}>No Tom Card Allocation recovered for this cluster this cycle.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 240, marginBottom: 18 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead><tr>{['Card #', 'Vendor', 'Base (L)', 'Extra R1 (L)', 'Extra R2 (L)', 'Extra R3 (L)', 'Total incl. Extra (L)', 'Total incl. Extra (XAF)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: neutral[400], fontWeight: 600, borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>
                        {clusterReport.tomcard_allocation.allocations.map((t: any, i: number) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '4px 8px' }}>{t.card_number || '—'}{t.new_card_number ? ` → ${t.new_card_number}` : ''}</td>
                            <td style={{ padding: '4px 8px' }}>{t.vendor || '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{fmt(t.base_l)}</td>
                            <td style={{ padding: '4px 8px' }}>{t.extra_round1_approved_l != null ? fmt(t.extra_round1_approved_l) : '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{t.extra_round2_approved_l != null ? fmt(t.extra_round2_approved_l) : '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{t.extra_round3_approved_l != null ? fmt(t.extra_round3_approved_l) : '—'}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 700 }}>{fmt(t.total_incl_extra_l)}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 700 }}>{fmt(t.total_incl_extra_xaf)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>⛽ Fuel Card Purchases — individual transactions</div>
                <div style={{ fontSize: 10, color: neutral[400], marginBottom: 6 }}>{clusterReport.purchases?.unattributable_note}</div>
                {!clusterReport.purchases?.transactions?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400] }}>No purchases attributed to this cluster this cycle.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 260 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead><tr>{['Date', 'Place', 'Vendor', 'Qty (L)', 'Amount (XAF)', 'Card #'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: neutral[400], fontWeight: 600, borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>
                        {clusterReport.purchases.transactions.map((p: any, i: number) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '4px 8px' }}>{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{p.place || '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{p.vendor || '—'}</td>
                            <td style={{ padding: '4px 8px' }}>{fmt(p.quantity_l)}</td>
                            <td style={{ padding: '4px 8px' }}>{fmt(p.amount_xaf)}</td>
                            <td style={{ padding: '4px 8px', color: neutral[400] }}>{p.card_number || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════ GLOBAL SUMMARY TAB ══════════════════════════════ */}
      {tab === 'global' && (
        <>
          <div style={{ fontSize: 12, color: neutral[600], marginBottom: 16 }}>
            Fleet-wide, across every recovered month December 2025 through August 2026 — not scoped to one site or cluster. Draws on the same underlying data as the Site and Cluster tabs above, aggregated to a fleet level.
          </div>

          {globalLoading ? <Spinner /> : (
            <>
              <div style={CARD_STYLE}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
                  <KpiTile label="Months Covered" value={`${globalTotals.monthsCovered}`} />
                  <KpiTile label="Total Budget" value={`${fmt(globalTotals.totalBudget)} L`} />
                  <KpiTile label="Total Consumed" value={`${fmt(globalTotals.totalConsumed)} L`} />
                  <KpiTile label="Total Gain / Loss" value={`${fmt(globalTotals.totalGainLoss)} L`} color={globalTotals.totalGainLoss < 0 ? urgency.critical.fg : ink} />
                  <KpiTile label="Extra Fuel Requested (all-time)" value={globalTotals.extraRequested != null ? `${fmt(globalTotals.extraRequested)} L` : '—'} color={COLOR.extra} sub={globalTotals.extraRequests != null ? `${globalTotals.extraRequests} requests` : undefined} />
                  <KpiTile label="Chronically Exhausted Sites" value={`${globalTotals.chronicSites}`} color={globalTotals.chronicSites > 0 ? urgency.critical.fg : ink} sub="Exhausted every month tracked" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14 }}>
                  <ChartCard title="Budget vs Consumption vs Gain/Loss, Every Month" sub="Fleet-wide totals, across all recovered months">
                    {budgetTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No monthly reconciliation data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={budgetTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={55} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="Budget" stroke={COLOR.initial} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Consumed" stroke={COLOR.trueCph} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Gain / Loss" stroke={COLOR.approved} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Extra Fuel: Requested vs Approved vs Delivered" sub="Every month, fleet-wide — isolated-then-merged totals">
                    {extraFuelTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No extra-fuel data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={extraFuelTrendData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={55} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Requested" fill={COLOR.requested} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Approved" fill={COLOR.approved} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Delivered" fill={COLOR.delivered} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Monthly Debit/Credit Settlement" sub="Fleet-wide XAF settlement with IHS Towers, per month — green = credit, red = debit">
                    {debitTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No settlement data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={debitTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={65} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} XAF`} />
                          <ReferenceLine y={0} stroke={neutral[400]} />
                          <Bar dataKey="Debit/Credit (XAF)" radius={[3, 3, 3, 3]}>
                            {debitTrendData.map((d, i) => (
                              <Cell key={i} fill={d['Debit/Credit (XAF)'] < 0 ? urgency.critical.fg : urgency.ok.fg} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Sites w/ Stock vs No Stock, per Month" sub="Each site's own last field visit that cycle — an actual tank-dip reading, not a budget figure">
                    {stockStatusTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No field-visit data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={stockStatusTrendData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={40} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="No Stock" stackId="a" fill={urgency.critical.fg} />
                          <Bar dataKey="Has Stock" stackId="a" fill={urgency.ok.fg} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Tom Card Funding, by Cycle" sub="Total liters funded onto fuel cards, per recovered funding cycle">
                    {tomCardTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No Tom Card Allocation data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={tomCardTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={55} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <Bar dataKey="Funded (L)" fill={COLOR.initial} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Carried-Over Stock Burned, by Cycle" sub="Fleet-wide net stock change (last visit stock − first visit found) — negative = net burned, positive = net gained; not every site necessarily reports">
                    {carriedOverStockBurnTrendData.length === 0 ? (
                      <div style={{ fontSize: 12, color: neutral[400], padding: '30px 0', textAlign: 'center' }}>No field-visit interval data recovered.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={carriedOverStockBurnTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} vertical={false} />
                          <XAxis dataKey="month" tick={AXIS_TICK} />
                          <YAxis tick={AXIS_TICK} width={55} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                          <ReferenceLine y={0} stroke={neutral[300]} />
                          <Bar dataKey="Carried-Over Stock Burned (L)" fill={COLOR.extra} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                </div>
              </div>

              {/* ── Chronically exhausted sites — the pattern, not a one-off ── */}
              <div style={CARD_STYLE}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠ Chronically Exhausted Sites</div>
                <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
                  Exhausted their budget in every recovered month they had one — not a one-off, a pattern.
                </div>
                {!globalSummary?.chronically_exhausted_sites?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400] }}>No chronically exhausted sites found.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 320 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                        <tr>{['Site', 'Cluster', 'Months Exhausted / With Budget', 'Avg Reserve (L)'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {globalSummary.chronically_exhausted_sites.map((s: any) => (
                          <tr key={s._id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{s.site_name || s._id}</td>
                            <td style={{ padding: '5px 8px' }}>{s.cluster || '—'}</td>
                            <td style={{ padding: '5px 8px' }}>{s.months_exhausted}/{s.months_with_budget}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 700, color: urgency.critical.fg }}>{fmt(s.avg_reserve_l)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
