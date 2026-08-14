/**
 * DataSourceComparisonPage.tsx
 *
 * CMS/ERS telemetry is a genuinely useful signal but can drift from what's
 * actually true on site — field data (a technician physically there) is
 * the trusted source of truth, CMS the fallback when field data isn't
 * available. This page makes that priority visible and auditable rather
 * than something that happens silently inside reconciliation math: every
 * site, every metric (fuel level, run-hours, consumption), CMS and field
 * side by side, their variance, and exactly which one the rest of the
 * system actually used and why.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useCycles } from '../../hooks/useDiesel';
import { dataSourceComparisonApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, CycleSelector } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency } from '../../styles/dieselTokens';

const SOURCE_LABEL: Record<string, string> = {
  field_grato: 'Field (GRATO)', field_mobile: 'Field (Mobile)', field_combined: 'Field (Combined)',
  field_visit: 'Field Visit', cms_telemetry: 'CMS', tank_telemetry: 'Tank Upload', cms: 'CMS', none: 'No Data',
};
const SOURCE_COLOR: Record<string, string> = {
  field_grato: urgency.ok.fg, field_mobile: urgency.ok.fg, field_combined: urgency.ok.fg, field_visit: urgency.ok.fg,
  cms_telemetry: urgency.medium.fg, cms: urgency.medium.fg, tank_telemetry: urgency.medium.fg, none: neutral[400],
};

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}
function SourceBadge({ source }: { source: string | null }) {
  const key = source || 'none';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      background: `${SOURCE_COLOR[key] || neutral[400]}20`, color: SOURCE_COLOR[key] || neutral[400],
    }}>
      {SOURCE_LABEL[key] || key}
    </span>
  );
}
function VarianceTag({ pctVal }: { pctVal: number | null }) {
  if (pctVal == null) return <span style={{ color: neutral[400] }}>—</span>;
  const abs = Math.abs(pctVal);
  const color = abs > 40 ? urgency.critical.fg : abs > 15 ? urgency.high.fg : urgency.ok.fg;
  return <span style={{ color, fontWeight: 700 }}>{pctVal > 0 ? '+' : ''}{pctVal}%</span>;
}

export default function DataSourceComparisonPage() {
  const { cycles, selectedKey, setSelectedKey } = useCycles();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [disagreementOnly, setDisagreementOnly] = useState(false);
  const [metric, setMetric] = useState<'fuel' | 'rh' | 'consumption'>('fuel');
  const [detailSite, setDetailSite] = useState<any>(null);

  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);
    dataSourceComparisonApi.get(selectedKey)
      .then((res: any) => setData((res as any)?.data || res))
      .catch((err: any) => setError(err?.response?.data?.error || 'Failed to load comparison'))
      .finally(() => setLoading(false));
  }, [selectedKey]);

  const rows = data?.rows || [];
  const summary = data?.summary;

  const clusters = useMemo(() => Array.from(new Set(rows.map((r: any) => r.cluster).filter(Boolean))).sort() as string[], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (clusterFilter && r.cluster !== clusterFilter) return false;
      if (search && !`${r.site_name} ${r.site_id}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (disagreementOnly) {
        const v = metric === 'fuel' ? r.variance.fuel_level_pct : metric === 'rh' ? r.variance.rh_pct : r.variance.consumption_pct;
        if (v == null || Math.abs(v) <= 15) return false;
      }
      return true;
    });
  }, [rows, clusterFilter, search, disagreementOnly, metric]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="⚖️ CMS vs Field Data"
        subtitle="Field data is the trusted source of truth — CMS is the fallback when field data isn't available. See both, their disagreement, and exactly which one the system used."
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && summary && (
        <>
          {/* ── Summary ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Sites', value: summary.total_sites },
              { label: 'Both Sources', value: summary.both_sources_available, color: urgency.ok.fg },
              { label: 'CMS Only', value: summary.cms_only, color: urgency.medium.fg },
              { label: 'Field Only', value: summary.field_only, color: urgency.ok.fg },
              { label: 'Neither', value: summary.neither, color: urgency.critical.fg },
              { label: 'Significant Gaps', value: summary.significant_rh_disagreement + summary.significant_fuel_disagreement, color: urgency.high.fg },
              { label: 'Over Budget', value: summary.over_budget_count ?? 0, color: urgency.high.fg },
            ].map(box => (
              <div key={box.label} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase', marginBottom: 4 }}>{box.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: box.color || ink }}>{box.value}</div>
              </div>
            ))}
          </div>

          {/* ── Legend / priority explanation ── */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, fontSize: 12, color: neutral[600] }}>
            <span><SourceBadge source="field_visit" /> = trusted source of truth</span>
            <span><SourceBadge source="cms_telemetry" /> = fallback, used only when field data isn't available</span>
          </div>

          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Search site name or ID…"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 220 }}
            />
            {clusters.length > 0 && (
              <select value={clusterFilter} onChange={e => setClusterFilter(e.target.value)}
                style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                <option value="">All Clusters</option>
                {clusters.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <select value={metric} onChange={e => setMetric(e.target.value as any)}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="fuel">Fuel Level</option>
              <option value="rh">Run Hours</option>
              <option value="consumption">Consumption</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={disagreementOnly} onChange={e => setDisagreementOnly(e.target.checked)} />
              Significant disagreement only (&gt;15%)
            </label>
          </div>

          {/* ── Comparison table ── */}
          {filtered.length === 0 ? (
            <EmptyState icon="⚖️" title="No sites match" desc="Try widening your filters." />
          ) : (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, overflow: 'auto', maxHeight: 600 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>Site</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], background: `${urgency.medium.fg}10` }}>CMS Says</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], background: `${urgency.ok.fg}10` }}>Field Says</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>Variance</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>System Used (Combined)</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => {
                    const cmsVal = metric === 'fuel' ? r.cms.fuel_level_l : metric === 'rh' ? r.cms.rh : r.cms.consumption_l;
                    const fieldVal = metric === 'fuel' ? r.field.fuel_level_l : metric === 'rh' ? r.field.rh : r.field.consumption_l;
                    const combinedVal = metric === 'fuel' ? r.combined.fuel_level_l : metric === 'rh' ? r.combined.rh : r.combined.consumption_l;
                    const combinedSource = metric === 'fuel' ? r.combined.fuel_level_source : r.combined.rh_source;
                    const variancePct = metric === 'fuel' ? r.variance.fuel_level_pct : metric === 'rh' ? r.variance.rh_pct : r.variance.consumption_pct;
                    const unit = metric === 'consumption' ? 'L' : metric === 'rh' ? 'hrs' : 'L';

                    return (
                      <tr key={r.site_id} onClick={() => setDetailSite(r)} style={{ borderBottom: `1px solid ${neutral[100]}`, cursor: 'pointer' }}>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{r.site_name || r.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{r.cluster || '—'}</div>
                        </td>
                        <td style={{ padding: '7px 10px', background: `${urgency.medium.fg}06` }}>
                          {cmsVal != null ? `${fmt(cmsVal, metric === 'rh' ? 1 : 0)} ${unit}` : <span style={{ color: neutral[400] }}>No data</span>}
                        </td>
                        <td style={{ padding: '7px 10px', background: `${urgency.ok.fg}06` }}>
                          {fieldVal != null ? `${fmt(fieldVal, metric === 'rh' ? 1 : 0)} ${unit}` : <span style={{ color: neutral[400] }}>No data</span>}
                        </td>
                        <td style={{ padding: '7px 10px' }}><VarianceTag pctVal={variancePct} /></td>
                        <td style={{ padding: '7px 10px' }}>
                          <strong>{combinedVal != null ? `${fmt(combinedVal, metric === 'rh' ? 1 : 0)} ${unit}` : '—'}</strong>
                          {' '}<SourceBadge source={combinedSource} />
                        </td>
                        <td style={{ padding: '7px 10px', color: neutral[400] }}>Details →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: neutral[500] }}>
            {filtered.length} of {rows.length} site(s) shown.
          </div>
        </>
      )}

      {/* ── Site detail modal ── */}
      {detailSite && (
        <div onClick={() => setDetailSite(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, width: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{detailSite.site_name || detailSite.site_id}</div>
                <div style={{ color: neutral[500], fontSize: 12 }}>{detailSite.site_id} · {detailSite.cluster || '—'}</div>
              </div>
              <button onClick={() => setDetailSite(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: neutral[400] }}>✕</button>
            </div>

            {[
              { label: 'Fuel Level', cms: detailSite.cms.fuel_level_l, cmsUnit: 'L', cmsDate: detailSite.cms.fuel_level_date, field: detailSite.field.fuel_level_l, fieldUnit: 'L', fieldDate: detailSite.field.fuel_level_date, fieldWho: detailSite.field.technician_name, variance: detailSite.variance.fuel_level_pct },
              { label: 'Run Hours', cms: detailSite.cms.rh, cmsUnit: 'hrs', field: detailSite.field.rh, fieldUnit: 'hrs', fieldExtra: detailSite.field.rh_from_mobile ? `(${fmt(detailSite.field.rh_from_mobile, 1)} hrs from mobile refuels)` : null, variance: detailSite.variance.rh_pct },
              { label: 'Consumption', cms: detailSite.cms.consumption_l, cmsUnit: 'L', field: detailSite.field.consumption_l, fieldUnit: 'L', variance: detailSite.variance.consumption_pct },
            ].map(block => (
              <div key={block.label} style={{ marginBottom: 16, border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{block.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: SOURCE_COLOR.cms_telemetry }}>CMS: <strong>{block.cms != null ? `${fmt(block.cms, 1)} ${block.cmsUnit}` : 'No data'}</strong></span>
                  {block.cmsDate && <span style={{ color: neutral[400] }}>{fmtDate(block.cmsDate)}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: SOURCE_COLOR.field_visit }}>
                    Field: <strong>{block.field != null ? `${fmt(block.field, 1)} ${block.fieldUnit}` : 'No data'}</strong>
                    {block.fieldExtra && <span style={{ color: neutral[400], fontWeight: 400 }}> {block.fieldExtra}</span>}
                  </span>
                  {block.fieldDate && <span style={{ color: neutral[400] }}>{fmtDate(block.fieldDate)}{block.fieldWho ? ` · ${block.fieldWho}` : ''}</span>}
                </div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Variance: <VarianceTag pctVal={block.variance} /></div>
              </div>
            ))}

            <div style={{ fontSize: 11, color: neutral[400] }}>
              Combined fuel level currently in use: {fmt(detailSite.combined.fuel_level_l)} L, sourced from <SourceBadge source={detailSite.combined.fuel_level_source} />, updated {fmtDate(detailSite.combined.fuel_level_updated_at)}.
            </div>

            {detailSite.budget?.budget_liters != null && (
              <div style={{ marginTop: 12, border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Budget</div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Combined consumption ({fmt(detailSite.combined.consumption_l)} L) vs. budget ({fmt(detailSite.budget.budget_liters)} L)
                </div>
                <div style={{ fontSize: 12 }}>
                  Variance: <VarianceTag pctVal={detailSite.budget.variance_pct} />
                  {detailSite.budget.over_budget && <span style={{ color: urgency.high.fg, marginLeft: 8 }}>⚠ Over budget</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
