/**
 * ReconciliationPage.tsx
 * Master table: all sites, cycle KPIs, colour-coded variances, drill-down detail.
 */
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCycles, useReconciliation } from '../../hooks/useDiesel';
import { reconciliationApi, reportsApi } from '../../api/dieselApi';
import {
  PageHeader, CycleSelector, SiteDetailDrawer, VarianceCell,
  fmtNum, fmtPct, Spinner, ErrorBox, EmptyState, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';
import type { CycleReconciliation } from '../../types/diesel.types';

const ALERT_FILTERS = [
  { key: '',                       label: 'All Sites' },
  { key: 'consumption_over_ccph',  label: 'Over CCPH' },
  { key: 'low_fuel',               label: 'Low Fuel' },
  { key: 'zero_grid_24h',          label: 'Zero Grid' },
  { key: 'refuel_mismatch',        label: 'Refuel Mismatch' },
  { key: 'missing_grato',          label: 'Missing GRATO' },
  { key: 'missing_cms',            label: 'Missing CMS' },
  { key: 'theft_suspected',        label: 'Theft Suspected' },
  { key: 'faulty_meter',           label: 'Faulty Meter' },
];

export default function ReconciliationPage() {
  const [params] = useSearchParams();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const [clusterFilter, setClusterFilter] = useState(params.get('cluster') || '');
  const [alertFilter,   setAlertFilter]   = useState('');
  const [selected,      setSelected]      = useState<CycleReconciliation | null>(null);
  const [running,       setRunning]       = useState(false);

  const queryParams = useMemo(() => ({
    cluster: clusterFilter || undefined,
    alert_type: alertFilter || undefined,
    limit: 300,
  }), [clusterFilter, alertFilter]);

  const { data, loading, error, refetch } = useReconciliation(selectedKey, queryParams);
  const sites   = (data as any)?.data || data || [];
  const summary = (data as any)?.summary || {};

  const clusters = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s: CycleReconciliation) => s.cluster && set.add(s.cluster));
    return [...set].sort();
  }, [sites]);

  async function handleRun() {
    setRunning(true);
    try { await reconciliationApi.run(selectedKey); refetch(); } finally { setRunning(false); }
  }

  if (cyclesLoading) return <Spinner />;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto' }}>
      <PageHeader
        title="🔍 Reconciliation"
        subtitle={`${sites.length} sites · ${summary.total_alerts || 0} total open alert flags`}
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            <Btn variant="secondary" size="sm" onClick={handleRun} disabled={running}>{running ? '⏳ Running…' : '🔄 Re-run'}</Btn>
            {/* <a href={reportsApi.downloadCycle(selectedKey)} target="_blank" rel="noreferrer">
              <Btn size="sm">⬇️ Export Excel</Btn>
            </a> */}
            <Btn
              size="sm"
              onClick={async () => {
                try {
                  await reportsApi.downloadFile(
                    reportsApi.cyclePath(selectedKey),
                    `reconciliation-${selectedKey}.xlsx`
                  );
                } catch (err) {
                  console.error(err);
                  // optionally surface a toast/error state here
                }
              }}
            >
              ⬇️ Export Excel
            </Btn>
          </>
        }
      />

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          ['Sites', summary.total_sites],
          ['Budget (L)', fmtNum(summary.total_budget)],
          ['Contractual (L)', fmtNum(summary.total_contractual)],
          ['CMS Consumed (L)', fmtNum(summary.total_cms_consumed)],
          ['Over CCPH', summary.sites_over_ccph],
          ['Low Fuel', summary.sites_low_fuel],
          ['Theft', summary.sites_theft],
        ].map(([label, val]) => (
          <div key={label as string} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 12 }}>
            <span style={{ color: '#6b7280' }}>{label}: </span><strong>{val ?? 0}</strong>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={clusterFilter} onChange={e => setClusterFilter(e.target.value)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
          <option value="">All Clusters</option>
          {clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALERT_FILTERS.map(f => (
            <button key={f.key} onClick={() => setAlertFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: alertFilter === f.key ? '1px solid #1a1a2e' : '1px solid #e5e7eb',
                background: alertFilter === f.key ? '#1a1a2e' : '#fff',
                color: alertFilter === f.key ? '#fff' : '#374151',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={refetch} />}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Spinner /> : sites.length === 0 ? (
          <EmptyState icon="📭" title="No reconciliation data" desc="Upload CMS, GRATO, and budget data, then re-run reconciliation." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 1100 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Site', 'Cluster', 'CCPH', 'Final RH', 'Contractual (L)', 'CMS Cons (L)', 'Variance', 'Fuel Added (L)', 'Grid Avail', 'Status', 'Alerts'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map((s: CycleReconciliation) => (
                  <tr key={s._id} onClick={() => setSelected(s)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{s.site_id}</p>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>{s.site_name}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.cluster}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.ccph, 3)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.final_rh, 1)}{s.faulty_meter_days > 0 && <span title="Faulty meter — CMS fallback used"> 🔧</span>}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.contractual_consumption)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.cms_consumption)}</td>
                    <td style={{ padding: '10px 14px' }}><VarianceCell value={s.cons_variance} pct={s.cons_variance_pct} /></td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.field_fuel_added)}</td>
                    <td style={{ padding: '10px 14px' }}>{s.grid_avail_actual != null ? fmtPct(s.grid_avail_actual) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}><StatusPill status={s.cons_status} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.alert_count > 0
                        ? <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: 11 }}>{s.alert_count}</span>
                        : <span style={{ color: '#16a34a' }}>✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SiteDetailDrawer recon={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
