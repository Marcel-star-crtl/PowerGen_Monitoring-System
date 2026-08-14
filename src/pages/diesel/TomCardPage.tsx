/**
 * TomCardPage.tsx  —  src/pages/diesel/TomCardPage.tsx
 *
 * CHANGES FROM PREVIOUS VERSION:
 *  1. CLUSTER_CARDS updated with July 2026 actuals from TOM_CARD.xlsx:
 *       budget_liters, budget_xaf, initial_recharge_pct, actual_card_limit, new_limit
 *  2. New "Cluster Budget Summary" panel shows the budget vs purchased vs variance
 *     per cluster, with a traffic-light RAG status bar.
 *  3. Card mapping form improved: cluster dropdown pre-fills card_num AND budget
 *     allocation note so the user sees how much is left to spend.
 *  4. Export button and existing upload / transaction / mapping UX unchanged.
 */

import React, { useState, useMemo } from 'react';
import { tomCardApi, reportsApi } from '../../api/dieselApi';
import {
  useCycles, useTomCardSummary, useTomCardTransactions,
  useTomCardMappings, useFileUpload, useReconciliation, useTomCardUnmapped,
} from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, KpiCard,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn,
} from '../../components/diesel/DieselComponents';

// CLUSTER_CARDS moved inside component — see useState below

const EMPTY_FORM = { card_num: '', card_label: '', cluster: '', site_id: '', truck_plate: '', driver_name: '' };

// ── RAG colour for budget utilisation ─────────────────────────────────────────
function budgetRAG(usedPct: number): { bar: string; text: string } {
  if (usedPct >= 95) return { bar: '#dc2626', text: '#991b1b' };
  if (usedPct >= 75) return { bar: '#f59e0b', text: '#92400e' };
  return { bar: '#16a34a', text: '#166534' };
}

