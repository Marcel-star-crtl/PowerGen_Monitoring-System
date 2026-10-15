/**
 * DieselDashboardPage.tsx
 * Complete diesel operations dashboard — KPIs, budget utilisation,
 * fuel request stats, cluster breakdown, daily trend, live alerts.
 *
 * Data sources (all cycle-aware):
 *   /api/diesel/dashboard/kpis/:cycle_key     → KPIs + FuelRequest stats + SiteBudget totals
 *   /api/diesel/dashboard/cluster-heatmap/:ck → cluster breakdown
 *   /api/diesel/dashboard/daily-trend/:ck     → daily consumption chart
 *   /api/alerts                               → open alerts
 *   /api/site-budget/:ck/aggregate            → authoritative budget by cluster
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useCycles, useDashboard, useDailyTrend,
  useClusterHeatmap, useAlerts,
} from '../../hooks/useDiesel';
import {
  CycleSelector, KpiCard, SectionLabel, Card, SeverityBadge, AlertCard,
  fmtNum, fmtPct, fmtDate, Spinner, ErrorBox, PageHeader, Btn,
} from '../../components/diesel/DieselComponents';
import { alertsApi, reconciliationApi, aiInsightsApi } from '../../api/dieselApi';
import { useNotification } from '../../contexts/NotificationContext';
import apiClient from '../../api/client';
import { brand, ink as inkToken, urgency as urgencyTokens, neutral, status as statusTokens, font } from '../../styles/dieselTokens';

// ── Brand colours ────────────────────────────────────────────────────────────
// Sourced from the shared design tokens (dieselTokens.ts) rather than their
// own hex literals, so this page's palette can't drift from the rest of the
// redesigned diesel pages the way it had before this batch.
const PRIMARY = brand.primary;
const DARK    = inkToken;
const GREEN   = urgencyTokens.ok.fg;
const AMBER   = urgencyTokens.high.fg;
const BLUE    = urgencyTokens.medium.fg;

// ── RAG bar ──────────────────────────────────────────────────────────────────
function UtilBar({ pct, label, sub }: { pct: number; label: string; sub?: string }) {
  const color = pct >= 100 ? PRIMARY : pct >= 90 ? urgencyTokens.critical.fg : pct >= 75 ? AMBER : GREEN;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{pct.toFixed(1)}%{sub ? ` · ${sub}` : ''}</span>
      </div>
      <div style={{ background: neutral[200], borderRadius: 4, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: 7, background: color, borderRadius: 4, transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

const CLUSTER_COLORS = [BLUE, GREEN, AMBER, PRIMARY, '#7c3aed', '#0891b2', '#d97706'];

export default function DieselDashboardPage() {
  const nav = useNavigate();
  const { success: showSuccess, error: showError } = useNotification();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const [aiBriefing, setAiBriefing] = useState<any>(null);
  const [aiBriefingLoading, setAiBriefingLoading] = useState(true);
  const { data: kpiData,     loading: kpiLoading,     error: kpiError,     refetch: refetchKpis }  = useDashboard(selectedKey);
  const { data: trendData,   loading: trendLoading  } = useDailyTrend(selectedKey);
  const { data: clusterData, loading: clusterLoading } = useClusterHeatmap(selectedKey);
  const { data: alertData,   loading: alertLoading,   refetch: refetchAlerts } = useAlerts({ status: 'open', limit: 8 });
  const [budgetAgg, setBudgetAgg]   = useState<any[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Load authoritative budget aggregate from SiteBudget
  useEffect(() => {
    if (!selectedKey) return;
    setBudgetLoading(true);
    apiClient.get(`/site-budget/${selectedKey}/aggregate`)
      .then(r => setBudgetAgg(r.data?.data?.by_cluster || []))
      .catch(() => {})
      .finally(() => setBudgetLoading(false));
  }, [selectedKey]);

  // Compact AI Fleet Insights preview — hits the same cached endpoint the
  // dedicated page uses (services/aiFleetInsightsService.js), so this
  // doesn't trigger an extra expensive Gemini call on every dashboard
  // load, just the server-side cache most of the time.
  useEffect(() => {
    if (!selectedKey) return;
    setAiBriefingLoading(true);
    aiInsightsApi.briefing(selectedKey)
      .then((res: any) => setAiBriefing((res as any)?.data || res))
      .catch(() => {})
      .finally(() => setAiBriefingLoading(false));
  }, [selectedKey]);

  const kpis     = kpiData?.kpis;
  const fr: Partial<NonNullable<typeof kpis>['fuel_requests']> = kpis?.fuel_requests || {};
  const alerts   = (alertData as any)?.data || alertData || [];
  const clusters = (clusterData as any)?.data || clusterData || [];
  const trend    = (trendData  as any)?.data  || trendData  || [];
  const alertsBySev: Partial<Record<'critical'|'high'|'medium'|'low', number>> = kpiData?.alerts_by_severity || {};

  async function runReconciliation() {
    if (!selectedKey) return;
    setRunning(true);
    try {
      const res: any = await reconciliationApi.run(selectedKey);
      const result = res?.data || res;
      if (result?.errors > 0) {
        showError(`Reconciliation finished with errors: ${result.processed} site(s) OK, ${result.errors} failed. Check the server logs for details.`);
      } else if (result?.processed === 0) {
        showError(`Reconciliation ran but found no sites with budget, CMS, or field-visit data for ${selectedKey} — nothing to reconcile yet. Upload data for this cycle first.`);
      } else {
        showSuccess(`Reconciliation complete — ${result?.processed ?? 0} site(s) updated for ${selectedKey}.`);
      }
      refetchKpis();
    } catch (e: any) {
      // Previously: catch (_) {} — a failed run (e.g. no DieselCycle record
      // exists for this cycle) looked identical to a successful run that
      // simply found nothing to reconcile. Now surfaced explicitly.
      showError(e?.response?.data?.error || e?.message || 'Reconciliation failed — please try again or contact support.');
    } finally {
      setRunning(false);
    }
  }

  async function handleAcknowledge(id: string) { await alertsApi.acknowledge(id); refetchAlerts(); }
  async function handleResolve(id: string) { await alertsApi.resolve(id, 'Resolved from dashboard'); refetchAlerts(); }

  if (cyclesLoading) return <Spinner />;

  // Budget totals — prefer SiteBudget aggregate, fall back to KPI join
  const totalBudgetL  = budgetAgg.reduce((s, c) => s + (c.budget_liters || 0), 0) || kpis?.total_budget_liters || 0;
  const totalBudgetXAF = budgetAgg.reduce((s, c) => s + (c.budget_xaf || 0), 0);
  const totalLitersUsed = budgetAgg.reduce((s, c) => s + (c.liters_used || 0), 0);
  const cmsConsumed   = kpis?.total_cms_consumed || 0;
  const budgetUtilPct = totalBudgetL > 0 ? (cmsConsumed / totalBudgetL) * 100 : 0;
  const requestCommittedPct = totalBudgetL > 0 && fr.total_liters_approved
    ? (fr.total_liters_approved / totalBudgetL) * 100 : 0;

  // Pie chart data for fuel requests
  const reqPieData = [
    { name: 'Pending',  value: fr.pending  || 0, color: AMBER },
    { name: 'Approved', value: fr.approved || 0, color: GREEN },
    { name: 'Denied',   value: fr.denied   || 0, color: PRIMARY },
  ].filter(d => d.value > 0);

  // Merged cluster table (SiteBudget + reconciliation)
  const mergedClusters = (() => {
    const reconMap: Record<string, any> = {};
    clusters.forEach((c: any) => { reconMap[c._id] = c; });
    if (budgetAgg.length > 0) {
      return budgetAgg.map(b => ({
        _id:              b._id,
        sites:            b.sites,
        budget_liters:    b.budget_liters,
        budget_xaf:       b.budget_xaf,
        liters_used:      b.liters_used,
        liters_remaining: b.liters_remaining,
        utilisation_pct:  b.utilisation_pct,
        total_contractual: reconMap[b._id]?.total_contractual || 0,
        total_cms_consumed: reconMap[b._id]?.total_cms_consumed || 0,
        total_alerts:     reconMap[b._id]?.total_alerts || 0,
      }));
    }
    return clusters;
  })();

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="⛽ Diesel Operations Dashboard"
        subtitle={`Cycle ${selectedKey || '—'} · ${kpis?.total_sites || 0} sites · ${totalBudgetL.toLocaleString()} L budget`}
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            <Btn variant="secondary" size="sm" onClick={runReconciliation} disabled={running}>
              {running ? '⏳ Running…' : '🔄 Reconcile'}
            </Btn>
            <Btn size="sm" onClick={() => nav('/diesel/alerts')}>
              🔔 Alerts {kpiData?.open_alerts_total ? `(${kpiData.open_alerts_total})` : ''}
            </Btn>
          </>
        }
      />

      {kpiError && <ErrorBox message={kpiError} onRetry={refetchKpis} />}

      {/* ── ROW 1: KPI clusters — Budget / Activity / Risk, grouped and
          labelled the way the redesign groups every dashboard's figures,
          instead of one undifferentiated 9-card strip. ── */}
      {kpiLoading ? <Spinner /> : (
        <>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Budget</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <KpiCard label="Budget (L)" value={fmtNum(totalBudgetL)} sub="Cycle allocation" />
              <KpiCard label="Budget (XAF)" value={`${(totalBudgetXAF / 1e6).toFixed(1)}M`}
                sub={`IHS Approved: ${(kpis?.budget_liters_approved_ihs || 0).toLocaleString()} L`} />
              <KpiCard label="CMS Consumed (L)" value={fmtNum(cmsConsumed)}
                sub={`${budgetUtilPct.toFixed(1)}% of budget`}
                tone={budgetUtilPct > 90 ? 'crit' : budgetUtilPct > 75 ? 'warn' : undefined} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Activity</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <KpiCard label="Field-Added Fuel" value={fmtNum(kpis?.total_field_added)} color={BLUE}
                sub={!kpis?.total_sites ? '📡 Live (reconciliation not yet run)' : undefined} />
              <KpiCard label="Tom Card Spend (L)" value={fmtNum(kpis?.total_tomcard)} color="#7c3aed" />
              <KpiCard label="Total Runtime (h)" value={fmtNum(kpis?.total_final_rh, 1)} sub={`Across ${kpis?.total_sites || 0} sites`} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Risk</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <KpiCard label="Over-CCPH Sites" value={kpis?.sites_over_ccph || 0}
                tone={(kpis?.sites_over_ccph || 0) > 0 ? 'warn' : undefined} />
              <KpiCard label="Low-Fuel Sites" value={kpis?.sites_low_fuel || 0}
                tone={(kpis?.sites_low_fuel || 0) > 0 ? 'crit' : undefined} />
              <KpiCard label="Theft Suspected" value={kpis?.sites_theft_suspected || 0}
                sub={(kpis?.sites_theft_suspected || 0) > 0 ? 'Under investigation' : undefined}
                tone={(kpis?.sites_theft_suspected || 0) > 0 ? 'crit' : undefined} />
            </div>
          </div>
        </>
      )}

      {/* ── AI Fleet Insights preview — the full briefing lives at
          /diesel/ai-insights; this is a compact, always-visible preview
          right on the main dashboard, not tucked away on a page someone
          has to think to visit. ── */}
      {(aiBriefingLoading || aiBriefing) && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionLabel style={{ marginBottom: 0 }}>🧠 Fleet Intelligence Briefing</SectionLabel>
            <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/ai-insights')}>Full Briefing →</Btn>
          </div>
          {aiBriefingLoading ? (
            <div style={{ fontSize: 13, color: neutral[400] }}>Loading…</div>
          ) : !aiBriefing?.ai_enabled ? (
            <div style={{ fontSize: 13, color: neutral[500] }}>
              {aiBriefing?.evidence?.alerts?.total_open ?? 0} open alert(s), {aiBriefing?.evidence?.budget_planning?.total_flagged ?? 0} budget-plan flag(s) this cycle.
              Set <code>GEMINI_API_KEY</code> for an AI-written summary — view the full briefing for the complete picture.
            </div>
          ) : (
            <div style={{ fontSize: 13, color: neutral[700], lineHeight: 1.6 }}>
              {(aiBriefing.narrative || '').split('\n').find((l: string) => l.trim() && !l.startsWith('#')) || 'See full briefing for details.'}
            </div>
          )}
        </Card>
      )}

      {/* ── ROW 2: Fuel Request Stats + Budget Utilisation ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, marginBottom: 24 }}>

        {/* Fuel Request stats */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel style={{ marginBottom: 0 }}>⛽ Fuel Requests</SectionLabel>
            <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/fuel-requests')}>View →</Btn>
          </div>
          {kpiLoading ? <Spinner size={24} /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Pending Approval', value: fr.pending  || 0, color: AMBER },
                  { label: 'Fully Approved',   value: fr.approved || 0, color: GREEN },
                  { label: 'Disbursed',         value: fr.disbursed || 0, color: BLUE },
                  { label: 'Denied',            value: fr.denied   || 0, color: neutral[400] },
                ].map(s => (
                  <div key={s.label} style={{ background: neutral[50], borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
                    <p style={{ fontSize: 10, color: neutral[400], margin: '0 0 4px', textTransform: 'uppercase' }}>{s.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {(fr.total_liters_approved || 0) > 0 && (
                <>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: neutral[500] }}>Total Approved: </span>
                    <strong>{fmtNum(fr.total_liters_approved)} L</strong>
                    <span style={{ color: neutral[400], marginLeft: 8 }}>
                      = XAF {Math.round(fr.total_xaf_approved || 0).toLocaleString()}
                    </span>
                  </div>
                  {(fr.total_xaf_disbursed || 0) > 0 && (
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      <span style={{ color: neutral[500] }}>Total Disbursed: </span>
                      <strong style={{ color: GREEN }}>XAF {Math.round(fr.total_xaf_disbursed || 0).toLocaleString()}</strong>
                    </div>
                  )}
                  <UtilBar
                    pct={requestCommittedPct}
                    label="Committed vs Budget"
                    sub={`${fmtNum(fr.total_liters_approved)} / ${fmtNum(totalBudgetL)} L`}
                  />
                </>
              )}
              {reqPieData.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={reqPieData} dataKey="value" cx="50%" cy="50%" outerRadius={40} innerRadius={24}>
                      {reqPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: string) => [v, n]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </Card>

        {/* Budget utilisation by cluster */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel style={{ marginBottom: 0 }}>📊 Budget Utilisation by Cluster</SectionLabel>
            <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/site-budget-upload')}>Manage →</Btn>
          </div>
          {budgetLoading ? <Spinner size={24} /> : budgetAgg.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: neutral[400], fontSize: 13 }}>
              No budget data for {selectedKey} — upload the Book11 file on the Site Budget page
            </div>
          ) : (
            <>
              {budgetAgg.map((c, i) => (
                <UtilBar
                  key={c._id}
                  pct={c.utilisation_pct || 0}
                  label={c._id}
                  sub={`${fmtNum(c.liters_used)} / ${fmtNum(c.budget_liters)} L used · ${fmtNum(c.liters_remaining)} L left`}
                />
              ))}
              <div style={{ marginTop: 10, padding: '8px 12px', background: neutral[50], borderRadius: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>TOTAL</span>
                <span>
                  <strong style={{ color: budgetUtilPct > 90 ? PRIMARY : DARK }}>{budgetUtilPct.toFixed(1)}%</strong>
                  {' · '}{fmtNum(cmsConsumed)} / {fmtNum(totalBudgetL)} L
                  {' · '}<span style={{ color: neutral[400] }}>XAF {(totalBudgetXAF/1e6).toFixed(2)}M budget</span>
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── ROW 3: Daily trend + Cluster table ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Daily trend chart */}
        <Card>
          <SectionLabel>📈 Daily Consumption Trend (L)</SectionLabel>
          {trendLoading ? <Spinner size={28} /> : trend.length === 0 ? (
            <p style={{ color: neutral[400], fontSize: 13, textAlign: 'center', padding: 20 }}>No CMS data uploaded yet for {selectedKey}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BLUE}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRef" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }}
                  tickFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, n: string) => [fmtNum(v, 0) + ' L', n]} labelFormatter={d => fmtDate(d)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="total_consumed" stroke={BLUE}  fill="url(#gCons)" name="Consumed (L)"  strokeWidth={2} />
                <Area type="monotone" dataKey="total_refuel"   stroke={GREEN} fill="url(#gRef)"  name="Refuel (L)"   strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Cluster breakdown table */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel style={{ marginBottom: 0 }}>🗂️ Cluster Breakdown</SectionLabel>
            <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/reconciliation')}>Detail →</Btn>
          </div>
          {clusterLoading || budgetLoading ? <Spinner size={28} /> : (
            <div style={{ overflowX: 'auto', maxHeight: 230, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: neutral[50] }}>
                    {['Cluster', 'Sites', 'Budget (L)', 'CMS Cons', 'Used%', 'Alerts'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 10, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedClusters.map((c: any, i: number) => {
                    const pct = c.utilisation_pct ?? (c.budget_liters > 0 ? Math.round((c.total_cms_consumed / c.budget_liters) * 100) : 0);
                    const color = pct >= 90 ? PRIMARY : pct >= 75 ? AMBER : GREEN;
                    return (
                      <tr key={c._id}
                        onClick={() => nav(`/diesel/reconciliation?cluster=${c._id}`)}
                        style={{ cursor: 'pointer', borderBottom: `1px solid ${neutral[100]}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = neutral[50])}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: CLUSTER_COLORS[i % CLUSTER_COLORS.length], marginRight: 6 }} />
                          {c._id}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{c.sites}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{fmtNum(c.budget_liters)}</td>
                        <td style={{ padding: '8px 10px' }}>{fmtNum(c.total_cms_consumed || 0)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                          <div style={{ background: neutral[200], borderRadius: 3, height: 4, width: 50, display: 'inline-block', marginLeft: 6, verticalAlign: 'middle' }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: 4, background: color, borderRadius: 3 }} />
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {c.total_alerts > 0
                            ? <span style={{ background: statusTokens.danger.bg, color: statusTokens.danger.text, borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 10 }}>{c.total_alerts}</span>
                            : <span style={{ color: GREEN, fontSize: 12 }}>✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── ROW 4: Budget bar chart (SiteBudget aggregate) ── */}
      {budgetAgg.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <SectionLabel>💰 Budget vs Approved Requests vs CMS Consumed — by Cluster</SectionLabel>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetAgg.map(c => ({
              cluster: c._id,
              'Budget (L)':   Math.round(c.budget_liters    || 0),
              'CMS Consumed': Math.round(c.budget_liters ? (c.utilisation_pct / 100) * c.budget_liters : 0),
              'Requests Used': Math.round(c.liters_used      || 0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
              <XAxis dataKey="cluster" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => fmtNum(v) + ' L'} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Budget (L)"    fill={neutral[200]} radius={[3,3,0,0]} />
              <Bar dataKey="CMS Consumed"  fill={BLUE}    radius={[3,3,0,0]} />
              <Bar dataKey="Requests Used" fill={GREEN}   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── ROW 5: Alert severity pills + alert cards ── */}
      {Object.keys(alertsBySev).length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['critical','high','medium','low'] as const).map(s =>
            alertsBySev[s] ? (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SeverityBadge severity={s} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{alertsBySev[s]}</span>
              </div>
            ) : null
          )}
          <span style={{ fontSize: 13, color: neutral[500], alignSelf: 'center' }}>open alerts</span>
        </div>
      )}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionLabel style={{ marginBottom: 0 }}>🔔 Open Alerts</SectionLabel>
          <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/alerts')}>View All →</Btn>
        </div>
        {alertLoading ? <Spinner size={28} /> : alerts.length === 0 ? (
          <p style={{ color: GREEN, textAlign: 'center', padding: 20, fontSize: 13 }}>✅ No open alerts</p>
        ) : (
          alerts.map((a: any) => (
            <AlertCard key={a._id} alert={a} compact onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
          ))
        )}
      </Card>
    </div>
  );
}
