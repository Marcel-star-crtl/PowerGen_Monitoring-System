/**
 * FuelPlanningPage.tsx
 * Intelligent fuel planning dashboard — shows predicted days-to-empty per site,
 * generates refueling schedules, and allows auto-raising fuel requests for
 * critical sites. Powered by CMS gen_rh × CCPH, field data, and Gemini AI.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useCycles } from '@/hooks/useDiesel';
import { CycleSelector, Spinner, Btn, fmtNum, fmtDate, ErrorBox } from '@/components/diesel/DieselComponents';
import apiClient from '@/api/client';

const URGENCY_COLOR: Record<string, string> = {
  critical: '#dc2626', high: '#d97706', medium: '#2563eb', ok: '#16a34a', unknown: '#9ca3af',
};
const URGENCY_BG: Record<string, string> = {
  critical: '#fef2f2', high: '#fffbeb', medium: '#eff6ff', ok: '#f0fdf4', unknown: '#f9fafb',
};
const RATE_SOURCE_LABEL: Record<string, string> = {
  cms_ccph:      'CMS RH × CCPH',
  field_data:    'Field Data',
  budget_rh_ccph:'Budget RH × CCPH',
  budget_planned:'Budget Planned',
  none:          'No Data',
};

function UrgencyPill({ urgency }: { urgency: string }) {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
      color: URGENCY_COLOR[urgency] || '#6b7280',
      background: URGENCY_BG[urgency] || '#f9fafb',
      border: `1px solid ${URGENCY_COLOR[urgency] || '#e5e7eb'}`,
    }}>
      {urgency.toUpperCase()}
    </span>
  );
}

function DaysBar({ days, max = 14 }: { days: number | null; max?: number }) {
  if (days === null) return <span style={{ color: '#9ca3af', fontSize: 12 }}>Unknown</span>;
  const pct  = Math.min(100, (days / max) * 100);
  const color = days <= 2 ? '#dc2626' : days <= 5 ? '#d97706' : days <= 10 ? '#2563eb' : '#16a34a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 40 }}>{days.toFixed(1)}d</span>
    </div>
  );
}

export default function FuelPlanningPage() {
  const nav = useNavigate();
  const { cycles, selectedKey: cycleKey, setSelectedKey } = useCycles();

  const [plan,          setPlan]          = useState<any>(null);
  const [schedule,      setSchedule]      = useState<any>(null);
  const [summary,       setSummary]       = useState<any>(null);
  const [loading,       setLoading]       = useState(false);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [autoLoading,   setAutoLoading]   = useState(false);
  const [autoResult,    setAutoResult]    = useState<any>(null);
  const [tab,           setTab]           = useState<'overview'|'schedule'|'table'>('overview');
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>(['critical','high','medium']);
  const [clusterFilter, setClusterFilter] = useState('');
  const [searchQ,       setSearchQ]       = useState('');
  const [detailSite,    setDetailSite]    = useState<any>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const load = useCallback(async () => {
    if (!cycleKey) return;
    setLoading(true);
    setLoadError(null);
    setAutoResult(null);
    try {
      const [planRes, sumRes] = await Promise.all([
        apiClient.get(`/fuel-planning/predict/${cycleKey}`, {
          params: { urgency: urgencyFilter.join(','), limit: 300 },
        }),
        apiClient.get(`/fuel-planning/summary/${cycleKey}`),
      ]);
      setPlan(planRes.data?.data || null);
      setSummary(sumRes.data?.data || null);
    } catch (e: any) {
      setLoadError(e?.response?.data?.error || e?.message || 'Failed to load fuel planning data.');
    }
    finally { setLoading(false); }
  }, [cycleKey, urgencyFilter]);

  const loadSchedule = useCallback(async () => {
    if (!cycleKey) return;
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const r = await apiClient.get(`/fuel-planning/schedule/${cycleKey}`);
      setSchedule(r.data?.data || null);
    } catch (e: any) {
      setScheduleError(e?.response?.data?.error || e?.message || 'Failed to load the refueling schedule.');
    }
    finally { setScheduleLoading(false); }
  }, [cycleKey]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'schedule') loadSchedule(); }, [tab, loadSchedule]);

  const handleAutoRequest = async () => {
    if (!window.confirm(`Auto-create fuel requests for all CRITICAL sites in ${cycleKey}? This will raise requests through the approval chain.`)) return;
    setAutoLoading(true);
    try {
      const r = await apiClient.post(`/fuel-planning/auto-request/${cycleKey}`);
      setAutoResult(r.data);
      load();
    } catch (e: any) { alert(e?.response?.data?.error || 'Failed'); }
    finally { setAutoLoading(false); }
  };

  const loadGeminiForSite = async (site: any) => {
    setDetailSite(site);
    setGeminiLoading(true);
    try {
      const r = await apiClient.get(`/fuel-planning/predict/${cycleKey}/site/${site.site_id}`, {
        params: { gemini: 1 },
      });
      setDetailSite(r.data?.data);
    } catch { /* no-op */ }
    finally { setGeminiLoading(false); }
  };

  const sites = (plan?.sites || [])
    .filter((s: any) => !clusterFilter || s.cluster === clusterFilter)
    .filter((s: any) => !searchQ || s.site_name?.toLowerCase().includes(searchQ.toLowerCase()) || s.site_id?.toLowerCase().includes(searchQ.toLowerCase()));

  const clusters = [...new Set((plan?.sites || []).map((s: any) => s.cluster).filter(Boolean))] as string[];

  const chartData = clusters.map(c => {
    const clusterSites = (plan?.sites || []).filter((s: any) => s.cluster === c);
    return {
      cluster:  c,
      critical: clusterSites.filter((s: any) => s.urgency === 'critical').length,
      high:     clusterSites.filter((s: any) => s.urgency === 'high').length,
      medium:   clusterSites.filter((s: any) => s.urgency === 'medium').length,
      ok:       clusterSites.filter((s: any) => s.urgency === 'ok').length,
    };
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🔮 Fuel Planning Engine</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Predicts refueling needs using CMS gen_rh × CCPH, field submissions, and Gemini AI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <CycleSelector cycles={cycles} value={cycleKey} onChange={setSelectedKey} />
          <Btn variant="secondary" size="sm" onClick={load} disabled={loading}>🔄 Refresh</Btn>
          <Btn size="sm" onClick={handleAutoRequest} disabled={!plan} loading={autoLoading}
            style={{ background: '#dc2626', color: '#fff', border: 'none' }}>
            ⚡ Auto-Request Critical
          </Btn>
        </div>
      </div>

      {/* ── Auto-request result banner ── */}
      {autoResult && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          ✅ {autoResult.message}
          {autoResult.data?.created?.length > 0 && (
            <span style={{ marginLeft: 12, color: '#6b7280' }}>
              Created for: {autoResult.data.created.map((c: any) => c.site_name || c.site_id).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* ── Summary KPI strip ── */}
      {summary && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Critical (≤2 days)',  value: summary.critical,  color: '#dc2626' },
            { label: 'High (≤5 days)',      value: summary.high,      color: '#d97706' },
            { label: 'Medium (≤10 days)',   value: summary.medium,    color: '#2563eb' },
            { label: 'OK (>10 days)',       value: summary.ok,        color: '#16a34a' },
            { label: 'Using CMS data',      value: summary.sites_using_cms,    color: '#7c3aed' },
            { label: 'Using Field data',    value: summary.sites_using_field,  color: '#0891b2' },
            { label: 'No data available',   value: summary.sites_without_data, color: '#9ca3af' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: `1px solid #e5e7eb`, borderTop: `3px solid ${s.color}`,
              borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 120, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20 }}>
        {(['overview','schedule','table'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            borderBottom: tab === t ? '3px solid #e53935' : '3px solid transparent',
            color: tab === t ? '#e53935' : '#6b7280',
          }}>
            {t === 'overview' ? '📊 Cluster Overview' : t === 'schedule' ? '📅 Refueling Schedule' : '📋 All Sites'}
          </button>
        ))}
      </div>

      {/* ── Urgency filter pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Filter:</span>
        {(['critical','high','medium','ok'] as const).map(u => (
          <button key={u} onClick={() => setUrgencyFilter(prev =>
            prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
          )} style={{
            padding: '4px 12px', borderRadius: 16, border: `1px solid ${URGENCY_COLOR[u]}`,
            background: urgencyFilter.includes(u) ? URGENCY_COLOR[u] : '#fff',
            color: urgencyFilter.includes(u) ? '#fff' : URGENCY_COLOR[u],
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{u.toUpperCase()}</button>
        ))}
        <select value={clusterFilter} onChange={e => setClusterFilter(e.target.value)}
          aria-label="Filter by cluster"
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <option value="">All Clusters</option>
          {clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {tab === 'table' && (
          <input placeholder="Search site..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            aria-label="Search site"
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #e5e7eb', width: 180 }} />
        )}
      </div>

      {loading ? <Spinner /> : loadError ? (
        <ErrorBox message={loadError} onRetry={load} />
      ) : (
        <>
          {/* ── Overview tab: cluster bar chart ── */}
          {tab === 'overview' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Sites by Urgency per Cluster</h3>
              {chartData.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>
                  No prediction data — ensure CMS records or field data exists for {cycleKey}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="cluster" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="critical" name="Critical (≤2d)" fill="#dc2626" radius={[3,3,0,0]} stackId="a" />
                    <Bar dataKey="high"     name="High (≤5d)"    fill="#d97706" radius={[3,3,0,0]} stackId="a" />
                    <Bar dataKey="medium"   name="Medium (≤10d)" fill="#2563eb" radius={[3,3,0,0]} stackId="a" />
                    <Bar dataKey="ok"       name="OK (>10d)"     fill="#16a34a" radius={[3,3,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Critical sites cards */}
              {plan?.sites?.filter((s: any) => s.urgency === 'critical').slice(0, 8).map((s: any) => (
                <div key={s.site_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', marginTop: 10, borderRadius: 8,
                  background: '#fff5f5', border: '1px solid #fca5a5',
                }}>
                  <span style={{ fontSize: 20 }}>🚨</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.site_name || s.site_id}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {s.cluster} · {s.current_level_l ?? '?'}L ({s.fuel_pct ?? '?'}%) ·
                      {s.days_to_empty !== null ? ` ${s.days_to_empty} days to empty` : ' unknown'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                    {s.pending_request ? (
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>Request {s.pending_request.status.replace('pending_','L').replace('_','')}</span>
                    ) : (
                      <Btn size="sm" onClick={() => nav('/diesel/scheduled?auto_site=' + s.site_id)}>Schedule →</Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Schedule tab ── */}
          {tab === 'schedule' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
              {scheduleLoading ? <Spinner size={28} /> : scheduleError ? (
                <ErrorBox message={scheduleError} onRetry={loadSchedule} />
              ) : !schedule ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>No schedule data yet.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                      Prioritised Refueling Schedule — {schedule.total_sites} sites needing attention
                    </h3>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      🚨 {schedule.critical_count} critical · ⚠️ {schedule.high_count} high · 🔵 {schedule.medium_count} medium
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['#','Site','Cluster','Urgency','Fuel Level','Days Left','Suggested Refuel','Consumption/Day','Data Source','Action'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.schedule
                          .filter((s: any) => !clusterFilter || s.cluster === clusterFilter)
                          .map((s: any) => (
                          <tr key={s.site_id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#6b7280' }}>{s.rank}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 700 }}>{s.site_name || s.site_id}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.site_id}</div>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#374151' }}>{s.cluster}</td>
                            <td style={{ padding: '8px 10px' }}><UrgencyPill urgency={s.urgency} /></td>
                            <td style={{ padding: '8px 10px' }}>
                              <div>{s.current_level_l ?? '?'} L</div>
                              <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.fuel_pct ?? '?'}% of tank</div>
                            </td>
                            <td style={{ padding: '8px 10px', minWidth: 120 }}>
                              <DaysBar days={s.days_to_empty} />
                            </td>
                            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                              {s.suggested_refuel_date
                                ? <span style={{ fontWeight: 600, color: s.urgency === 'critical' ? '#dc2626' : '#374151' }}>
                                    {new Date(s.suggested_refuel_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                                  </span>
                                : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {s.consumption_per_day_l ? `${s.consumption_per_day_l.toFixed(1)} L/d` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', borderRadius: 4 }}>
                                {RATE_SOURCE_LABEL[s.rate_source] || s.rate_source}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {s.has_pending_request ? (
                                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                                  {s.action_required.replace(/_/g,' ')}
                                </span>
                              ) : (
                                <Btn size="sm" variant="primary"
                                  onClick={() => nav('/diesel/scheduled?auto_site=' + s.site_id)}>
                                  Schedule
                                </Btn>
                              )}
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

          {/* ── All sites table tab ── */}
          {tab === 'table' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
                All Sites — {sites.length} results
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
                    <tr>
                      {['Site','Cluster','Urgency','Current Level','Days to Empty','Suggested Refuel','L/day','Budget Left','Source','Gemini'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((s: any) => (
                      <tr key={s.site_id} style={{ borderBottom: '0.5px solid #f3f4f6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700 }}>{s.site_name || s.site_id}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.site_id}</div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{s.cluster}</td>
                        <td style={{ padding: '8px 10px' }}><UrgencyPill urgency={s.urgency} /></td>
                        <td style={{ padding: '8px 10px' }}>
                          <div>{s.current_level_l ?? '?'} L</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.fuel_pct ?? '?'}%</div>
                        </td>
                        <td style={{ padding: '8px 10px', minWidth: 130 }}>
                          <DaysBar days={s.days_to_empty} />
                        </td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', fontWeight: 600,
                          color: s.urgency === 'critical' ? '#dc2626' : '#374151' }}>
                          {s.suggested_refuel_date
                            ? new Date(s.suggested_refuel_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {s.consumption_per_day_l ? `${s.consumption_per_day_l.toFixed(1)}` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {s.liters_remaining != null ? `${Math.round(s.liters_remaining)} L` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', borderRadius: 4 }}>
                            {RATE_SOURCE_LABEL[s.rate_source] || s.rate_source}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <button onClick={() => loadGeminiForSite(s)}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff' }}>
                            ✨ Ask AI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Gemini detail modal ── */}
      {detailSite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDetailSite(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{detailSite.site_name || detailSite.site_id}</h3>
              <button onClick={() => setDetailSite(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['Urgency',         <UrgencyPill urgency={detailSite.urgency} />],
                ['Current Level',   `${detailSite.current_level_l ?? '?'} L (${detailSite.fuel_pct ?? '?'}%)`],
                ['Days to Empty',   detailSite.days_to_empty !== null ? `${detailSite.days_to_empty} days` : 'Unknown'],
                ['Suggested Refuel',detailSite.suggested_refuel_date ? new Date(detailSite.suggested_refuel_date).toDateString() : '—'],
                ['Consumption/Day', detailSite.consumption_per_day_l ? `${detailSite.consumption_per_day_l.toFixed(2)} L/day` : '—'],
                ['Data Source',     RATE_SOURCE_LABEL[detailSite.rate_source] || detailSite.rate_source],
                ['Budget Remaining',detailSite.liters_remaining != null ? `${Math.round(detailSite.liters_remaining)} L` : '—'],
                ['CMS Days Used',   `${detailSite.cms_days_used || 0} days`],
              ].map(([label, value]) => (
                <div key={label as string} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px', marginBottom: 12, fontSize: 12 }}>
              <strong>✨ Gemini AI Recommendation</strong>
              {geminiLoading ? (
                <div style={{ marginTop: 8 }}><Spinner size={20} /></div>
              ) : detailSite.gemini_recommendation ? (
                <p style={{ margin: '8px 0 0', lineHeight: 1.6, color: '#374151' }}>{detailSite.gemini_recommendation}</p>
              ) : (
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontStyle: 'italic' }}>
                  No Gemini recommendation — set GEMINI_API_KEY in .env to enable AI analysis
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
