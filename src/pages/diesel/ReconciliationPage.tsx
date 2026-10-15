/**
 * ReconciliationPage.tsx
 * Master table: all sites, cycle KPIs, colour-coded variances, drill-down detail.
 */
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCycles, useReconciliation } from '../../hooks/useDiesel';
import { reconciliationApi, reportsApi } from '../../api/dieselApi';
import {
  PageHeader, CycleSelector, SiteDetailDrawer, VarianceCell,
  Card, Tag,
  fmtNum, fmtPct, Spinner, ErrorBox, EmptyState, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency as urgencyTokens, status as statusTokens, font } from '../../styles/dieselTokens';
import type { CycleReconciliation } from '../../types/diesel.types';

// Topology → pill variant + label, matching the prototype's pill-neutral
// "Gen Only" / pill-info "Grid Gen" treatment (real values come straight
// off CycleReconciliation.topology; shown as-is if it's something this
// map hasn't seen before, rather than hiding an unexpected value).
const TOPOLOGY_VARIANT: Record<string, 'neutral' | 'info'> = {
  'Gen Only':         'neutral',
  'Solar Gen':        'neutral',
  'Grid Gen':         'info',
  'Grid Hybrid Gen':  'info',
};

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
  const { user } = useAuthContext();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const [clusterFilter, setClusterFilter] = useState(params.get('cluster') || '');
  const [alertFilter,   setAlertFilter]   = useState('');
  const [search,        setSearch]        = useState('');
  const [selected,      setSelected]      = useState<CycleReconciliation | null>(null);
  const [running,       setRunning]       = useState(false);

  // Matches the backend's own guard (requireRole(['admin'])) on
  // PATCH /:cycle_key/site/:site_id/override — only show the review form to
  // someone who can actually use it.
  const canReview = user?.role === 'admin';

  async function handleSaveReview(notes: string) {
    if (!selected) return;
    const res = await reconciliationApi.override(selected.cycle_key, selected.site_id, notes);
    const updated = (res as any)?.data || res;
    // Update the open drawer immediately and patch the row in the table data
    // so the "reviewed" state is visible without a full page refetch.
    setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
    refetch();
  }

  const queryParams = useMemo(() => ({
    cluster: clusterFilter || undefined,
    alert_type: alertFilter || undefined,
    limit: 300,
  }), [clusterFilter, alertFilter]);

  const { data, loading, error, refetch } = useReconciliation(selectedKey, queryParams);
  const allSites = (data as any)?.data || data || [];
  const summary  = (data as any)?.summary || {};

  // Client-side search over the already-fetched page (the prototype's
  // "Search site or cluster…" box) — no new backend query param needed,
  // the same 300-row batch the alert/cluster filters already pull.
  const sites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSites;
    return allSites.filter((s: CycleReconciliation) =>
      s.site_id?.toLowerCase().includes(q) ||
      s.site_name?.toLowerCase().includes(q) ||
      s.cluster?.toLowerCase().includes(q)
    );
  }, [allSites, search]);

  // Auto-open the detail drawer for a site linked in via ?site_id= (used by
  // the Live Site Map's "View Reconciliation" quick action) — only once,
  // the first time that site's record becomes available, so it doesn't
  // fight the user if they close the drawer and click elsewhere afterward.
  const siteIdParam = params.get('site_id');
  const [autoOpenedFor, setAutoOpenedFor] = useState<string | null>(null);
  React.useEffect(() => {
    if (!siteIdParam || autoOpenedFor === siteIdParam || allSites.length === 0) return;
    const match = allSites.find((s: CycleReconciliation) => s.site_id === siteIdParam);
    if (match) {
      setSelected(match);
      setAutoOpenedFor(siteIdParam);
    }
  }, [siteIdParam, allSites, autoOpenedFor]);

  const clusters = useMemo(() => {
    const set = new Set<string>();
    allSites.forEach((s: CycleReconciliation) => s.cluster && set.add(s.cluster));
    return [...set].sort();
  }, [allSites]);

  async function handleRun() {
    setRunning(true);
    try { await reconciliationApi.run(selectedKey); refetch(); } finally { setRunning(false); }
  }

  if (cyclesLoading) return <Spinner />;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto', fontFamily: font.ui }}>
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
          ['Sites', summary.total_sites, undefined],
          ['Budget (L)', fmtNum(summary.total_budget), undefined],
          ['Contractual (L)', fmtNum(summary.total_contractual), undefined],
          ['CMS Consumed (L)', fmtNum(summary.total_cms_consumed), undefined],
          ['Over CCPH', summary.sites_over_ccph, (summary.sites_over_ccph || 0) > 0 ? 'warn' : undefined],
          ['Low Fuel', summary.sites_low_fuel, (summary.sites_low_fuel || 0) > 0 ? 'crit' : undefined],
          ['Theft', summary.sites_theft, (summary.sites_theft || 0) > 0 ? 'crit' : undefined],
        ].map(([label, val, tone]) => {
          const toneStyle = tone === 'warn' ? urgencyTokens.high : tone === 'crit' ? urgencyTokens.critical : null;
          return (
            <div key={label as string} style={{
              background: toneStyle?.bg || '#fff',
              border: `1px solid ${toneStyle?.fg || neutral[200]}`,
              borderRadius: 8, padding: '8px 16px', fontSize: 12,
            }}>
              <span style={{ color: toneStyle?.fg || neutral[500] }}>{label as string}: </span>
              <strong style={{ color: toneStyle?.fg || ink, fontVariantNumeric: 'tabular-nums' }}>{(val as any) ?? 0}</strong>
            </div>
          );
        })}
      </div>

      {/* ── Filters — search + cluster + alert-type, matching the
          prototype's filter-bar row. Search is client-side over the
          already-fetched cycle batch; cluster/alert type still round-trip
          to the API since they change which rows are fetched at all. ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search site or cluster…"
          aria-label="Search site or cluster"
          style={{ flex: '1 1 220px', minWidth: 160, border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, boxSizing: 'border-box' }}
        />
        <select value={clusterFilter} onChange={e => setClusterFilter(e.target.value)}
          aria-label="Filter by cluster"
          style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
          <option value="">All Clusters</option>
          {clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALERT_FILTERS.map(f => (
            <button key={f.key} onClick={() => setAlertFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: alertFilter === f.key ? `1px solid ${ink}` : `1px solid ${neutral[200]}`,
                background: alertFilter === f.key ? ink : '#fff',
                color: alertFilter === f.key ? '#fff' : neutral[700],
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={refetch} />}

      <Card padded={false} style={{ overflow: 'hidden' }}>
        {loading ? <Spinner /> : sites.length === 0 ? (
          <EmptyState icon="📭" title="No reconciliation data" desc={
            allSites.length > 0
              ? 'No sites match this search or filter combination.'
              : 'Upload CMS, GRATO, and budget data, then re-run reconciliation.'
          } />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 1180 }}>
              <thead>
                <tr style={{ background: neutral[50] }}>
                  {['Site', 'Cluster', 'Topology', 'CCPH', 'Final RH', 'Contractual (L)', 'CMS Cons (L)', 'Variance', 'Fuel Added (L)', 'Grid Avail', 'Status', 'Alerts'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 11, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map((s: CycleReconciliation) => (
                  <tr key={s._id} onClick={() => setSelected(s)}
                    style={{ cursor: 'pointer', borderBottom: `1px solid ${neutral[100]}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = neutral[50])}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {s.site_id}
                        {s.is_manually_reviewed && (
                          <span title="Manually reviewed" style={{ marginLeft: 6, color: urgencyTokens.ok.fg, fontSize: 11 }}>✓ reviewed</span>
                        )}
                      </p>
                      <p style={{ margin: 0, color: neutral[400], fontSize: 11 }}>{s.site_name}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.cluster}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.topology
                        ? <Tag variant={TOPOLOGY_VARIANT[s.topology] || 'neutral'}>{s.topology}</Tag>
                        : <span style={{ color: neutral[400] }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.ccph, 3)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.final_rh, 1)}{s.faulty_meter_days > 0 && <span title="Faulty meter — CMS fallback used"> 🔧</span>}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.contractual_consumption)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.cms_consumption)}</td>
                    <td style={{ padding: '10px 14px' }}><VarianceCell value={s.cons_variance} pct={s.cons_variance_pct} /></td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.field_fuel_added)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{s.grid_avail_actual != null ? fmtPct(s.grid_avail_actual) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}><StatusPill status={s.cons_status} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.alert_count > 0
                        ? <span style={{ background: statusTokens.danger.bg, color: statusTokens.danger.text, borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: 11 }}>{s.alert_count}</span>
                        : <span style={{ color: urgencyTokens.ok.fg }}>✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SiteDetailDrawer
        recon={selected}
        onClose={() => setSelected(null)}
        canReview={canReview}
        onSaveReview={handleSaveReview}
      />
    </div>
  );
}
