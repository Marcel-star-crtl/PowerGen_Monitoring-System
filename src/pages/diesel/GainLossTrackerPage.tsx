/**
 * GainLossTrackerPage.tsx
 *
 * "Are we gaining or losing fuel against the client's contractual CPH,
 * right now, as this cycle's visits happen?" — a dedicated screen for that
 * question, instead of it being answered only retrospectively, per closed
 * cycle, inside History Analysis's per-site drill-down.
 *
 * Reads the LIVE gain-loss endpoints (gainLossRoutes.js → FieldVisitRecord /
 * CycleReconciliation), not the historical-archive ones History Analysis
 * uses — see that route file's docblock for why those are two different
 * data sources, not two views of the same one. `cons_status` is shown with
 * the same StatusPill Reconciliation already uses for the same field, so
 * the two screens can't visually disagree about whether a site is over or
 * under its contract this cycle.
 */
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCycles, useGainLossTracker, useGainLossDetail } from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, KpiCard, StatusPill, Tag, Card, DetailGrid,
  Spinner, ErrorBox, EmptyState, fmtNum, fmtDate,
} from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, status as statusTokens, font } from '../../styles/dieselTokens';

function fmtL(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${fmtNum(n, 1)} L`;
}
function balanceColor(n: number | null | undefined): string {
  if (n == null) return neutral[400];
  if (n < 0) return urgency.critical.fg;
  if (n > 0) return urgency.ok.fg;
  return neutral[600];
}
function shortDate(d: string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function GainLossTrackerPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const [clusterFilter, setClusterFilter] = useState('');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const { data, loading, error, refetch } = useGainLossTracker(selectedKey);
  const sites: any[] = (data as any)?.sites || [];

  const { data: detail, loading: detailLoading } = useGainLossDetail(selectedKey, selectedSite || '');

  const clusters = useMemo(() => {
    const set = new Set<string>();
    sites.forEach(s => s.cluster && set.add(s.cluster));
    return [...set].sort();
  }, [sites]);

  const filteredSites = useMemo(
    () => (clusterFilter ? sites.filter(s => s.cluster === clusterFilter) : sites),
    [sites, clusterFilter]
  );

  const fleetTotals = useMemo(() => {
    const reporting = sites.filter(s => s.running_gain_loss_l != null);
    const total = reporting.reduce((sum, s) => sum + s.running_gain_loss_l, 0);
    const gaining = reporting.filter(s => s.running_gain_loss_l > 0).length;
    const losing = reporting.filter(s => s.running_gain_loss_l < 0).length;
    return { total, gaining, losing, reporting: reporting.length };
  }, [sites]);

  if (cyclesLoading) return <Spinner />;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="⚖️ Gain/Loss Tracker"
        subtitle={`${sites.length} sites tracked this cycle · live — updates as field visits come in`}
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      <Card style={{ marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: neutral[700] }}>
          For each site, this compares what the contractual CPH says the generator should have burned since the
          cycle started against what field visits have actually measured — the same per-visit arithmetic
          Reconciliation already uses, read live instead of only at cycle close. A positive running balance means
          the site is banking margin against its contract; negative means it's running hotter than contracted,
          heading toward a variance Reconciliation will flag anyway once the cycle closes.{' '}
          <strong>Projected cycle-end</strong> extrapolates the current rate across the rest of the cycle — a
          heads-up to act on early, not a guarantee of where it lands.
        </p>
      </Card>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiCard label="Sites reporting" value={fleetTotals.reporting} sub={`of ${sites.length} tracked`} />
        <KpiCard label="Gaining" value={fleetTotals.gaining} color={urgency.ok.fg} />
        <KpiCard
          label="Losing"
          value={fleetTotals.losing}
          color={urgency.critical.fg}
          alert={fleetTotals.losing > 0 && fleetTotals.losing >= fleetTotals.gaining}
        />
        <KpiCard label="Fleet net" value={fmtL(fleetTotals.total)} color={balanceColor(fleetTotals.total)} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <select
          value={clusterFilter}
          onChange={e => setClusterFilter(e.target.value)}
          aria-label="Filter by cluster"
          style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
        >
          <option value="">All Clusters</option>
          {clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <ErrorBox message={error} onRetry={refetch} />}

      <div style={{ background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Spinner /> : filteredSites.length === 0 ? (
          <EmptyState icon="⚖️" title="No sites to show" desc="No reconciliation data yet for this cycle." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 1180 }}>
              <thead>
                <tr style={{ background: neutral[50] }}>
                  {['Site', 'Cluster', 'Generator', 'KVA', 'Contractual CPH', 'True CPH', 'Running Gain/Loss', 'Projected', 'Visits', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 11, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSites.map(s => (
                  <tr
                    key={s.site_id}
                    onClick={() => setSelectedSite(s.site_id)}
                    style={{ cursor: 'pointer', borderBottom: `1px solid ${neutral[100]}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = neutral[50])}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{s.site_id}</p>
                      <p style={{ margin: 0, color: neutral[400], fontSize: 11 }}>{s.site_name}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.cluster || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.generator_brand || '—'}
                      {s.had_generator_swap && (
                        <span style={{ marginLeft: 6 }}><Tag variant="info" dot>swapped</Tag></span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.dg_kva ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.contractual_cph, 2)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmtNum(s.avg_true_cph_this_cycle, 2)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: balanceColor(s.running_gain_loss_l) }}>
                      {fmtL(s.running_gain_loss_l)}
                    </td>
                    <td style={{ padding: '10px 14px', color: balanceColor(s.projected_cycle_end_gain_loss_l) }}>
                      {s.projected_cycle_end_gain_loss_l != null ? fmtL(s.projected_cycle_end_gain_loss_l) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.visits_count}</td>
                    <td style={{ padding: '10px 14px' }}><StatusPill status={s.cons_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSite && (
        <GainLossDetailDrawer
          siteId={selectedSite}
          detail={detail as any}
          loading={detailLoading}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  );
}

