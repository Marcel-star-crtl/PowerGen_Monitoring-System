/**
 * DieselDashboardPage.tsx
 * Main dashboard: cycle KPIs, cluster heatmap, daily trend chart, live alerts.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useCycles, useDashboard, useDailyTrend,
  useClusterHeatmap, useAlerts,
} from '../../hooks/useDiesel';
import {
  CycleSelector, KpiCard, SeverityBadge, AlertCard,
  fmtNum, fmtPct, fmtDate, Spinner, ErrorBox, PageHeader, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';
import { alertsApi, reconciliationApi } from '../../api/dieselApi';

export default function DieselDashboardPage() {
  const nav = useNavigate();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: kpiData,     loading: kpiLoading,     error: kpiError,     refetch: refetchKpis }  = useDashboard(selectedKey);
  const { data: trendData,   loading: trendLoading  } = useDailyTrend(selectedKey);
  const { data: clusterData, loading: clusterLoading } = useClusterHeatmap(selectedKey);
  const { data: alertData,   loading: alertLoading,  refetch: refetchAlerts } = useAlerts({ status: 'open', limit: 8 });
  const [running, setRunning] = useState(false);

  const kpis    = kpiData?.kpis;
  const alerts  = (alertData as any)?.data || alertData || [];
  const clusters = (clusterData as any)?.data || clusterData || [];
  const trend    = (trendData  as any)?.data || trendData  || [];

  async function runReconciliation() {
    if (!selectedKey) return;
    setRunning(true);
    try { await reconciliationApi.run(selectedKey); refetchKpis(); }
    catch (_) {}
    finally { setRunning(false); }
  }

  async function handleAcknowledge(id: string) {
    await alertsApi.acknowledge(id);
    refetchAlerts();
  }

  async function handleResolve(id: string) {
    await alertsApi.resolve(id, 'Resolved from dashboard');
    refetchAlerts();
  }

  if (cyclesLoading) return <Spinner />;

  const alertsBySev = kpiData?.alerts_by_severity || {};

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="⛽ Diesel Dashboard"
        subtitle={`Grato fuel management · ${kpis?.total_sites || 0} sites monitored`}
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

      {/* ── KPI Cards ── */}
      {kpiLoading ? <Spinner /> : kpis && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Budget (L)"          value={fmtNum(kpis.total_budget_liters)}     icon="📋" />
          <KpiCard label="CMS Consumed (L)"    value={fmtNum(kpis.total_cms_consumed)}      icon="⛽"
            sub={`${kpis.budget_utilisation_pct}% of budget`}
            color={parseFloat(kpis.budget_utilisation_pct) > 100 ? '#dc2626' : '#1a1a2e'} />
          <KpiCard label="Field Added (L)"     value={fmtNum(kpis.total_field_added)}       icon="🚛" />
          <KpiCard label="Tom Card (L)"        value={fmtNum(kpis.total_tomcard)}           icon="💳" />
          <KpiCard label="Total RH"            value={fmtNum(kpis.total_final_rh, 1)}       icon="⏱️" />
          <KpiCard label="Sites Over CCPH"     value={kpis.sites_over_ccph}  icon="📈" alert={kpis.sites_over_ccph > 0} color={kpis.sites_over_ccph > 0 ? '#dc2626' : '#1a1a2e'} />
          <KpiCard label="Low Fuel Sites"      value={kpis.sites_low_fuel}   icon="🪫" alert={kpis.sites_low_fuel > 0}  color={kpis.sites_low_fuel > 0 ? '#dc2626' : '#1a1a2e'} />
          <KpiCard label="Zero Grid Sites"     value={kpis.sites_zero_grid}  icon="⚡" alert={kpis.sites_zero_grid > 0} color={kpis.sites_zero_grid > 0 ? '#dc2626' : '#1a1a2e'} />
          <KpiCard label="Missing GRATO"       value={kpis.sites_missing_grato} icon="📋" alert={kpis.sites_missing_grato > 0} />
          <KpiCard label="Theft Suspected"     value={kpis.sites_theft_suspected} icon="🚨" alert={kpis.sites_theft_suspected > 0} color={kpis.sites_theft_suspected > 0 ? '#dc2626' : '#1a1a2e'} />
        </div>
      )}

      {/* ── Alert severity pills ── */}
      {Object.keys(alertsBySev).length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['critical','high','medium','low'] as const).map(s =>
            alertsBySev[s] ? (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SeverityBadge severity={s} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{alertsBySev[s]}</span>
              </div>
            ) : null
          )}
          <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>open alerts</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* ── Daily Trend Chart ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Daily Consumption Trend (L)</h3>
          {trendLoading ? <Spinner size={28} /> : trend.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>No CMS data uploaded yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRef" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, n: string) => [fmtNum(v, 0) + ' L', n]} labelFormatter={d => fmtDate(d)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="total_consumed" stroke="#2563eb" fill="url(#gCons)" name="Consumed (L)" strokeWidth={2} />
                <Area type="monotone" dataKey="total_refuel"   stroke="#16a34a" fill="url(#gRef)"  name="Refuel (L)"   strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Cluster Heatmap ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Cluster Overview</h3>
            <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/reconciliation')}>View All →</Btn>
          </div>
          {clusterLoading ? <Spinner size={28} /> : (
            <div style={{ overflowY: 'auto', maxHeight: 230 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Cluster','Sites','Contractual (L)','CMS Cons (L)','Alerts'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((c: any) => (
                    <tr key={c._id} onClick={() => nav(`/diesel/reconciliation?cluster=${c._id}`)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c._id}</td>
                      <td style={{ padding: '8px 10px' }}>{c.sites}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtNum(c.total_contractual)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtNum(c.total_cms_consumed)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {c.total_alerts > 0
                          ? <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>{c.total_alerts}</span>
                          : <span style={{ color: '#16a34a' }}>✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Open Alerts ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Open Alerts</h3>
          <Btn variant="ghost" size="sm" onClick={() => nav('/diesel/alerts')}>View All →</Btn>
        </div>
        {alertLoading ? <Spinner size={28} /> : alerts.length === 0 ? (
          <p style={{ color: '#16a34a', textAlign: 'center', padding: 20, fontSize: 13 }}>✅ No open alerts</p>
        ) : (
          alerts.map((a: any) => (
            <AlertCard key={a._id} alert={a} compact onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
          ))
        )}
      </div>
    </div>
  );
}