// ── Cluster Budget Summary panel ──────────────────────────────────────────────
function ClusterBudgetSummary({
  transactions,
  clusterCards,
  totalBudgetXAF,
}: {
  transactions: any[];
  clusterCards:  any[];
  totalBudgetXAF: number;
}) {
  // Aggregate purchased litres by cluster from transactions
  const purchasedByCluster: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.cluster) {
      purchasedByCluster[t.cluster] = (purchasedByCluster[t.cluster] || 0) + (t.quantity_l || 0);
    }
  });

  const totalBudgetL = clusterCards.reduce((s: number, c: any) => s + (c.budget_liters || 0), 0);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          📊 Cluster Budget vs Actual
        </h3>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Total budget: <strong>{fmtNum(totalBudgetL)} L</strong>
          {' · '}XAF {(totalBudgetXAF / 1_000_000).toFixed(1)}M
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Cluster', 'Vendor', 'Card #', 'Budget (L)', 'Budget (XAF)', 'Purchased (L)', 'Remaining (L)', 'Used %', 'Card Limit (XAF)'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: '#6b7280', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clusterCards.map((c: any) => {
              const purchased  = purchasedByCluster[c.cluster] || 0;
              const remaining  = Math.max(0, c.budget_liters - purchased);
              const usedPct    = c.budget_liters > 0 ? Math.round((purchased / c.budget_liters) * 100) : 0;
              const { bar, text } = budgetRAG(usedPct);

              return (
                <tr key={c.cluster} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.cluster}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: c.vendor === 'TRADEX' ? '#fef3c7' : '#e0f2fe',
                      color:      c.vendor === 'TRADEX' ? '#92400e'  : '#0369a1',
                    }}>{c.vendor}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280', fontFamily: 'monospace' }}>
                    #{c.card_num}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                    {fmtNum(c.budget_liters)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#6b7280' }}>
                    {(c.budget_xaf / 1_000_000).toFixed(2)}M
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {purchased > 0
                      ? <span style={{ color: '#374151', fontWeight: 600 }}>{fmtNum(purchased)}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 700,
                      color: remaining < c.budget_liters * 0.1 ? '#dc2626' : '#374151',
                    }}>{fmtNum(remaining)}</span>
                  </td>
                  <td style={{ padding: '10px 12px', minWidth: 110 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(usedPct, 100)}%`, height: 6, background: bar, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: text, minWidth: 30, textAlign: 'right' }}>
                        {usedPct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>
                    {(c.new_limit_xaf / 1_000_000).toFixed(2)}M
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
              <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700 }}>TOTAL</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                {fmtNum(totalBudgetL)}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>
                {(totalBudgetXAF / 1_000_000).toFixed(1)}M
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                {fmtNum(Object.values(purchasedByCluster).reduce((s, v) => s + v, 0))}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                {fmtNum(totalBudgetL - Object.values(purchasedByCluster).reduce((s, v) => s + v, 0))}
              </td>
              <td colSpan={2} style={{ padding: '10px 12px' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Recharge note */}
      <div style={{
        marginTop: 12, fontSize: 11, color: '#6b7280',
        background: '#f8fafc', borderRadius: 6, padding: '8px 12px',
        lineHeight: 1.6,
      }}>
        <strong>ℹ Card limit notes:</strong> Most clusters are recharged at 80% of budget (Pouma 1 at 100%).
        Strategic tank usage adds to Edea and Kotto card limits beyond the standard budget.
        Pouma 2 uses TRADEX (card #5807) — the only non-TOTAL card in the fleet.
        "New limit" column reflects the updated limit set on 26/06/2026.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function TomCardPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();

  // Cluster budget cards — loaded live from SiteBudget aggregate
  const [CLUSTER_CARDS, setClusterCards] = React.useState<any[]>([]);
  const TOTAL_BUDGET_L   = CLUSTER_CARDS.reduce((s:number, c:any) => s + (c.budget_liters||0), 0);
  const TOTAL_BUDGET_XAF = CLUSTER_CARDS.reduce((s:number, c:any) => s + (c.budget_xaf||0), 0);
  const ALL_CLUSTERS     = CLUSTER_CARDS.map((c:any) => c.cluster);

  // Live cluster budget data — updates every cycle change
  React.useEffect(() => {
    if (!selectedKey) return;
    import('../../api/dieselApi').then(({ default: api }) => {
      Promise.all([
        api.get(`/site-budget/${selectedKey}/aggregate`),
        api.get(`/site-budget/${selectedKey}`),
      ]).then(([aggRes, sbRes]) => {
        const clusters = aggRes.data?.data?.by_cluster || [];
        const siteMap: Record<string,any> = {};
        (sbRes.data?.data || []).forEach((s: any) => {
          if (!siteMap[s.cluster] && s.card_number) siteMap[s.cluster] = s;
        });
        setClusterCards(clusters.map((c: any) => ({
          cluster:          c._id,
          card_num:         siteMap[c._id]?.card_number || '—',
          vendor:           siteMap[c._id]?.fuel_vendor || 'TOTAL',
          budget_liters:    c.budget_liters    || 0,
          budget_xaf:       c.budget_xaf       || 0,
          liters_used:      c.liters_used      || 0,
          liters_remaining: Math.max(0, (c.budget_liters||0)-(c.liters_used||0)),
          utilisation_pct:  c.utilisation_pct  || 0,
          in_deficit:       (c.utilisation_pct||0) > 100,
          recharge_pct:     0.80,
          actual_limit_xaf: siteMap[c._id] ? Math.round(c.budget_xaf * 0.20) : 0,
          new_limit_xaf:    c.budget_xaf || 0,
        })));
      }).catch(() => {});
    });
  }, [selectedKey]);

  const { data: summary,  loading: summaryLoading,  refetch: refetchSummary }  = useTomCardSummary(selectedKey);
  const { data: txns,     loading: txnsLoading,     refetch: refetchTxns }     = useTomCardTransactions({ cycle_key: selectedKey, limit: 200 });
  const { data: mappings, loading: mappingsLoading, refetch: refetchMappings } = useTomCardMappings();
  const { data: recon }   = useReconciliation(selectedKey, { limit: 300 });
  const { data: unmapped, refetch: refetchUnmapped } = useTomCardUnmapped(selectedKey);

  const { uploading, result, error, upload, reset } = useFileUpload();
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Sites for selected cluster (from reconciliation data) ─────────────────
  const sitesInCluster = useMemo(() => {
    const rows: any[] = (recon as any)?.data || recon || [];
    if (!form.cluster) return rows;
    return rows.filter((r: any) => r.cluster === form.cluster);
  }, [recon, form.cluster]);

  // ── When cluster changes, pre-fill card_num from known mapping ────────────
  function handleClusterChange(cluster: string) {
    const match = CLUSTER_CARDS.find(c => c.cluster === cluster);
    setForm(f => ({
      ...f,
      cluster,
      site_id: '',
      card_num:   match ? match.card_num   : f.card_num,
      card_label: match ? `${match.vendor} #${match.card_num}` : f.card_label,
    }));
  }

  // ── Find cluster budget info for mapping form context note ─────────────────
  const selectedClusterInfo = CLUSTER_CARDS.find(c => c.cluster === form.cluster);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    reset();
    await upload(() => tomCardApi.upload(file, selectedKey));
    refetchSummary(); refetchTxns();
  }

  async function handleSaveMapping() {
    if (!form.card_num || !form.cluster) return;
    setSaving(true);
    try {
      await tomCardApi.saveMapping(form);
      setForm({ ...EMPTY_FORM });
      setShowMappingForm(false);
      refetchMappings(); refetchTxns(); refetchUnmapped();
    } finally { setSaving(false); }
  }

  async function handleExport() {
    if (!selectedKey) return;
    setDownloading(true);
    try {
      await reportsApi.downloadFile(
        `/api/diesel-recon/reports/tomcard/${selectedKey}/excel`,
        `tomcard-report-${selectedKey}.xlsx`
      );
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally { setDownloading(false); }
  }

  if (cyclesLoading) return <Spinner />;

  const sum         = (summary as any) || {};
  const list: any[] = (txns as any)?.data || txns || [];
  const maps: any[] = (mappings as any)?.data || mappings || [];
  const unmappedCount = list.filter((t: any) => t.mapping_confidence === 'unlinked').length;

  // Cluster totals from transactions
  const clusterTotals: Record<string, number> = {};
  list.forEach((t: any) => {
    if (t.cluster) clusterTotals[t.cluster] = (clusterTotals[t.cluster] || 0) + (t.quantity_l || 0);
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="💳 Tom Card Reconciliation"
        subtitle="July 2026 — diesel fuel card statements vs field-recorded fuel per cluster"
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            <Btn size="sm" disabled={!selectedKey || downloading} onClick={handleExport}>
              {downloading ? '⏳' : '⬇️ Export'}
            </Btn>
          </>
        }
      />

      {/* ── KPIs ── */}
      {summaryLoading ? <Spinner /> : (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Total Budget (L)"     value={fmtNum(TOTAL_BUDGET_L)}          icon="📋" />
          <KpiCard label="Total Purchased (L)"  value={fmtNum(sum.total_liters)}         icon="⛽" />
          <KpiCard label="Budget (XAF)"         value={`${(TOTAL_BUDGET_XAF/1_000_000).toFixed(1)}M`} icon="💰" />
          <KpiCard label="Spent (XAF)"          value={fmtNum(sum.total_amount_cfa)}     icon="🧾" />
          <KpiCard label="Active Cards"         value={CLUSTER_CARDS.length}             icon="💳" />
          <KpiCard
            label="Unmapped Transactions"
            value={unmappedCount}
            icon="❓"
            alert={unmappedCount > 0}
            color={unmappedCount > 0 ? '#dc2626' : '#1a1a2e'}
          />
        </div>
      )}

      {/* ── Cluster budget summary (new) ── */}
      <ClusterBudgetSummary transactions={list} clusterCards={CLUSTER_CARDS} totalBudgetXAF={TOTAL_BUDGET_XAF} />

      {/* ── Card distribution reference ── */}
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd',
        borderRadius: 10, padding: '14px 18px', marginBottom: 20,
      }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
          📋 GRATO Card Distribution — July 2026
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CLUSTER_CARDS.map(cc => (
            <div key={cc.cluster} style={{
              background: cc.vendor === 'TRADEX' ? '#fef3c7' : '#e0f2fe',
              border: `1px solid ${cc.vendor === 'TRADEX' ? '#fde68a' : '#7dd3fc'}`,
              borderRadius: 8, padding: '6px 12px', fontSize: 12,
            }}>
              <div style={{ fontWeight: 700 }}>{cc.cluster}</div>
              <div style={{ color: '#6b7280', marginTop: 1 }}>
                #{cc.card_num} · {cc.vendor} · <strong>{fmtNum(cc.budget_liters)} L</strong>
              </div>
              <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 1 }}>
                Budget: XAF {(cc.budget_xaf / 1_000_000).toFixed(2)}M · Limit: XAF {(cc.new_limit_xaf / 1_000_000).toFixed(2)}M
              </div>
            </div>
          ))}
        </div>
      </div>

      {unmappedCount > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '12px 18px', marginBottom: 12,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            ⚠️ {unmappedCount} transaction(s) on this page not linked to a cluster/site.
            Add a mapping below or upload a statement with a matching card number.
          </p>
        </div>
      )}

      {/* ── Coverage-gap panel: every card/station still unmapped or weakly ─────
          matched, ranked by liters purchased, across ALL uploaded data (not
          just the 200-row page above). This is what makes the gap fixable
          instead of just visible: without ranking by liters, an admin has
          no way to tell which mapping actually matters. */}
      {!!(unmapped as any)?.length && (
        <div style={{
          background: '#fff', border: '1px solid #fde68a', borderRadius: 10,
          padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#92400e' }}>
              🛢️ Needs mapping — {(unmapped as any).length} card/station(s), {fmtNum((unmapped as any).reduce((s: number, r: any) => s + (r.total_liters || 0), 0))} L not reconciled
            </h3>
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#92400e', borderBottom: '1px solid #fde68a' }}>
                <th style={{ padding: '4px 8px' }}>Card #</th>
                <th style={{ padding: '4px 8px' }}>Station</th>
                <th style={{ padding: '4px 8px' }}>Confidence</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Liters</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>XAF</th>
                <th style={{ padding: '4px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {(unmapped as any).slice(0, 10).map((row: any) => (
                <tr key={`${row.card_num}-${row.station_name}`} style={{ borderBottom: '1px solid #fef3c7' }}>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{row.card_num}</td>
                  <td style={{ padding: '4px 8px' }}>{row.station_name || '—'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {row.mapping_confidence === 'station_match' ? 'Weak (station guess)' : 'Unmapped'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtNum(row.total_liters)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtNum(row.total_cfa)}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <Btn
                      size="sm"
                      onClick={() => {
                        setForm(f => ({ ...f, card_num: row.card_num, card_label: row.station_name || f.card_label }));
                        setShowMappingForm(true);
                      }}
                    >
                      Map this card →
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>
        {/* ── Upload + by-station ── */}
        <div>
          <UploadZone accept=".csv,.xlsx" label="Upload Tom Card statement" onFile={handleFile} uploading={uploading} />
          {result && (
            <div style={{ marginTop: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✅ Imported</p>
              <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
                {(result as any).data?.rows_imported} new transactions,{' '}
                {(result as any).data?.rows_duplicate || 0} duplicates skipped.
                Total: {fmtNum((result as any).data?.total_liters)} L
              </p>
            </div>
          )}
          {error && <div style={{ marginTop: 16 }}><ErrorBox message={error} /></div>}

          {/* By cluster purchased totals */}
          {Object.keys(clusterTotals).length > 0 && (
            <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Purchased vs Budget by Cluster</h3>
              {CLUSTER_CARDS.map(cc => {
                const purchased = clusterTotals[cc.cluster] || 0;
                const pct = cc.budget_liters > 0 ? Math.round((purchased / cc.budget_liters) * 100) : 0;
                const { bar } = budgetRAG(pct);
                return (
                  <div key={cc.cluster} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{cc.cluster}</span>
                      <span style={{ color: '#6b7280' }}>
                        {purchased > 0 ? `${fmtNum(purchased)} / ${fmtNum(cc.budget_liters)} L` : `— / ${fmtNum(cc.budget_liters)} L`}
                      </span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: 6, background: bar, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* By station */}
          {(sum.by_station || []).length > 0 && (
            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>By Station</h3>
              {(sum.by_station || []).map((s: any) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                  <span>{s._id}</span>
                  <strong>{fmtNum(s.total_liters)} L</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Card mappings ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Card → Site Mapping</h3>
            <Btn variant="ghost" size="sm" onClick={() => { setShowMappingForm(v => !v); setForm({ ...EMPTY_FORM }); }}>
              {showMappingForm ? 'Cancel' : '+ Add'}
            </Btn>
          </div>

          {showMappingForm && (
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Cluster dropdown */}
              <div>
                <label style={labelStyle} htmlFor="tomcard-cluster">Cluster *</label>
                <select id="tomcard-cluster" value={form.cluster} onChange={e => handleClusterChange(e.target.value)} style={selectStyle}>
                  <option value="">Select cluster…</option>
                  {ALL_CLUSTERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Budget context note */}
              {selectedClusterInfo && (
                <div style={{ fontSize: 11, background: '#eff6ff', borderRadius: 6, padding: '6px 10px', color: '#1e40af' }}>
                  Budget: <strong>{fmtNum(selectedClusterInfo.budget_liters)} L</strong>
                  {' · '}XAF {(selectedClusterInfo.budget_xaf/1_000_000).toFixed(2)}M
                  {' · '}Card limit: XAF {(selectedClusterInfo.new_limit_xaf/1_000_000).toFixed(2)}M
                  {' · '}{selectedClusterInfo.vendor}
                </div>
              )}

              {/* Site dropdown */}
              <div>
                <label style={labelStyle} htmlFor="tomcard-site">Site (optional — leave blank to map card to whole cluster)</label>
                <select
                  id="tomcard-site"
                  value={form.site_id}
                  onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))}
                  disabled={!form.cluster}
                  style={selectStyle}
                >
                  <option value="">— All sites in cluster —</option>
                  {sitesInCluster.map((s: any) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.site_id} — {s.site_name || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle} htmlFor="tomcard-card-num">Card Number *</label>
                <input
                  id="tomcard-card-num"
                  placeholder="e.g. 84948"
                  value={form.card_num}
                  onChange={e => setForm(f => ({ ...f, card_num: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="tomcard-card-label">Card Label</label>
                <input
                  id="tomcard-card-label"
                  placeholder="e.g. TOTAL #84948"
                  value={form.card_label}
                  onChange={e => setForm(f => ({ ...f, card_label: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="tomcard-truck-plate">Truck Plate (optional)</label>
                <input
                  id="tomcard-truck-plate"
                  placeholder="e.g. LT 1234 A"
                  value={form.truck_plate}
                  onChange={e => setForm(f => ({ ...f, truck_plate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="tomcard-driver-name">Driver Name (optional)</label>
                <input
                  id="tomcard-driver-name"
                  placeholder="Driver name"
                  value={form.driver_name}
                  onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <Btn size="sm" onClick={handleSaveMapping} disabled={!form.card_num || !form.cluster} loading={saving} style={{ width: '100%' }}>
                Save Mapping
              </Btn>
            </div>
          )}

          {mappingsLoading ? <Spinner size={24} /> : maps.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              No mappings yet. Card-to-site links let the reconciliation engine split bulk
              purchases across multiple sites in the same cluster.
            </p>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {maps.map((m: any) => {
                const cc = CLUSTER_CARDS.find(c => c.card_num === m.card_num);
                return (
                  <div key={m._id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      #{m.card_num}{m.card_label ? ` — ${m.card_label}` : ''}
                      {cc && <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 6 }}>({cc.vendor})</span>}
                    </p>
                    <p style={{ margin: 0, color: '#6b7280' }}>
                      {m.cluster}{m.site_id ? ` › ${m.site_id}` : ' (cluster-wide)'}
                      {m.truck_plate ? ` · ${m.truck_plate}` : ''}
                    </p>
                    {cc && (
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
                        Budget: {fmtNum(cc.budget_liters)} L · Limit: XAF {(cc.new_limit_xaf/1_000_000).toFixed(2)}M
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Transactions table ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>
          Transactions {list.length > 0 && <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>({list.length})</span>}
        </h3>
        {txnsLoading ? <Spinner /> : list.length === 0 ? (
          <EmptyState icon="🧾" title="No transactions" desc="Upload a Tom Card statement to see transactions here" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Date', 'Card', 'Station', 'Reg.', 'Liters', 'CFA', 'Cluster', 'Site', 'Mapping'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left', fontSize: 11,
                      fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((t: any) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px' }}>{fmtDate(t.date)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'monospace' }}>#{t.card_num}</td>
                    <td style={{ padding: '8px 12px' }}>{t.station_name}</td>
                    <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{t.registration_num}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{fmtNum(t.quantity_l, 1)}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{fmtNum(t.amount_cfa)}</td>
                    <td style={{ padding: '8px 12px' }}>{t.cluster || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 11 }}>{t.site_id || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background:
                          t.mapping_confidence === 'mapped'        ? '#dcfce7' :
                          t.mapping_confidence === 'station_match' ? '#fef9c3' : '#fee2e2',
                        color:
                          t.mapping_confidence === 'mapped'        ? '#166534' :
                          t.mapping_confidence === 'station_match' ? '#854d0e' : '#991b1b',
                      }}>
                        {t.mapping_confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared form styles ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3,
};
const selectStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb',
  borderRadius: 6, padding: '7px 10px', fontSize: 12, background: '#fff',
};
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb',
  borderRadius: 6, padding: '7px 10px', fontSize: 12,
};