// ─── Detail drawer ──────────────────────────────────────────────────────────
function GainLossDetailDrawer({
  siteId, detail, loading, onClose,
}: { siteId: string; detail: any; loading: boolean; onClose: () => void }) {
  const chartData = useMemo(() => {
    if (!detail?.visits) return [];
    return detail.visits
      .filter((v: any) => v.running_balance_l != null)
      .map((v: any) => ({ date: shortDate(v.visit_date), balance: v.running_balance_l }));
  }, [detail]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 560, background: '#fff', zIndex: 201, overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral[200]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: ink, color: '#fff' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{detail?.cluster || ''} · {detail?.cycle_key || ''}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700 }}>{detail?.site_name || siteId}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{siteId}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>✕ Close</button>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {loading ? <Spinner /> : !detail ? (
            <EmptyState icon="⚖️" title="No data" desc="Nothing to show for this site this cycle." />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <KpiCard label="Contractual CPH" value={fmtNum(detail.contractual_cph, 2)} />
                <KpiCard label="True CPH this cycle" value={fmtNum(detail.avg_true_cph_this_cycle, 2)} />
                <KpiCard label="Running balance" value={fmtL(detail.running_gain_loss_l)} color={balanceColor(detail.running_gain_loss_l)} />
                <KpiCard
                  label="Projected cycle-end"
                  value={detail.projected_cycle_end_gain_loss_l != null ? fmtL(detail.projected_cycle_end_gain_loss_l) : '—'}
                  color={balanceColor(detail.projected_cycle_end_gain_loss_l)}
                  sub={detail.projected_cycle_end_gain_loss_l == null ? 'Not enough of the cycle elapsed yet' : undefined}
                />
              </div>

              <DetailGrid
                rows={[
                  ['Generator', `${detail.generator_brand || '—'}${detail.generator_id ? ` (${detail.generator_id})` : ''}`],
                  ['KVA', detail.dg_kva ?? '—'],
                  ['Visits this cycle', detail.visits?.length ?? 0],
                  ['Status', <StatusPill status={detail.cons_status} />],
                ]}
              />

              {detail.had_generator_swap && detail.swap_segments?.length > 0 && (
                <div style={{ marginTop: 16, background: urgency.high.bg, border: `1px solid ${statusTokens.warning.border}`, borderRadius: 8, padding: 12 }}>
                  <p style={{ fontWeight: 600, fontSize: 12, margin: '0 0 8px', color: statusTokens.warning.text }}>⚠️ Mid-Cycle Generator Swap Detected</p>
                  {/* Deliberately a shade darker than statusTokens.warning.text — this
                      body copy needs to read as secondary to the heading above it. */}
                  {detail.swap_segments.map((seg: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 4 }}>
                      Gen {seg.generator_id}: {fmtNum(seg.rh_in_segment, 1)} RH × {fmtNum(seg.ccph, 3)} CCPH = {fmtNum(seg.consumption_in_segment)} L
                      <span style={{ color: neutral[400], marginLeft: 4 }}>({fmtDate(seg.from_date)} → {fmtDate(seg.to_date)})</span>
                    </div>
                  ))}
                </div>
              )}

              {chartData.length >= 2 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: neutral[500], margin: '0 0 8px' }}>Running balance, by visit (0 = exactly on contract)</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke={neutral[300]} strokeDasharray="4 4" />
                      <Tooltip formatter={(v: any) => [`${v} L`, 'Running balance']} />
                      <Line type="monotone" dataKey="balance" stroke={ink} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: neutral[500], margin: '0 0 8px' }}>Visit-by-visit ledger</p>
                {!detail.visits?.length ? (
                  <p style={{ fontSize: 12, color: neutral[400] }}>No field visits recorded this cycle yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Date', 'Generator', 'KVA', 'CCPH', 'True CPH', 'Contractual (L)', 'Actual (L)', 'Gain/Loss (L)', 'Balance (L)'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 10.5, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.visits.map((v: any, i: number) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '6px 8px' }}>{shortDate(v.visit_date)}</td>
                            <td style={{ padding: '6px 8px' }}>{v.generator_id || '—'}</td>
                            <td style={{ padding: '6px 8px' }}>{v.dg_kva ?? '—'}</td>
                            <td style={{ padding: '6px 8px' }}>{fmtNum(v.ccph, 3)}</td>
                            <td style={{ padding: '6px 8px' }}>{v.true_cph != null ? fmtNum(v.true_cph, 2) : '—'}</td>
                            <td style={{ padding: '6px 8px' }}>{fmtNum(v.contractual_l, 1)}</td>
                            <td style={{ padding: '6px 8px' }}>{fmtNum(v.actual_l, 1)}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 600, color: balanceColor(v.visit_gain_loss_l) }}>{fmtL(v.visit_gain_loss_l)}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 600, color: balanceColor(v.running_balance_l) }}>{fmtL(v.running_balance_l)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
