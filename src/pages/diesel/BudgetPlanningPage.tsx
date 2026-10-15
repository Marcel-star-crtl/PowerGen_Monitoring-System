/**
 * BudgetPlanningPage.tsx
 *
 * Automated per-site budget planning, before a cycle starts. Generates a
 * preview using the organization's own verified engineering formula
 * (services/budgetPlanningService.js), cross-validated against real
 * recent consumption trend, with clear flags where the two disagree.
 * Nothing is written anywhere until the manager reviews and explicitly
 * commits — this page never silently changes real budget data.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Modal } from '@/components/common/Modal';
import { useCycles } from '../../hooks/useDiesel';
import { budgetPlanningApi, sitesDirectoryApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn, CycleSelector, Card, SectionLabel, KpiCard } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, status as statusTokens, font } from '../../styles/dieselTokens';

type PlanSite = {
  site_id: string;
  site_name?: string;
  cluster?: string;
  region?: string;
  topology?: string;
  plannable: boolean;
  reason?: string;
  days_in_cycle?: number;
  genset_cph?: number;
  final_grid_availability?: number;
  budgeted_rh?: number;
  engineering_estimate_l?: number;
  trend_l?: number | null;
  variance_pct?: number | null;
  months_of_history?: number;
  budget_liters: number;
  budget_xaf?: number;
  confidence?: 'high' | 'medium' | 'low';
  flag?: string | null;
  history?: { cycle_key: string; actual_consumption_l: number }[];
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: urgency.ok.fg,
  medium: urgency.medium.fg,
  low: urgency.high.fg,
};

function fmtNum(n?: number | null, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthLabel(cycleKey: string): string {
  const [year, month] = cycleKey.split('-');
  const idx = Number(month) - 1;
  if (idx < 0 || idx > 11) return cycleKey;
  return `${MONTH_NAMES[idx]} '${year.slice(2)}`;
}

export default function BudgetPlanningPage() {
  const { cycles, selectedKey, setSelectedKey } = useCycles();
  const [daysOverride, setDaysOverride] = useState('30');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [edited, setEdited] = useState<Record<string, number>>({});
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string>('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [viewingHistorySite, setViewingHistorySite] = useState<PlanSite | null>(null);
  const [loadingHistoryFor, setLoadingHistoryFor] = useState<string | null>(null);
  const [fleetTrend, setFleetTrend] = useState<any[]>([]);
  const [fleetTrendLoading, setFleetTrendLoading] = useState(true);

  useEffect(() => {
    budgetPlanningApi.fleetTrend()
      .then((res: any) => setFleetTrend((res as any)?.data?.trend || res?.trend || []))
      .catch(() => {})
      .finally(() => setFleetTrendLoading(false));
  }, []);

  async function openHistoryChart(s: PlanSite) {
    setLoadingHistoryFor(s.site_id);
    try {
      const res = await budgetPlanningApi.history(s.site_id);
      const history = (res as any)?.data?.history || (res as any)?.history || [];
      setViewingHistorySite({ ...s, history });
    } catch {
      setViewingHistorySite({ ...s, history: [] });
    } finally {
      setLoadingHistoryFor(null);
    }
  }

  // ── Standalone site search — view any site's trend without generating
  // a full fleet-wide plan first. Reuses the same single-site endpoint
  // (siteDetail) and the same modal as the plan table's chart button.
  const [siteSearch, setSiteSearch] = useState('');
  const [siteSearchResults, setSiteSearchResults] = useState<any[]>([]);
  const [siteSearchLoading, setSiteSearchLoading] = useState(false);

  useEffect(() => {
    const q = siteSearch.trim();
    if (q.length < 2) { setSiteSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSiteSearchLoading(true);
      try {
        const res = await sitesDirectoryApi.list({ search: q });
        const list = (res as any)?.data || res || [];
        setSiteSearchResults(list.slice(0, 8));
      } catch {
        setSiteSearchResults([]);
      } finally {
        setSiteSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [siteSearch]);

  async function openHistoryForSiteId(site_id: string, site_name?: string) {
    setSiteSearch('');
    setSiteSearchResults([]);
    setLoadingHistoryFor(site_id);
    try {
      const days = cycleExists ? undefined : (Number(daysOverride) || 30);
      const detailRes = await budgetPlanningApi.siteDetail(selectedKey || '', site_id, days);
      const detail = (detailRes as any)?.data || detailRes || {};
      const historyRes = await budgetPlanningApi.history(site_id);
      const history = (historyRes as any)?.data?.history || (historyRes as any)?.history || [];
      setViewingHistorySite({ ...detail, site_id, site_name: detail.site_name || site_name, history });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load site trend');
    } finally {
      setLoadingHistoryFor(null);
    }
  }

  // Does the target cycle already exist? If not, the ?days= override is
  // required and shown; if it does, the real cycle length is used and
  // the override is hidden, since it wouldn't have any effect.
  const cycleExists = cycles.some((c: any) => c.cycle_key === selectedKey);

  async function generatePlan() {
    if (!selectedKey) { setError('Select or enter a cycle first.'); return; }
    setLoading(true);
    setError(null);
    setCommitResult(null);
    setEdited({});
    try {
      const days = cycleExists ? undefined : (Number(daysOverride) || 30);
      const res = await budgetPlanningApi.preview(selectedKey, days);
      setPlan((res as any)?.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }

  const sites: PlanSite[] = plan?.sites || [];
  const unplannable: PlanSite[] = plan?.unplannable_sites || [];

  const filtered = useMemo(() => {
    return sites.filter(s => {
      if (confidenceFilter && s.confidence !== confidenceFilter) return false;
      if (flaggedOnly && !s.flag) return false;
      return true;
    });
  }, [sites, confidenceFilter, flaggedOnly]);

  function effectiveLiters(s: PlanSite): number {
    return edited[s.site_id] ?? s.budget_liters;
  }

  const totalEffective = useMemo(
    () => sites.reduce((sum, s) => sum + effectiveLiters(s), 0),
    [sites, edited]
  );

  async function handleCommit() {
    if (!cycleExists) {
      setError('The target cycle must exist before committing — create it first, then generate and commit the plan.');
      return;
    }
    if (!window.confirm(`Commit budgets for ${sites.length} site(s) to cycle ${selectedKey}? This writes real SiteBudget records.`)) return;

    setCommitting(true);
    setError(null);
    try {
      const payload = sites.map(s => ({ ...s, budget_liters: effectiveLiters(s) }));
      const res = await budgetPlanningApi.commit(selectedKey, payload);
      setCommitResult((res as any)?.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Commit failed');
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🧮 Automated Budget Planning"
        subtitle="Projects your verified engineering formula forward, cross-checked against each site's real recent consumption. Nothing is written until you review and commit."
      />

      {/* Fleet-wide consumption trend — the historical data imported from
          the Grato Diesel Conso spreadsheet (Phase 38), shown graphically
          up front rather than requiring a generated plan first. Distinct
          from the per-site chart below: this is the whole-fleet picture,
          for spotting an overall trend before drilling into any one site. */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Fleet-Wide Consumption Trend</SectionLabel>
        {fleetTrendLoading ? (
          <Spinner />
        ) : fleetTrend.length === 0 ? (
          <EmptyState icon="📊" title="No historical data yet" desc="Run scripts/importBudgetPlanningData.js to load historical consumption data." />
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fleetTrend.map((t: any) => ({
                month: monthLabel(t.cycle_key),
                liters: t.total_consumption_l,
                sites: t.site_count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Total Liters', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip formatter={(v: number, name: string) => name === 'liters' ? [`${v.toLocaleString()} L`, 'Total Consumption'] : [v, 'Sites Reporting']} />
                <Legend />
                <Line type="monotone" dataKey="liters" name="Total Consumption" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Individual site trend — search any site directly, no need to
          generate a full plan first. The plan table's own 📈 button
          (further down) does the same thing for sites already in a
          generated plan; this is for checking one site on its own. */}
      <Card style={{ marginBottom: 20, position: 'relative' }}>
        <SectionLabel>View an Individual Site's Trend</SectionLabel>
        <input
          value={siteSearch}
          onChange={e => setSiteSearch(e.target.value)}
          placeholder="Search site name or ID…"
          aria-label="Search for a site to view its consumption trend"
          disabled={!selectedKey}
          style={{ width: '100%', maxWidth: 400, border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, boxSizing: 'border-box' }}
        />
        {!selectedKey && (
          <div style={{ fontSize: 12, color: neutral[400], marginTop: 6 }}>Select a target cycle below first.</div>
        )}
        {siteSearchLoading && <div style={{ fontSize: 12, color: neutral[400], marginTop: 6 }}>Searching…</div>}
        {siteSearchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: 74, left: 16, width: 400, maxWidth: 'calc(100% - 32px)',
            background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden',
          }}>
            {siteSearchResults.map((s: any) => (
              <button
                key={s.IHS_ID_SITE || s.site_id}
                onClick={() => openHistoryForSiteId(s.IHS_ID_SITE || s.site_id, s.Site_Name || s.site_name)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                  fontSize: 12, border: 'none', borderBottom: `1px solid ${neutral[100]}`,
                  background: '#fff', cursor: 'pointer',
                }}
              >
                <strong>{s.Site_Name || s.site_name}</strong> <span style={{ color: neutral[400] }}>· {s.IHS_ID_SITE || s.site_id}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* ── Cycle selection / generation ── */}
      <Card style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: neutral[500], marginBottom: 4, textTransform: 'uppercase' }}>Target Cycle</div>
          <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
        </div>
        {!cycleExists && selectedKey && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: neutral[500], marginBottom: 4, textTransform: 'uppercase' }}>Days in Cycle (not yet created)</div>
            <input
              type="number" min={1} value={daysOverride} onChange={e => setDaysOverride(e.target.value)}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 100 }}
            />
          </div>
        )}
        <Btn variant="primary" onClick={generatePlan} loading={loading}>
          {plan ? 'Regenerate Plan' : 'Generate Plan'}
        </Btn>
        {!cycleExists && selectedKey && (
          <div style={{ fontSize: 12, color: neutral[500], maxWidth: 320 }}>
            Cycle "{selectedKey}" doesn't exist yet — you can preview a plan now, but committing requires the cycle to be created first.
          </div>
        )}
      </Card>

      {error && <ErrorBox message={error} />}

      {commitResult && (
        <div style={{
          border: `1px solid ${urgency.ok.fg}`, background: urgency.ok.bg, borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: statusTokens.success.text,
        }}>
          ✓ Committed {commitResult.written} site budget(s) to {commitResult.cycle_key}.
          {commitResult.errors?.length > 0 && ` ${commitResult.errors.length} error(s) — see console.`}
        </div>
      )}

      {loading && <Spinner />}

      {!loading && plan && (
        <>
          {/* ── Summary ── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Plannable Sites" value={plan.summary.plannable} />
            <KpiCard label="No Engineering Data" value={plan.summary.unplannable} />
            <KpiCard label="High Confidence" value={plan.summary.high_confidence} color={CONFIDENCE_COLOR.high} />
            <KpiCard label="Medium Confidence" value={plan.summary.medium_confidence} color={CONFIDENCE_COLOR.medium} />
            <KpiCard label="Low Confidence" value={plan.summary.low_confidence} color={CONFIDENCE_COLOR.low} />
            <KpiCard label="Flagged for Review" value={plan.summary.flagged_for_review} color={urgency.high.fg} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)}
                aria-label="Filter by confidence"
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                <option value="">All Confidence Levels</option>
                <option value="high">High Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="low">Low Confidence</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={flaggedOnly} onChange={e => setFlaggedOnly(e.target.checked)} />
                Flagged only
              </label>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              Total: {fmtNum(totalEffective)} L
              {Object.keys(edited).length > 0 && <span style={{ color: neutral[500], fontWeight: 400 }}> (edited)</span>}
            </div>
          </div>

          {/* ── Site table ── */}
          <Card padded={false} style={{ overflow: 'auto', maxHeight: 560, marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
                <tr>
                  {['Site', 'Cluster', 'CPH', 'Grid Avail.', 'Engineering Est. (L)', 'Recent Trend (L)', 'Variance', 'Confidence', 'Budget (L)', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}`, background: s.flag ? statusTokens.warning.bg : undefined }}>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{s.site_name || s.site_id}</div>
                      <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id}</div>
                    </td>
                    <td style={{ padding: '7px 10px' }}>{s.cluster || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>{fmtNum(s.genset_cph, 2)}</td>
                    <td style={{ padding: '7px 10px' }}>{s.final_grid_availability != null ? `${(s.final_grid_availability * 100).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '7px 10px' }}>{fmtNum(s.engineering_estimate_l)}</td>
                    <td style={{ padding: '7px 10px' }}>
                      {s.trend_l != null ? fmtNum(s.trend_l) : <span style={{ color: neutral[400] }}>no history</span>}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {s.variance_pct != null ? (
                        <span style={{ color: Math.abs(s.variance_pct) > 40 ? urgency.critical.fg : Math.abs(s.variance_pct) > 15 ? urgency.high.fg : urgency.ok.fg, fontWeight: 700 }}>
                          {s.variance_pct > 0 ? '+' : ''}{s.variance_pct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ color: CONFIDENCE_COLOR[s.confidence || ''] || neutral[500], fontWeight: 700, textTransform: 'capitalize' }}>
                        {s.confidence || '—'}
                      </span>
                      {s.flag && <div title={s.flag} style={{ fontSize: 10, color: statusTokens.warning.text, marginTop: 2, maxWidth: 220 }}>{s.flag}</div>}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <input
                        type="number" min={0}
                        value={effectiveLiters(s)}
                        onChange={e => setEdited(prev => ({ ...prev, [s.site_id]: Number(e.target.value) }))}
                        aria-label={`Budget liters for ${s.site_id}`}
                        style={{
                          width: 90, border: `1px solid ${edited[s.site_id] != null ? '#2563eb' : neutral[200]}`,
                          borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700,
                        }}
                      />
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <button
                        onClick={() => openHistoryChart(s)}
                        disabled={loadingHistoryFor === s.site_id}
                        title="View consumption trend"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}
                      >
                        {loadingHistoryFor === s.site_id ? '⏳' : '📈'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {unplannable.length > 0 && (
            <Card style={{ marginBottom: 20, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{unplannable.length} site(s) skipped — no engineering data on file</div>
              <div style={{ color: neutral[500] }}>
                {unplannable.slice(0, 15).map(s => s.site_id).join(', ')}{unplannable.length > 15 ? ` … and ${unplannable.length - 15} more` : ''}
              </div>
            </Card>
          )}

          <Btn variant="primary" onClick={handleCommit} loading={committing} disabled={sites.length === 0}>
            ✓ Commit Plan to {selectedKey}
          </Btn>
        </>
      )}

      {!loading && !plan && (
        <EmptyState icon="🧮" title="No plan generated yet" desc="Select a cycle and click Generate Plan to see automated per-site budget recommendations." />
      )}

      {/* Consumption trend chart — the historical data imported from the
          Grato Diesel Conso spreadsheet (Phase 38), shown graphically per
          site rather than only as the single weighted "Recent Trend"
          number in the table. The reference line marks the current
          engineering estimate, so a divergence is visible as a shape
          (the line crossing further above or below the dashed marker
          over time) rather than only as a variance percentage. */}
      <Modal
        isOpen={!!viewingHistorySite}
        onClose={() => setViewingHistorySite(null)}
        title={viewingHistorySite ? `Consumption Trend — ${viewingHistorySite.site_name || viewingHistorySite.site_id}` : 'Consumption Trend'}
        size="lg"
      >
        {viewingHistorySite && (
          <div>
            {(!viewingHistorySite.history || viewingHistorySite.history.length === 0) ? (
              <EmptyState icon="📈" title="No consumption history" desc="No historical consumption records are on file for this site yet." />
            ) : (
              <>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(viewingHistorySite.history || []).map(h => ({
                  month: monthLabel(h.cycle_key),
                  liters: h.actual_consumption_l,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Liters', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} L`, 'Actual Consumption']} />
                  <Legend />
                  <Line type="monotone" dataKey="liters" name="Actual Consumption" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  {viewingHistorySite.engineering_estimate_l != null && (
                    <ReferenceLine
                      y={viewingHistorySite.engineering_estimate_l}
                      stroke={urgency.medium.fg}
                      strokeDasharray="6 4"
                      label={{ value: 'Engineering estimate', position: 'insideTopRight', fontSize: 11, fill: urgency.medium.fg }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Full calculation breakdown — not just the final numbers.
                Mirrors services/budgetPlanningService.js's actual logic
                exactly: which blend weights were applied, and why,
                rather than leaving the recommended figure looking like a
                black box. */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>How this number was calculated</div>

              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 4 }}>
                1. Engineering estimate (your formula, projected for {viewingHistorySite.days_in_cycle || '—'} day(s)):
              </div>
              <div style={{ fontSize: 12, marginLeft: 12, marginBottom: 10, fontFamily: 'monospace' }}>
                (1 − {viewingHistorySite.final_grid_availability != null ? `${(viewingHistorySite.final_grid_availability * 100).toFixed(1)}%` : '—'} grid availability)
                × 24 × {viewingHistorySite.days_in_cycle || '—'} days = <strong>{fmtNum(viewingHistorySite.budgeted_rh, 1)} run-hours</strong>
                <br />
                {fmtNum(viewingHistorySite.budgeted_rh, 1)} hrs × {fmtNum(viewingHistorySite.genset_cph, 2)} L/hr (CPH) = <strong>{fmtNum(viewingHistorySite.engineering_estimate_l)} L</strong>
              </div>

              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 4 }}>
                2. Recent actual trend (weighted average of the last {Math.min(viewingHistorySite.months_of_history || 0, 3)} month(s), most recent weighted highest):
              </div>
              <div style={{ fontSize: 12, marginLeft: 12, marginBottom: 10, fontFamily: 'monospace' }}>
                {viewingHistorySite.trend_l != null ? <strong>{fmtNum(viewingHistorySite.trend_l)} L</strong> : 'No history on file — engineering estimate used alone'}
              </div>

              {viewingHistorySite.trend_l != null && (
                <>
                  <div style={{ fontSize: 12, color: neutral[600], marginBottom: 4 }}>
                    3. Variance between the two:
                  </div>
                  <div style={{ fontSize: 12, marginLeft: 12, marginBottom: 10, fontFamily: 'monospace' }}>
                    ({fmtNum(viewingHistorySite.trend_l)} − {fmtNum(viewingHistorySite.engineering_estimate_l)}) ÷ {fmtNum(viewingHistorySite.engineering_estimate_l)} = {' '}
                    <strong style={{ color: Math.abs(viewingHistorySite.variance_pct || 0) > 40 ? urgency.critical.fg : Math.abs(viewingHistorySite.variance_pct || 0) > 15 ? urgency.high.fg : urgency.ok.fg }}>
                      {viewingHistorySite.variance_pct != null && viewingHistorySite.variance_pct > 0 ? '+' : ''}{viewingHistorySite.variance_pct}%
                    </strong>
                  </div>

                  <div style={{ fontSize: 12, color: neutral[600], marginBottom: 4 }}>
                    4. Blend weights applied, based on how far apart they are:
                  </div>
                  <div style={{ fontSize: 12, marginLeft: 12, marginBottom: 10, fontFamily: 'monospace' }}>
                    {Math.abs(viewingHistorySite.variance_pct || 0) <= 15 ? (
                      <>≤15% apart → <strong>100% engineering estimate</strong> (trusted — consistent with real recent consumption)</>
                    ) : Math.abs(viewingHistorySite.variance_pct || 0) <= 40 ? (
                      <>
                        15–40% apart → <strong>50% engineering + 50% trend</strong><br />
                        ({fmtNum(viewingHistorySite.engineering_estimate_l)} × 0.5) + ({fmtNum(viewingHistorySite.trend_l)} × 0.5) = {fmtNum((viewingHistorySite.engineering_estimate_l || 0) * 0.5 + (viewingHistorySite.trend_l || 0) * 0.5)} L
                      </>
                    ) : (
                      <>
                        &gt;40% apart → <strong>20% engineering + 80% trend</strong> (the engineering assumption is very likely stale for this site — leaning toward what's actually been happening)<br />
                        ({fmtNum(viewingHistorySite.engineering_estimate_l)} × 0.2) + ({fmtNum(viewingHistorySite.trend_l)} × 0.8) = {fmtNum((viewingHistorySite.engineering_estimate_l || 0) * 0.2 + (viewingHistorySite.trend_l || 0) * 0.8)} L
                      </>
                    )}
                  </div>
                </>
              )}

              <div style={{ fontSize: 12, color: neutral[600], marginBottom: 4 }}>
                {viewingHistorySite.trend_l != null ? '5.' : '2.'} Rounded up to the next whole liter:
              </div>
              <div style={{ fontSize: 13, marginLeft: 12, fontWeight: 700 }}>
                Recommended budget: {fmtNum(viewingHistorySite.budget_liters)} L
              </div>

              {viewingHistorySite.flag && (
                <div style={{ marginTop: 10, fontSize: 11, color: statusTokens.warning.text, background: statusTokens.warning.bg, borderRadius: 6, padding: '6px 10px' }}>
                  ⚠ {viewingHistorySite.flag}
                </div>
              )}
            </Card>

            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: neutral[600] }}>
              <div>Confidence: <strong style={{ color: CONFIDENCE_COLOR[viewingHistorySite.confidence || ''] }}>{viewingHistorySite.confidence || '—'}</strong></div>
            </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
