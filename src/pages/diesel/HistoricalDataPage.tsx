/**
 * HistoricalDataPage.tsx
 *
 * Real historical diesel data recovered from email archives (December
 * 2025 onward) — the manual, spreadsheet-based validation process this
 * organization was running before this system existed. Answers the
 * core question directly: was whatever was requested ever exhausted,
 * and where reserves remain, site by site — plus trends across every
 * recovered month.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { historicalDataApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency } from '../../styles/dieselTokens';

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
const CLUSTER_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

export default function HistoricalDataPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [reserves, setReserves] = useState<any[]>([]);
  const [reservesLoading, setReservesLoading] = useState(false);

  const [siteQuery, setSiteQuery] = useState('');
  const [siteHistory, setSiteHistory] = useState<any>(null);
  const [siteHistoryLoading, setSiteHistoryLoading] = useState(false);
  const [fieldVisits, setFieldVisits] = useState<any>(null);
  const [fieldVisitsLoading, setFieldVisitsLoading] = useState(false);

  const [sortBy, setSortBy] = useState<'reserve' | 'consumption' | 'variance'>('reserve');

  const [adhoc, setAdhoc] = useState<any>(null);
  const [adhocLoading, setAdhocLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const [midCycle, setMidCycle] = useState<any>(null);
  const [midCycleLoading, setMidCycleLoading] = useState(true);

  const [reqApproval, setReqApproval] = useState<any>(null);
  const [reqApprovalLoading, setReqApprovalLoading] = useState(true);
  const [reqApprovalCycle, setReqApprovalCycle] = useState('2026-07');

  const [debitSummary, setDebitSummary] = useState<any>(null);
  const [debitSummaryLoading, setDebitSummaryLoading] = useState(true);

  const [purchases, setPurchases] = useState<any>(null);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesMonth, setPurchasesMonth] = useState('2026-05');

  const [stockSnapshots, setStockSnapshots] = useState<any>(null);
  const [stockSnapshotsLoading, setStockSnapshotsLoading] = useState(true);

  const [fullSummary, setFullSummary] = useState<any>(null);
  const [fullSummaryLoading, setFullSummaryLoading] = useState(true);
  const [fullSummaryMonth, setFullSummaryMonth] = useState('2026-07');
  const [fullSummaryQuery, setFullSummaryQuery] = useState('');

  const [tomCard, setTomCard] = useState<any>(null);
  const [tomCardLoading, setTomCardLoading] = useState(true);

  useEffect(() => {
    // Staggered with real delays, not fired all at once — with 9 total
    // requests on this page and confirmed 20-30s round-trip times
    // (severe for collections this small, so the bottleneck is external
    // to these queries themselves), firing everything simultaneously
    // compounds whatever the underlying latency is. This spreads
    // initiation out instead of concentrating peak load at t=0.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stagger = (fn: () => void, delayMs: number) => { timers.push(setTimeout(fn, delayMs)); };

    stagger(() => {
      historicalDataApi.adhocRequests()
        .then((res: any) => setAdhoc((res as any)?.data || res))
        .catch(() => {})
        .finally(() => setAdhocLoading(false));
    }, 0);
    stagger(() => {
      historicalDataApi.midCycleRelease('2026-08')
        .then((res: any) => setMidCycle((res as any)?.data || res))
        .catch(() => {})
        .finally(() => setMidCycleLoading(false));
    }, 200);
    stagger(() => {
      historicalDataApi.debitSummary()
        .then((res: any) => setDebitSummary((res as any)?.data || res))
        .catch(() => {})
        .finally(() => setDebitSummaryLoading(false));
    }, 600);
    stagger(() => {
      historicalDataApi.siteStockSnapshots()
        .then((res: any) => setStockSnapshots((res as any)?.data || res))
        .catch(() => {})
        .finally(() => setStockSnapshotsLoading(false));
    }, 800);
    stagger(() => {
      historicalDataApi.tomCardAllocations()
        .then((res: any) => setTomCard((res as any)?.data || res))
        .catch(() => {})
        .finally(() => setTomCardLoading(false));
    }, 1000);

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    historicalDataApi.summary()
      .then((res: any) => {
        const data = (res as any)?.data || res;
        setSummary(data);
        const months = data?.months_covered || [];
        if (months.length) setSelectedMonth(months[months.length - 1]);
      })
      .catch((err: any) => setError(err?.response?.data?.error || 'Failed to load historical summary'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    setReservesLoading(true);
    historicalDataApi.reserves(selectedMonth)
      .then((res: any) => setReserves((res as any)?.data?.sites || []))
      .catch(() => setReserves([]))
      .finally(() => setReservesLoading(false));
  }, [selectedMonth]);

  const purchasesFirstLoad = useRef(true);
  useEffect(() => {
    setPurchasesLoading(true);
    const delay = purchasesFirstLoad.current ? 1200 : 0; // stagger only the initial mount-time fetch, not a user's own month change
    purchasesFirstLoad.current = false;
    const timer = setTimeout(() => {
      historicalDataApi.fuelPurchases(purchasesMonth)
        .then((res: any) => setPurchases((res as any)?.data || res))
        .catch(() => setPurchases(null))
        .finally(() => setPurchasesLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [purchasesMonth]);

  const summaryFirstLoad = useRef(true);
  useEffect(() => {
    setFullSummaryLoading(true);
    const delay = summaryFirstLoad.current ? 1400 : 0;
    summaryFirstLoad.current = false;
    const timer = setTimeout(() => {
      historicalDataApi.fullSummary(fullSummaryMonth)
        .then((res: any) => setFullSummary((res as any)?.data || res))
        .catch(() => setFullSummary(null))
        .finally(() => setFullSummaryLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [fullSummaryMonth]);

  const reqApprovalFirstLoad = useRef(true);
  useEffect(() => {
    setReqApprovalLoading(true);
    const delay = reqApprovalFirstLoad.current ? 1600 : 0;
    reqApprovalFirstLoad.current = false;
    const timer = setTimeout(() => {
      historicalDataApi.requestApproval(reqApprovalCycle)
        .then((res: any) => setReqApproval((res as any)?.data || res))
        .catch(() => setReqApproval(null))
        .finally(() => setReqApprovalLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [reqApprovalCycle]);

  const [midCycleEstimate, setMidCycleEstimate] = useState<any>(null);
  const [midCycleEstimateLoading, setMidCycleEstimateLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      historicalDataApi.midCycleEstimate('2026-03')
        .then((res: any) => setMidCycleEstimate((res as any)?.data || res))
        .catch(() => setMidCycleEstimate(null))
        .finally(() => setMidCycleEstimateLoading(false));
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const [plannedVsSupplied, setPlannedVsSupplied] = useState<any>(null);
  const [plannedVsSuppliedLoading, setPlannedVsSuppliedLoading] = useState(true);
  const [plannedVsSuppliedMonth, setPlannedVsSuppliedMonth] = useState('2026-06');
  useEffect(() => {
    setPlannedVsSuppliedLoading(true);
    const timer = setTimeout(() => {
      historicalDataApi.plannedVsSupplied(plannedVsSuppliedMonth)
        .then((res: any) => setPlannedVsSupplied((res as any)?.data || res))
        .catch(() => setPlannedVsSupplied(null))
        .finally(() => setPlannedVsSuppliedLoading(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [plannedVsSuppliedMonth]);

  async function loadSiteHistory(site_id: string) {
    setSiteHistoryLoading(true);
    setFieldVisitsLoading(true);
    try {
      const res = await historicalDataApi.siteHistory(site_id);
      setSiteHistory((res as any)?.data || res);
    } catch {
      setSiteHistory(null);
    } finally {
      setSiteHistoryLoading(false);
    }
    try {
      const res = await historicalDataApi.fieldVisits(site_id);
      setFieldVisits((res as any)?.data || res);
    } catch {
      setFieldVisits(null);
    } finally {
      setFieldVisitsLoading(false);
    }
  }

  const sortedReserves = useMemo(() => {
    const arr = [...reserves];
    if (sortBy === 'reserve') arr.sort((a, b) => (a.reserve_liters ?? Infinity) - (b.reserve_liters ?? Infinity));
    if (sortBy === 'consumption') arr.sort((a, b) => (b.final_consumption_l ?? 0) - (a.final_consumption_l ?? 0));
    if (sortBy === 'variance') arr.sort((a, b) => Math.abs(b.rh_variance ?? 0) - Math.abs(a.rh_variance ?? 0));
    return arr;
  }, [reserves, sortBy]);

  const filteredReserves = useMemo(() => {
    if (!siteQuery.trim()) return sortedReserves;
    const q = siteQuery.toLowerCase();
    return sortedReserves.filter(r => (r.site_name || '').toLowerCase().includes(q) || r.site_id.toLowerCase().includes(q));
  }, [sortedReserves, siteQuery]);

  const monthChartData = (summary?.by_month || []).map((m: any) => ({
    month: monthLabel(m.month_key),
    budget: m.total_budget_l,
    consumption: m.total_consumption_l,
    reserve: m.total_reserve_l,
  }));

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="📜 Historical Data (Recovered)"
        subtitle="Real budget, consumption, and reserve data recovered from email archives — December 2025 onward, from before this system existed."
      />

      {/* ── Complete Monthly Summary — request, approved, extra fuel, consumed, reserve, per site. Debit/credit is fleet-level only, shown separately, not fabricated per site. ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>📊 Complete Monthly Summary — Request → Approved → Consumed → Reserve</div>
          <select value={fullSummaryMonth} onChange={e => setFullSummaryMonth(e.target.value)}
            style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
            {['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
          Every column reflects real recovered data for the selected month — a blank cell means that specific source genuinely doesn't cover this site this month, not zero. "Extra Fuel" only has real values for late July–early August 2026 (the recovered shortage-response window). Debit/credit is fleet-wide, not per-site — shown as its own line below the table, not blended into it.
        </div>

        {fullSummaryLoading ? <Spinner /> : !fullSummary?.sites?.length ? (
          <EmptyState icon="📊" title="No data for this month" desc="This month may not have any recovered historical data yet." />
        ) : (
          <>
            {!fullSummary.coverage?.has_request_approval && (
              <div style={{ fontSize: 11, color: neutral[400], marginBottom: 6 }}>ℹ No Request → Approval data recovered for {monthLabel(fullSummaryMonth)} — "Requested" column will be blank.</div>
            )}
            {!fullSummary.coverage?.has_adhoc_requests && (
              <div style={{ fontSize: 11, color: neutral[400], marginBottom: 6 }}>ℹ No ad-hoc/emergency requests recorded for {monthLabel(fullSummaryMonth)} — "Extra Fuel" column will be blank.</div>
            )}

            <input
              value={fullSummaryQuery} onChange={e => setFullSummaryQuery(e.target.value)} placeholder="Search site…"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 200, marginBottom: 10 }}
            />

            <div style={{ overflow: 'auto', maxHeight: 480 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                  <tr>
                    {['Site', 'Cluster', 'Requested (L)', 'Approved (L)', 'Extra Fuel (L)', 'Consumed (L)', 'Reserve (L)', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullSummary.sites
                    .filter((s: any) => !fullSummaryQuery.trim() || (s.site_name || '').toLowerCase().includes(fullSummaryQuery.toLowerCase()) || s.site_id.toLowerCase().includes(fullSummaryQuery.toLowerCase()))
                    .map((s: any) => (
                      <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <td style={{ padding: '6px 9px' }}>
                          <div style={{ fontWeight: 600 }}>{s.site_name || s.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id}</div>
                        </td>
                        <td style={{ padding: '6px 9px' }}>{s.cluster || '—'}</td>
                        <td style={{ padding: '6px 9px' }}>{s.requested_l != null ? fmt(s.requested_l) : '—'}</td>
                        <td style={{ padding: '6px 9px' }}>{s.approved_l != null ? fmt(s.approved_l) : '—'}</td>
                        <td style={{ padding: '6px 9px', color: s.extra_fuel_l ? urgency.high.fg : neutral[400], fontWeight: s.extra_fuel_l ? 700 : 400 }}>
                          {s.extra_fuel_l != null ? `${fmt(s.extra_fuel_l)}${s.extra_fuel_requests ? ` (${s.extra_fuel_requests})` : ''}` : '—'}
                        </td>
                        <td style={{ padding: '6px 9px' }}>{s.consumed_l != null ? fmt(s.consumed_l) : '—'}</td>
                        <td style={{ padding: '6px 9px', fontWeight: 700, color: s.reserve_l != null && s.reserve_l < 0 ? urgency.critical.fg : ink }}>
                          {s.reserve_l != null ? fmt(s.reserve_l) : '—'}
                        </td>
                        <td style={{ padding: '6px 9px' }}>
                          {s.fully_exhausted === true ? <span style={{ color: urgency.critical.fg, fontWeight: 700 }}>Exhausted</span>
                            : s.fully_exhausted === false ? <span style={{ color: urgency.ok.fg, fontWeight: 700 }}>Has Reserve</span>
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {fullSummary.fleet_debit_summary && (
              <div style={{ marginTop: 14, border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12, background: neutral[50] }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Fleet-Wide Debit/Credit for {monthLabel(fullSummaryMonth)} (not a per-site figure)</div>
                <div style={{ fontSize: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span>Submitted: <strong>{fmt(fullSummary.fleet_debit_summary.submitted_consumption_l)} L</strong></span>
                  <span>Approved: <strong>{fmt(fullSummary.fleet_debit_summary.approved_consumption_l)} L</strong></span>
                  <span>Purchases: <strong>{fmt(fullSummary.fleet_debit_summary.purchases_l)} L</strong></span>
                  <span>Debit/Credit: <strong style={{ color: (fullSummary.fleet_debit_summary.debit_credit_amount_xaf ?? 0) < 0 ? urgency.critical.fg : urgency.ok.fg }}>{fmt(fullSummary.fleet_debit_summary.debit_credit_amount_xaf)} XAF</strong></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {/* ── Budget Request / Approval — the earliest step in the process:
          what Grato asked IHS Towers for, and what was actually approved,
          done by email directly, not through this system. ── */}
      {(reqApprovalLoading || reqApproval) && (
        <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📨 Budget Request → Approval — {monthLabel(reqApprovalCycle)}</div>
            <select value={reqApprovalCycle} onChange={e => setReqApprovalCycle(e.target.value)}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="2026-02">February '26</option>
              <option value="2026-04">April '26</option>
              <option value="2026-06">June '26</option>
              <option value="2026-07">July '26</option>
              <option value="2026-08">August '26</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
            The actual request-and-approval step, per site — what Grato asked IHS Towers for ("SBC Request") vs. what IHS Towers approved. Submitted by email directly, upstream of everything else on this page.
            {reqApprovalCycle === '2026-08' && ' Note: August\'s source document has no "requested" figure at all — only a single estimated/approved budget per site — so the Requested column is blank for every site this month, not a data gap.'}
          </div>
          {reqApprovalLoading ? <Spinner /> : !reqApproval?.sites?.length ? (
            <EmptyState icon="📨" title="No request/approval data" desc="Run scripts/importBudgetRequestApproval.js to load recovered data." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Requested</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(reqApproval.summary?.total_requested_l)} L</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Approved</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(reqApproval.summary?.total_approved_l)} L</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Approved Less Than Asked</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: urgency.high.fg }}>{reqApproval.summary?.approved_less_count ?? 0} site(s)</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Approved More Than Asked</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: urgency.ok.fg }}>{reqApproval.summary?.approved_more_count ?? 0} site(s)</div>
                </div>
              </div>
              <div style={{ overflow: 'auto', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                    <tr>
                      {['Site', 'Cluster', 'Requested (L)', 'Approved (L)', 'Variance', 'Comment'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reqApproval.sites.map((s: any) => (
                      <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{s.site_name || s.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id}</div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{s.cluster || '—'}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(s.sbc_requested_l)}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(s.ihs_approved_l)}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: (s.variance_l ?? 0) < 0 ? urgency.high.fg : (s.variance_l ?? 0) > 0 ? urgency.ok.fg : neutral[400] }}>
                          {s.variance_l != null ? `${s.variance_l > 0 ? '+' : ''}${fmt(s.variance_l)}` : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', color: neutral[600], fontSize: 11 }}>{s.comments || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Monthly Debit/Credit Settlement — submitted vs approved, purchases, the actual XAF settlement ── */}
      {(debitSummaryLoading || debitSummary) && (
        <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🧾 Monthly Debit/Credit Settlement</div>
          <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
            Fleet-wide, per month — submitted vs. approved consumption, actual purchases, and the resulting debit or credit with IHS Towers. A negative amount means Grato owes IHS Towers (consumed/purchased more than approved).
          </div>
          {debitSummaryLoading ? <Spinner /> : !debitSummary?.months?.length ? (
            <EmptyState icon="🧾" title="No settlement data" desc="Run scripts/importMonthlyDebitSummary.js to load recovered data." />
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Month', 'Submitted (L)', 'Approved (L)', 'Purchases (L)', 'Mgmt Fees (XAF)', 'Debit/Credit (XAF)'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {debitSummary.months.map((m: any) => (
                    <tr key={m.cycle_key} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{monthLabel(m.cycle_key)}</td>
                      <td style={{ padding: '7px 10px' }}>{fmt(m.submitted_consumption_l)}</td>
                      <td style={{ padding: '7px 10px' }}>{fmt(m.approved_consumption_l)}</td>
                      <td style={{ padding: '7px 10px' }}>{fmt(m.purchases_l)}</td>
                      <td style={{ padding: '7px 10px' }}>{fmt(m.management_fees_xaf)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: (m.debit_credit_amount_xaf ?? 0) < 0 ? urgency.critical.fg : urgency.ok.fg }}>
                        {fmt(m.debit_credit_amount_xaf)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── March 2026 mid-cycle estimate — a working "where do we stand" snapshot, genuinely different from a formal reconciliation ── */}
      {(midCycleEstimateLoading || midCycleEstimate) && (
        <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📋 March 2026 Mid-Cycle Estimate (19 March snapshot)</div>
          <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
            A working "where do we stand" snapshot from mid-March — initial budget plus two emergency top-up rounds already given, against what had actually been refueled by 19 March. Not a formal monthly reconciliation, and only covers the {midCycleEstimate?.sites?.length ?? 0} sites that were being actively tracked at the time.
          </div>
          {midCycleEstimateLoading ? <Spinner /> : !midCycleEstimate?.sites?.length ? (
            <EmptyState icon="📋" title="No estimate data" desc="Run scripts/importMarch2026EstimateToClose.js to load recovered data." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Initial Budget</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycleEstimate.totals?.initial_budget_l)} L</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>1st Extra</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycleEstimate.totals?.first_extra_l)} L</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>2nd Extra</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycleEstimate.totals?.second_extra_l)} L</div>
                </div>
                <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Refuel Done</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycleEstimate.totals?.total_refuel_done_l)} L</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Sites Furthest Behind (lowest balance first)</div>
              <div style={{ overflow: 'auto', maxHeight: 320 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {['Site', 'Cluster', 'Combined Budget (L)', 'Refuel Done (L)', 'Balance (L)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {midCycleEstimate.sites.slice(0, 20).map((s: any) => (
                      <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <td style={{ padding: '5px 8px' }}>{s.site_name || s.site_id}</td>
                        <td style={{ padding: '5px 8px' }}>{s.cluster || '—'}</td>
                        <td style={{ padding: '5px 8px' }}>{fmt(s.combined_budget_l)}</td>
                        <td style={{ padding: '5px 8px' }}>{fmt(s.total_refuel_done_l)}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: (s.balance_l ?? 0) < 0 ? urgency.critical.fg : urgency.ok.fg }}>
                          {fmt(s.balance_l)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Planned vs Supplied Delivery — a genuinely different concept from field visits: what was scheduled vs what actually arrived ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📅 Planned vs Supplied Delivery</div>
          <select value={plannedVsSuppliedMonth} onChange={e => setPlannedVsSuppliedMonth(e.target.value)}
            style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
            <option value="2026-05">May '26</option>
            <option value="2026-06">June '26</option>
          </select>
        </div>
        <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
          What was scheduled to be delivered vs. what actually arrived, per completed visit — different from the field-visit records above, which only capture the outcome, not what was planned against it. Only covers visits marked complete in the source at export time; still-pending plans aren't shown here.
        </div>
        {plannedVsSuppliedLoading ? <Spinner /> : !plannedVsSupplied?.records?.length ? (
          <EmptyState icon="📅" title="No planned-vs-supplied data" desc="Run scripts/importPlannedVsSuppliedDeliveries.js to load recovered data." />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Planned</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(plannedVsSupplied.totals?.planned_l)} L</div>
              </div>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Supplied</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(plannedVsSupplied.totals?.supplied_l)} L</div>
              </div>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Gap Types</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {Object.entries(plannedVsSupplied.gap_type_counts || {}).map(([type, count]: [string, any]) => (
                    <span key={type} style={{ marginRight: 10, color: type === 'OK' ? urgency.ok.fg : urgency.high.fg }}>{type}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ overflow: 'auto', maxHeight: 320 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Date', 'Site', 'Cluster', 'Planned (L)', 'Supplied (L)', 'Gap (L)', 'Gap Type'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plannedVsSupplied.records.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '5px 8px' }}>{r.date_done ? new Date(r.date_done).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{r.site_name || r.site_id}</td>
                      <td style={{ padding: '5px 8px' }}>{r.cluster || '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{fmt(r.planned_l)}</td>
                      <td style={{ padding: '5px 8px' }}>{fmt(r.supplied_l)}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: (r.gap_l ?? 0) !== 0 ? urgency.high.fg : neutral[400] }}>{fmt(r.gap_l)}</td>
                      <td style={{ padding: '5px 8px', color: r.gap_type === 'OK' ? urgency.ok.fg : urgency.high.fg }}>{r.gap_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Individual Fuel Purchases — procurement side, distinct from field-visit deliveries ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>⛽ Individual Fuel Purchases</div>
          <select value={purchasesMonth} onChange={e => setPurchasesMonth(e.target.value)}
            style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
            {['2025-12', '2026-01', '2026-02', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
          Bulk fuel bought with a card at a specific gas station — the procurement side of the supply chain, distinct from the per-site delivery records above.
        </div>
        {purchasesLoading ? <Spinner /> : !purchases?.transactions?.length ? (
          <EmptyState icon="⛽" title="No purchase data" desc="Run scripts/importHistoricalFuelPurchases.js to load recovered data." />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Purchased</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(purchases.summary?.total_l)} L</div>
              </div>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Spent</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(purchases.summary?.total_xaf)} XAF</div>
              </div>
              <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Transactions</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{purchases.summary?.total_transactions ?? 0}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Top Gas Stations</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {(purchases.top_stations || []).slice(0, 8).map((s: any) => (
                <div key={s._id} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                  <strong>{s._id || 'Unknown'}</strong>
                  <span style={{ color: neutral[400] }}> · {fmt(s.total_l)} L over {s.count} transaction(s)</span>
                </div>
              ))}
            </div>

            <div style={{ overflow: 'auto', maxHeight: 320 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                  <tr>
                    {['Date', 'Card', 'Station', 'Quantity (L)', 'Amount (XAF)', 'Vendor'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.transactions.map((t: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '5px 8px' }}>{t.purchase_date ? new Date(t.purchase_date).toLocaleString() : '—'}</td>
                      <td style={{ padding: '5px 8px', color: neutral[400] }}>{t.card_number}</td>
                      <td style={{ padding: '5px 8px' }}>{t.place || '—'}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>{fmt(t.quantity_l)}</td>
                      <td style={{ padding: '5px 8px' }}>{fmt(t.amount_xaf)}</td>
                      <td style={{ padding: '5px 8px', color: neutral[600] }}>{t.vendor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {summary && (
        <>
          {/* ── Fleet summary cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Months Recovered', value: summary.months_covered?.length ?? 0 },
              { label: 'Chronically Exhausted Sites', value: summary.chronically_exhausted_sites?.length ?? 0, color: urgency.critical.fg },
              { label: 'Latest Month Exhausted', value: summary.by_month?.[summary.by_month.length - 1]?.exhausted_count ?? 0, color: urgency.high.fg },
              { label: 'Sites With Theft Flag', value: summary.by_month?.reduce((s: number, m: any) => s + (m.theft_flagged_count || 0), 0) ?? 0, color: urgency.critical.fg },
            ].map(box => (
              <div key={box.label} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase', marginBottom: 4 }}>{box.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: box.color || ink }}>{box.value}</div>
              </div>
            ))}
          </div>

          {/* ── Fleet-wide budget vs consumption trend ── */}
          <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Fleet-Wide Budget vs. Actual Consumption</div>
            {monthChartData.length === 0 ? (
              <EmptyState icon="📊" title="No recovered months" desc="Run scripts/importHistoricalEmailData.js to load recovered data." />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Liters', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} L`} />
                    <Legend />
                    <ReferenceLine y={0} stroke={neutral[300]} />
                    <Line type="monotone" dataKey="budget" name="Budget (Requested)" stroke="#6b7280" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="consumption" name="Actual Consumption" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="reserve" name="Reserve Remaining" stroke={urgency.ok.fg} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ fontSize: 11, color: neutral[400], marginTop: 8 }}>
              Budget and reserve lines only reflect months where a budget file was actually recovered — currently just January 2026.
              Other months show real consumption and run-hours, but no reserve comparison until their budget files are located.
            </div>
          </div>

          {/* ── Ad-hoc / emergency fuel requests ── */}
          {(adhocLoading || adhoc) && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🚨 Ad-Hoc / Emergency Fuel Requests</div>
              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
                Outside the normal monthly budget cycle — recovered from the real shortage-response emails (late July – early August 2026).
              </div>
              {adhocLoading ? <Spinner /> : !adhoc?.by_date?.length ? (
                <EmptyState icon="🚨" title="No ad-hoc requests recorded" desc="Run scripts/importAdHocFuelRequests.js to load recovered data." />
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Emergency Fuel</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(adhoc.summary?.total_l)} L</div>
                    </div>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Requests</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{adhoc.summary?.total_requests ?? 0}</div>
                    </div>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Sites Affected</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{adhoc.summary?.unique_sites ?? 0}</div>
                    </div>
                  </div>
                  <div style={{ height: 220, marginBottom: 14 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adhoc.by_date}>
                        <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: 'Liters', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                        <Tooltip formatter={(v: number, name: string) => name === 'total_l' ? [`${v.toLocaleString()} L`, 'Requested'] : [v, 'Requests']} />
                        <Bar dataKey="total_l" name="Requested" fill={urgency.high.fg} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Sites Needing Emergency Fuel Most</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(adhoc.top_sites || []).slice(0, 12).map((s: any) => (
                      <div key={s._id} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                        <strong>{s.site_name || s._id}</strong>
                        <span style={{ color: neutral[400] }}> · {fmt(s.total_l)} L over {s.request_count} request(s)</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Month-by-month breakdown ── */}
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Month by Month</div>
                  <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
                    Reflects the real, checked coverage of the recovered source data — not every month's ad-hoc/extra
                    fuel requests were recoverable as structured data (e.g. April's "2nd Extra Fuel Request" email
                    thread exists but has no attachment, only a dispute over data quality). Where a month's source
                    tracked approval and actual delivery separately from the request itself (currently only March
                    2026), those figures are shown alongside the request — other months only ever had the request
                    figure to recover in the first place.
                  </div>
                  <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, overflow: 'hidden' }}>
                    {(adhoc.by_month || []).map((m: any) => (
                      <div key={m.month_key} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === m.month_key ? null : m.month_key)}
                          style={{
                            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', background: expandedMonth === m.month_key ? neutral[50] : '#fff',
                            border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{monthLabel(m.month_key)}</span>
                          <span style={{ color: neutral[500] }}>
                            {fmt(m.total_l)} L requested
                            {m.has_approval_data && ` · ${fmt(m.total_approved_l)} L approved · ${fmt(m.total_delivered_l)} L delivered`}
                            {' · '}{m.request_count} request(s) · {m.unique_sites} site(s)
                            <span style={{ marginLeft: 10 }}>{expandedMonth === m.month_key ? '▲' : '▼'}</span>
                          </span>
                        </button>
                        {expandedMonth === m.month_key && (
                          <div style={{ padding: '0 14px 12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                              <thead>
                                <tr>
                                  {(m.has_approval_data
                                    ? ['Site', 'Cluster', 'Requested (L)', 'Approved (L)', 'Delivered (L)', 'Requests', 'Dates']
                                    : ['Site', 'Cluster', 'Total (L)', 'Requests', 'Dates']
                                  ).map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(m.sites || []).map((s: any) => (
                                  <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                                    <td style={{ padding: '5px 8px' }}>{s.site_name || s.site_id}</td>
                                    <td style={{ padding: '5px 8px' }}>{s.cluster || '—'}</td>
                                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{fmt(s.total_l)}</td>
                                    {m.has_approval_data && <td style={{ padding: '5px 8px' }}>{s.approved_l != null ? fmt(s.approved_l) : '—'}</td>}
                                    {m.has_approval_data && <td style={{ padding: '5px 8px' }}>{s.delivered_l != null ? fmt(s.delivered_l) : '—'}</td>}
                                    <td style={{ padding: '5px 8px' }}>{s.request_count}</td>
                                    <td style={{ padding: '5px 8px', color: neutral[400] }}>{(s.dates || []).join(', ')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Mid-cycle partial budget release (August 2026) ── */}
          {(midCycleLoading || midCycle) && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📦 Mid-Cycle Budget Release — August 2026</div>
              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
                August's budget released early, in tiers (50%, later 80%), during the same shortage response — tracked here against actual delivery, separately from the regular monthly cycle.
              </div>
              {midCycleLoading ? <Spinner /> : !midCycle?.sites?.length ? (
                <EmptyState icon="📦" title="No mid-cycle release data" desc="Run scripts/importMidCycleBudgetRelease.js to load recovered data." />
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Released</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycle.summary?.total_released_l)} L</div>
                    </div>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Delivered</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(midCycle.summary?.total_delivered_l)} L</div>
                    </div>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Sites Ahead of Release</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: urgency.ok.fg }}>{midCycle.summary?.sites_ahead_of_release ?? 0}</div>
                    </div>
                    <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Sites Behind Release</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: urgency.high.fg }}>{midCycle.summary?.sites_behind_release ?? 0}</div>
                    </div>
                  </div>

                  {midCycle.daily_trend?.length > 0 && (
                    <div style={{ height: 240, marginBottom: 6 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={midCycle.daily_trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Liters Delivered', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => v != null ? `${v.toLocaleString()} L` : '—'} />
                          <Legend />
                          {(midCycle.clusters || []).map((c: string, i: number) => (
                            <Line key={c} type="monotone" dataKey={c} name={c} stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: neutral[400] }}>
                    Daily delivery by cluster, from the source tracker's own cluster-level recap — the per-site daily "done" columns weren't parsed (see the changelog for why: too inconsistently labeled to trust).
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tom Card cluster allocation (budget request, upstream) — now covers two distinct cycles, shown separately, not blended ── */}
          {(tomCardLoading || tomCard) && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>💳 Tom Card Allocation — Fuel Card Funding Request</div>
              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
                The upstream funding request — cluster-level fuel cards topped up ahead of the cycle they fund, distinct from the per-site budget above.
                Two separate recovered documents, shown by their own cycle rather than blended into one total.
              </div>
              {tomCardLoading ? <Spinner /> : !tomCard?.cycles?.length ? (
                <EmptyState icon="💳" title="No allocation data" desc="Run scripts/importTomCardAllocation.js and importCardLimitData.js to load recovered data." />
              ) : (
                tomCard.cycles.map((c: any) => (
                  <div key={c.funded_cycle_key} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Funding {monthLabel(c.funded_cycle_key)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 10 }}>
                      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Requested</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(c.totals?.quantity_l)} L</div>
                      </div>
                      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Total Funded</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(c.totals?.amount_xaf)} XAF</div>
                      </div>
                      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase' }}>Grand Total (incl. fees)</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{c.grand_total_xaf != null ? `${fmt(c.grand_total_xaf)} XAF` : '—'}</div>
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Cluster', 'Qty (L)', 'Unit Price', 'Amount (XAF)', 'Card No.'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.allocations.map((a: any) => (
                          <tr key={a.cluster} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '6px 8px' }}>{a.cluster}</td>
                            <td style={{ padding: '6px 8px' }}>{fmt(a.quantity_l ?? a.budget_l)}</td>
                            <td style={{ padding: '6px 8px' }}>{fmt(a.unit_price_xaf)}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{fmt(a.amount_xaf ?? a.budget_xaf)}</td>
                            <td style={{ padding: '6px 8px', color: neutral[400] }}>{a.card_number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── One-off site stock snapshots (Phase 70) — closes a real gap found during audit: this data was imported with no way to view it ── */}
      {(stockSnapshotsLoading || stockSnapshots) && (
        <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📋 One-Off Site Stock Snapshots</div>
          <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
            Three genuinely different one-off audits, not a recurring series — each only appears in a single recovered month.
          </div>
          {stockSnapshotsLoading ? <Spinner /> : !stockSnapshots?.total ? (
            <EmptyState icon="📋" title="No snapshot data" desc="Run scripts/importHistoricalSiteStockSnapshots.js to load recovered data." />
          ) : (
            <>
              {[
                { key: 'ho_stock', label: 'HO Stock (December 2025)', cols: ['Site', 'Meter Reading', 'Stock Left (L)'] },
                { key: 'bb_site_stock', label: 'BB Site Stock (April 2026)', cols: ['Site', 'Allocated (L)', 'Refuelled (L)', 'Stock Left (L)'] },
                { key: 'small_tank_usage', label: 'Small Tank Usage (May 2026)', cols: ['Site', 'Usage (L)'] },
              ].map(group => {
                const rows = stockSnapshots.groups?.[group.key] || [];
                if (!rows.length) return null;
                return (
                  <div key={group.key} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{group.label} — {rows.length} site(s)</div>
                    <div style={{ overflow: 'auto', maxHeight: 240 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr>
                            {group.cols.map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '5px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r: any, i: number) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                              <td style={{ padding: '4px 8px' }}>{r.site_name || r.site_id}</td>
                              {group.key === 'ho_stock' && <>
                                <td style={{ padding: '4px 8px' }}>{r.generator_meter_faulty ? <span style={{ color: urgency.critical.fg }}>FAULTY</span> : fmt(r.generator_meter_reading)}</td>
                                <td style={{ padding: '4px 8px' }}>{fmt(r.stock_left_l)}</td>
                              </>}
                              {group.key === 'bb_site_stock' && <>
                                <td style={{ padding: '4px 8px' }}>{fmt(r.stock_allocated_l)}</td>
                                <td style={{ padding: '4px 8px' }}>{fmt(r.qty_refuelled_l)}</td>
                                <td style={{ padding: '4px 8px' }}>{fmt(r.stock_left_l)}</td>
                              </>}
                              {group.key === 'small_tank_usage' && <td style={{ padding: '4px 8px' }}>{fmt(r.usage_l)}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Chronically exhausted sites ── */}
          {summary.chronically_exhausted_sites?.length > 0 && (
            <div style={{ border: `1px solid ${urgency.critical.fg}`, borderRadius: 12, padding: 16, marginBottom: 20, background: `${urgency.critical.fg}06` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⚠ Chronically Exhausted Sites</div>
              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 10 }}>
                These sites exhausted their budget in every recovered month they had one — not a one-off, a pattern.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.chronically_exhausted_sites.map((s: any) => (
                  <button
                    key={s._id}
                    onClick={() => loadSiteHistory(s._id)}
                    style={{
                      border: `1px solid ${urgency.critical.fg}40`, borderRadius: 8, padding: '6px 10px',
                      background: '#fff', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                    }}
                  >
                    <strong>{s.site_name || s._id}</strong>
                    <span style={{ color: neutral[400] }}> · {s.months_exhausted}/{s.months_with_budget} months · avg {fmt(s.avg_reserve_l)} L</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Site-by-site reserves for a selected month ── */}
          <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Site-by-Site Reserves</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                  {(summary.months_covered || []).map((m: string) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </select>
                <input
                  value={siteQuery} onChange={e => setSiteQuery(e.target.value)} placeholder="Search site…"
                  style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 160 }}
                />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                  <option value="reserve">Sort: Lowest Reserve First</option>
                  <option value="consumption">Sort: Highest Consumption First</option>
                  <option value="variance">Sort: Largest CMS/Field Gap First</option>
                </select>
              </div>
            </div>

            {reservesLoading ? (
              <Spinner />
            ) : filteredReserves.length === 0 ? (
              <EmptyState icon="📋" title="No data for this month" desc="This month may not have a recovered validation file." />
            ) : (
              <div style={{ overflow: 'auto', maxHeight: 480 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
                    <tr>
                      {['Site', 'Cluster', 'Budget (L)', 'Consumed (L)', 'Reserve (L)', 'Status', 'CMS vs Field', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReserves.map((r: any) => (
                      <tr key={r.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{r.site_name || r.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{r.site_id}</div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{r.cluster || '—'}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(r.budget_liters)}</td>
                        <td style={{ padding: '7px 10px' }}>{fmt(r.final_consumption_l)}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: r.reserve_liters != null && r.reserve_liters < 0 ? urgency.critical.fg : ink }}>
                          {fmt(r.reserve_liters)}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          {r.budget_liters == null ? (
                            <span style={{ color: neutral[400] }}>No budget data</span>
                          ) : r.fully_exhausted ? (
                            <span style={{ color: urgency.critical.fg, fontWeight: 700 }}>Exhausted</span>
                          ) : (
                            <span style={{ color: urgency.ok.fg, fontWeight: 700 }}>Has Reserve</span>
                          )}
                        </td>
                        <td style={{ padding: '7px 10px' }}>{fmt(r.rh_variance, 1)}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <button onClick={() => loadSiteHistory(r.site_id)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>
                            Trend →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Site trend detail ── */}
          {(siteHistoryLoading || siteHistory) && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {siteHistory?.history?.[0]?.site_name || siteHistory?.site_id} — Full Recovered History
                </div>
                <Btn variant="secondary" size="sm" onClick={() => { setSiteHistory(null); setFieldVisits(null); }}>Close</Btn>
              </div>
              {siteHistoryLoading ? <Spinner /> : siteHistory?.history?.length === 0 ? (
                <EmptyState icon="📈" title="No history" desc="No recovered records for this site." />
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(siteHistory?.history || []).map((h: any) => ({
                      month: monthLabel(h.month_key),
                      budget: h.budget_liters,
                      consumption: h.final_consumption_l,
                      reserve: h.reserve_liters,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => v != null ? `${v.toLocaleString()} L` : '—'} />
                      <Legend />
                      <Line type="monotone" dataKey="budget" name="Budget" stroke="#6b7280" strokeDasharray="4 4" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="consumption" name="Consumed" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Individual visit records — the most granular data recovered (Phase 68) ── */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${neutral[100]}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Individual Visit Records</div>
                {fieldVisitsLoading ? <Spinner /> : !fieldVisits?.visits?.length ? (
                  <div style={{ fontSize: 12, color: neutral[400] }}>No individual visit records recovered for this site.</div>
                ) : (
                  <div style={{ overflow: 'auto', maxHeight: 320 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                        <tr>
                          {['Visit Date', 'Meter Reading', 'RH', 'Fuel Found (L)', 'Fuel Added (L)', 'Fuel Left (L)', 'Generator Status'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fieldVisits.visits.map((v: any, i: number) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '5px 8px' }}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.generator_meter_reading)}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.run_hours, 1)}</td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.fuel_found_l)}</td>
                            <td style={{ padding: '5px 8px', fontWeight: v.fuel_added_l ? 700 : 400, color: v.fuel_added_l ? urgency.ok.fg : neutral[400] }}>
                              {v.fuel_added_l ? fmt(v.fuel_added_l) : '—'}
                            </td>
                            <td style={{ padding: '5px 8px' }}>{fmt(v.fuel_left_l)}</td>
                            <td style={{ padding: '5px 8px', color: neutral[600] }}>{v.generator_status || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
