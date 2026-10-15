/**
 * SiteStockPage.tsx
 *
 * Live site and cluster fuel stock — genuinely distinct from
 * HistoricalDataPage.tsx, which serves the recovered email archive.
 * This reads the same live Fuel_Quantity_Found field every other
 * diesel view (Live Site Map, Fuel Planning, Refuel workflow) already
 * uses, and adds a real capability that didn't exist anywhere in the
 * system before: capturing what stock looked like at a specific point
 * in time — either automatically when a cycle closes, or on demand
 * right now.
 */
import React, { useEffect, useState } from 'react';
import { stockApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn, KpiCard, Card, SectionLabel } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, font } from '../../styles/dieselTokens';

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function freshnessColor(hours: number | null) {
  if (hours == null) return neutral[400];
  if (hours <= 48) return urgency.ok.fg;
  if (hours <= 24 * 7) return urgency.high.fg;
  return urgency.critical.fg;
}

function freshnessLabel(hours: number | null) {
  if (hours == null) return 'No reading';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function SiteStockPage() {
  const [view, setView] = useState<'live' | 'cycle'>('live');

  const [live, setLive] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [cycleData, setCycleData] = useState<any>(null);
  const [cycleLoading, setCycleLoading] = useState(false);

  const [capturing, setCapturing] = useState(false);
  const [carryover, setCarryover] = useState<any>(null);
  const [carryoverLoading, setCarryoverLoading] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'fill' | 'age'>('name');

  useEffect(() => {
    stockApi.live()
      .then((res: any) => setLive((res as any)?.data || res))
      .catch((err: any) => setError(err?.response?.data?.message || 'Failed to load live stock data'))
      .finally(() => setLiveLoading(false));
    stockApi.cycleSnapshots()
      .then((res: any) => {
        const list = (res as any)?.data || res || [];
        setCycles(list);
        if (list.length) setSelectedCycle(list[0].cycle_key);
      })
      .catch(() => setCycles([]));
  }, []);

  useEffect(() => {
    if (view !== 'cycle' || !selectedCycle) return;
    setCycleLoading(true);
    stockApi.cycleSnapshot(selectedCycle)
      .then((res: any) => setCycleData((res as any)?.data || res))
      .catch(() => setCycleData(null))
      .finally(() => setCycleLoading(false));
  }, [view, selectedCycle]);

  useEffect(() => {
    if (view !== 'cycle' || !selectedCycle) return;
    setCarryoverLoading(true);
    stockApi.carryover(selectedCycle)
      .then((res: any) => setCarryover((res as any)?.data || res))
      .catch(() => setCarryover(null))
      .finally(() => setCarryoverLoading(false));
  }, [view, selectedCycle]);

  async function handleCapture() {
    setCapturing(true);
    setCaptureMsg(null);
    try {
      const res: any = await stockApi.snapshotNow();
      const data = (res as any)?.data || res;
      setCaptureMsg(`Captured ${data.sites_captured} site(s) for ${data.cycle_key}.`);
      const snaps: any = await stockApi.cycleSnapshots();
      const list = (snaps as any)?.data || snaps || [];
      setCycles(list);
      if (!selectedCycle) setSelectedCycle(data.cycle_key);
    } catch (err: any) {
      setCaptureMsg(err?.response?.data?.message || 'Failed to capture snapshot.');
    } finally {
      setCapturing(false);
    }
  }

  const activeData = view === 'live' ? live : cycleData;
  const activeLoading = view === 'live' ? liveLoading : cycleLoading;

  const filteredSites = (activeData?.sites || [])
    .filter((s: any) => !clusterFilter || s.cluster === clusterFilter)
    .filter((s: any) => !query.trim() || (s.site_name || '').toLowerCase().includes(query.toLowerCase()) || (s.site_id || '').toLowerCase().includes(query.toLowerCase()))
    .sort((a: any, b: any) => {
      if (sortBy === 'stock') return (b.stock_l ?? -1) - (a.stock_l ?? -1);
      if (sortBy === 'fill') return (b.fill_pct ?? -1) - (a.fill_pct ?? -1);
      if (sortBy === 'age') return (b.reading_age_hours ?? -1) - (a.reading_age_hours ?? -1);
      return (a.site_name || '').localeCompare(b.site_name || '');
    });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="⛽ Site & Cluster Stock"
        subtitle="Live fuel stock, per site and per cluster — reads the same live tank data every other view in this system uses. Not the historical archive."
        actions={
          <Btn variant="primary" size="sm" loading={capturing} onClick={handleCapture}>
            📸 Capture Snapshot Now
          </Btn>
        }
      />

      {captureMsg && (
        <div style={{ background: neutral[50], border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: neutral[700] }}>
          {captureMsg}
        </div>
      )}
      {error && <ErrorBox message={error} />}

      {/* ── View toggle ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Btn variant={view === 'live' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('live')}>Live — Right Now</Btn>
        <Btn variant={view === 'cycle' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('cycle')}>End of Cycle</Btn>
      </div>

      {view === 'cycle' && (
        <div style={{ marginBottom: 20 }}>
          {!cycles.length ? (
            <EmptyState icon="📸" title="No cycle snapshots captured yet" desc="Use 'Capture Snapshot Now' above, or wait for a cycle to close — every closure now automatically records one." />
          ) : (
            <select value={selectedCycle || ''} onChange={e => setSelectedCycle(e.target.value)}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '8px 12px', fontSize: 14 }}>
              {cycles.map((c: any) => (
                <option key={c.cycle_key} value={c.cycle_key}>
                  {c.cycle_key} — {c.site_count} site(s), captured {new Date(c.captured_at).toLocaleString()}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {activeLoading ? <Spinner /> : !activeData ? (
        view === 'cycle' && !cycles.length ? null : <EmptyState icon="⛽" title="No stock data" desc="Nothing to show yet." />
      ) : (
        <>
          {/* ── Fleet summary ── */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="Total Sites" value={activeData.totals?.site_count ?? 0} icon="📍" />
            <KpiCard label="Sites With A Reading" value={activeData.totals?.sites_with_reading ?? 0}
              sub={`of ${activeData.totals?.site_count ?? 0}`} icon="✓" />
            <KpiCard label="Total Stock" value={`${fmt(activeData.totals?.total_stock_l)} L`} icon="🛢️" />
            <KpiCard label="Fleet Fill Rate"
              value={activeData.totals?.total_capacity_l > 0 ? `${Math.round((activeData.totals.total_stock_l / activeData.totals.total_capacity_l) * 100)}%` : '—'}
              icon="📊" color={ink} />
          </div>

          {/* ── Carried-over stock from the prior cycle — only meaningful in the End of Cycle view ── */}
          {view === 'cycle' && (
            <Card style={{ marginBottom: 24 }}>
              <SectionLabel style={{ marginBottom: 4, fontSize: 13, textTransform: 'none', letterSpacing: 0, color: ink, fontWeight: 700 }}>↪ Carried Over From Prior Cycle</SectionLabel>
              <div style={{ fontSize: 11, color: neutral[500], marginBottom: 10 }}>
                Stock still physically in the tank when the previous cycle closed, rolled into this cycle as a real opening balance — on top of whatever budget was freshly approved for this cycle, not instead of it.
              </div>
              {carryoverLoading ? <Spinner /> : !carryover?.sites?.length ? (
                <div style={{ fontSize: 12, color: neutral[400] }}>No carryover recorded for this cycle yet.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Sites With Carryover</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{carryover.sites_with_carryover}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Total Carried Over</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(carryover.total_carried_over_l)} L</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {carryover.sites.slice(0, 12).map((s: any) => (
                      <div key={s.site_id} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                        <strong>{s.site_name || s.site_id}</strong>
                        <span style={{ color: neutral[400] }}> · {fmt(s.carried_over_l)} L from {s.carried_over_from_cycle}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ── Per-cluster breakdown ── */}
          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Stock By Cluster</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {(activeData.by_cluster || []).map((c: any) => (
                <button
                  key={c.cluster}
                  onClick={() => setClusterFilter(clusterFilter === c.cluster ? '' : c.cluster)}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    border: clusterFilter === c.cluster ? `2px solid ${ink}` : `1px solid ${neutral[200]}`,
                    borderRadius: 12, padding: 14, background: '#fff',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{c.cluster}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: ink }}>{fmt(c.total_stock_l)} L</div>
                  <div style={{ fontSize: 11, color: neutral[500], marginTop: 4 }}>
                    {c.site_count} site(s) · {c.sites_with_reading} with a reading
                    {c.fill_pct != null && ` · ${c.fill_pct}% full`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Per-site table ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              Site-by-Site {clusterFilter && `— ${clusterFilter}`}
              {clusterFilter && <button onClick={() => setClusterFilter('')} style={{ marginLeft: 8, border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>clear</button>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={query} onChange={e => setQuery(e.target.value)} placeholder="Search site…"
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 180 }}
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                <option value="name">Sort: Name</option>
                <option value="stock">Sort: Lowest Stock First</option>
                <option value="fill">Sort: Lowest Fill % First</option>
                <option value="age">Sort: Stalest Reading First</option>
              </select>
            </div>
          </div>

          <Card padded={false} style={{ overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                <tr>
                  {['Site', 'Cluster', 'Stock (L)', 'Capacity (L)', 'Fill %', 'Source', 'Reading Age'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSites.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: neutral[400] }}>No sites match this filter.</td></tr>
                ) : filteredSites.map((s: any) => (
                  <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                    <td style={{ padding: '7px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{s.site_name || s.site_id}</div>
                      <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id}</div>
                    </td>
                    <td style={{ padding: '7px 12px' }}>{s.cluster || '—'}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 700 }}>{fmt(s.stock_l)}</td>
                    <td style={{ padding: '7px 12px', color: neutral[500] }}>{fmt(s.capacity_l)}</td>
                    <td style={{ padding: '7px 12px' }}>
                      {s.fill_pct != null ? (
                        <span style={{ color: s.fill_pct < 20 ? urgency.critical.fg : s.fill_pct < 50 ? urgency.high.fg : urgency.ok.fg, fontWeight: 600 }}>
                          {s.fill_pct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '7px 12px', color: neutral[500], fontSize: 11 }}>{s.fuel_level_source || '—'}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ color: freshnessColor(s.reading_age_hours), fontWeight: 600, fontSize: 11 }}>
                        {freshnessLabel(s.reading_age_hours)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
