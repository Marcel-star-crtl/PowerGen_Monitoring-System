/**
 * TechnicianIntegrityPage.tsx
 *
 * Fleet-wide patterns across technicians and routes — not a per-site
 * variance view (that's Reconciliation), a per-person one. Same underlying
 * flagged-visit / variance data Reconciliation already computes per site,
 * aggregated by technician instead — see technicianIntegrityService.js on
 * the backend for exactly what "flagged" and "variance" mean here.
 */
import React, { useState } from 'react';
import { useCycles, useTechnicianIntegrity } from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, Card, KpiCard, Tag, SectionLabel,
  Spinner, ErrorBox, EmptyState, Btn,
} from '../../components/diesel/DieselComponents';
import { neutral, ink, status as statusTokens, urgency as urgencyTokens, font } from '../../styles/dieselTokens';
import type { TechnicianIntegrityRow } from '../../types/diesel.types';

const PAGE_SIZE = 25;

function pct1(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toFixed(1)}%`;
}

// Same ok/high/critical breakpoints as DieselComponents' own varianceClass
// (5% / 15%), just reading a plain percentage instead of a fraction.
function varianceColor(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return neutral[400];
  const abs = Math.abs(pct);
  if (abs > 15) return urgencyTokens.critical.fg;
  if (abs > 5) return urgencyTokens.high.fg;
  return urgencyTokens.ok.fg;
}

export default function TechnicianIntegrityPage() {
  const { cycles, selectedKey, setSelectedKey } = useCycles();
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useTechnicianIntegrity(selectedKey, { page, limit: PAGE_SIZE });

  const visitsAnalyzed      = data?.visits_analyzed ?? 0;
  const fleetAvgFlaggedRate = data?.fleet_avg_flagged_rate_pct ?? 0;
  const highestOutlier      = data?.highest_outlier ?? null;
  const technicians: TechnicianIntegrityRow[] = data?.technicians ?? [];
  const pagination = data?.pagination;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🔍 Technician Integrity"
        subtitle="Fleet-wide patterns across technicians and routes — not a per-site variance view, a per-person one."
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={(k) => { setSelectedKey(k); setPage(1); }} />
            <Btn variant="ghost" size="sm" onClick={() => refetch()}>↻</Btn>
          </>
        }
      />

      <Card style={{ marginBottom: 16, borderColor: statusTokens.info.border, background: statusTokens.info.bg }}>
        <div style={{ fontSize: 13, color: ink }}>
          This surfaces a statistical pattern, not a verdict. A technician can carry a high flagged rate because
          of the sites they're assigned — remote or older-generator sites flag more often regardless of who
          visits them. It's a prompt to look, the same way Reconciliation's alerts are a prompt, not a conclusion.
        </div>
      </Card>

      {error && <ErrorBox message={error} onRetry={refetch} />}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Visits analyzed" value={visitsAnalyzed.toLocaleString()} sub={data ? `Cycle ${data.cycle_key}, all clusters` : undefined} />
            <KpiCard label="Fleet avg. flagged rate" value={pct1(fleetAvgFlaggedRate)} />
            {highestOutlier ? (
              <KpiCard
                label="Highest outlier"
                value={highestOutlier.technician_name}
                sub={`${pct1(highestOutlier.flagged_rate_pct)} flagged${fleetAvgFlaggedRate > 0 ? ` — ${(highestOutlier.flagged_rate_pct / fleetAvgFlaggedRate).toFixed(1)}× fleet avg.` : ''}`}
                tone="warn"
              />
            ) : (
              <KpiCard label="Highest outlier" value="—" sub="No outliers at this threshold" />
            )}
          </div>

          {technicians.length === 0 ? (
            <EmptyState icon="🔍" title="No technician data for this cycle" desc="No field visits with a resolved technician were found in this cycle yet." />
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: neutral[50] }}>
                      {['Technician', 'Visits', 'Flagged rate', 'Avg. RH-vs-liters variance', 'Pattern'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 11, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((t) => (
                      <tr key={t.technician_name} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: ink }}>{t.technician_name}</td>
                        <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{t.visits}</td>
                        <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: varianceColor(t.flagged_rate_pct - fleetAvgFlaggedRate) }}>
                          {pct1(t.flagged_rate_pct)}
                        </td>
                        <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: varianceColor(t.avg_variance_pct) }}>
                          {t.avg_variance_pct != null ? `${t.avg_variance_pct > 0 ? '+' : ''}${pct1(t.avg_variance_pct)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {t.pattern === 'above'
                            ? <Tag variant="danger">Above fleet average — review recommended</Tag>
                            : <Tag variant="success">Within normal range</Tag>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.total > PAGE_SIZE && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: `1px solid ${neutral[100]}` }}>
                  <span style={{ fontSize: 12, color: neutral[500] }}>
                    Showing {technicians.length} of {pagination.total} technicians
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Btn>
                    <Btn variant="secondary" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Btn>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
