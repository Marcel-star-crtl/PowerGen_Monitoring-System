/**
 * TomCardPage.tsx
 * Upload Tom Card statements, view transactions, manage card-to-cluster/site mappings.
 *
 * FIXES:
 * 1. Export button uses programmatic auth download instead of <a href>.
 * 2. Card mapping form now has cluster DROPDOWN (from GRATO card table) and
 *    site DROPDOWN filtered by selected cluster from reconciliation data.
 *    Known cards pre-filled from the image:
 *      Bonaberi 1 → 84948   Bonaberi 2 → 84950   Edea → 84953
 *      Kotto → 121720        Ndogbong → 84946     Pouma 1 → 84951
 *      Pouma 2 → 5807 (TRADEX)
 */
import React, { useState, useMemo } from 'react';
import { tomCardApi, reportsApi } from '../../api/dieselApi';
import {
  useCycles, useTomCardSummary, useTomCardTransactions,
  useTomCardMappings, useFileUpload, useReconciliation,
} from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, KpiCard,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn,
} from '../../components/diesel/DieselComponents';

// ── Known card distribution (from image) ─────────────────────────────────────
// One card per cluster; Pouma 2 uses TRADEX (card 5807) not TOTAL.
const CLUSTER_CARDS: { cluster: string; card_num: string; vendor: string }[] = [
  { cluster: 'Bonaberi 1', card_num: '84948',  vendor: 'TOTAL'  },
  { cluster: 'Bonaberi 2', card_num: '84950',  vendor: 'TOTAL'  },
  { cluster: 'Edea',       card_num: '84953',  vendor: 'TOTAL'  },
  { cluster: 'Kotto',      card_num: '121720', vendor: 'TOTAL'  },
  { cluster: 'Ndogbong',   card_num: '84946',  vendor: 'TOTAL'  },
  { cluster: 'Pouma 1',    card_num: '84951',  vendor: 'TOTAL'  },
  { cluster: 'Pouma 2',    card_num: '5807',   vendor: 'TRADEX' },
];

const ALL_CLUSTERS = CLUSTER_CARDS.map(c => c.cluster);

const EMPTY_FORM = {
  card_num: '',
  card_label: '',
  cluster: '',
  site_id: '',
  truck_plate: '',
  driver_name: '',
};

export default function TomCardPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: summary,  loading: summaryLoading,  refetch: refetchSummary }  = useTomCardSummary(selectedKey);
  const { data: txns,     loading: txnsLoading,     refetch: refetchTxns }     = useTomCardTransactions({ cycle_key: selectedKey, limit: 200 });
  const { data: mappings, loading: mappingsLoading, refetch: refetchMappings } = useTomCardMappings();
  const { data: recon }   = useReconciliation(selectedKey, { limit: 300 });

  const { uploading, result, error, upload, reset } = useFileUpload();
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Sites for the selected cluster (from reconciliation data) ────────────
  const sitesInCluster = useMemo(() => {
    const rows: any[] = (recon as any)?.data || recon || [];
    if (!form.cluster) return rows;
    return rows.filter((r: any) => r.cluster === form.cluster);
  }, [recon, form.cluster]);

  // ── When cluster changes, pre-fill card_num and clear site ──────────────
  function handleClusterChange(cluster: string) {
    const match = CLUSTER_CARDS.find(c => c.cluster === cluster);
    setForm(f => ({
      ...f,
      cluster,
      site_id: '',
      card_num: match ? match.card_num : f.card_num,
      card_label: match ? `${match.vendor} ${match.card_num}` : f.card_label,
    }));
  }

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
      refetchMappings(); refetchTxns();
    } finally {
      setSaving(false);
    }
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
    } finally {
      setDownloading(false);
    }
  }

  if (cyclesLoading) return <Spinner />;

  const sum          = (summary as any) || {};
  const list: any[]  = (txns as any)?.data || txns || [];
  const maps: any[]  = (mappings as any)?.data || mappings || [];
  const unmappedCount = list.filter((t: any) => t.mapping_confidence === 'unlinked').length;

  // ── Coverage: cluster card totals vs field fuel ──────────────────────────
  const clusterTotals: Record<string, number> = {};
  list.forEach((t: any) => { if (t.cluster) clusterTotals[t.cluster] = (clusterTotals[t.cluster] || 0) + (t.quantity_l || 0); });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="💳 Tom Card Reconciliation"
        subtitle="Fuel purchase statements vs. field-recorded fuel added per cluster"
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
          <KpiCard label="Total Purchased (L)" value={fmtNum(sum.total_liters)}     icon="⛽" />
          <KpiCard label="Total Spent (CFA)"   value={fmtNum(sum.total_amount_cfa)} icon="💰" />
          <KpiCard label="Transactions"        value={sum.total_transactions || 0}  icon="🧾" />
          <KpiCard label="Active Cards"        value={sum.by_card?.length || 0}     icon="💳" />
          <KpiCard
            label="Unmapped Txns"
            value={unmappedCount}
            icon="❓"
            alert={unmappedCount > 0}
            color={unmappedCount > 0 ? '#dc2626' : '#1a1a2e'}
          />
        </div>
      )}

      {/* ── Card distribution reference ── */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0369a1' }}>
          📋 GRATO Card Distribution — one card per cluster, fuel bought in bulk and distributed across sites
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CLUSTER_CARDS.map(cc => (
            <span key={cc.cluster} style={{
              background: cc.vendor === 'TRADEX' ? '#fef3c7' : '#e0f2fe',
              border: `1px solid ${cc.vendor === 'TRADEX' ? '#fde68a' : '#7dd3fc'}`,
              borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500,
            }}>
              {cc.cluster}: <strong>#{cc.card_num}</strong> ({cc.vendor})
            </span>
          ))}
        </div>
      </div>

      {unmappedCount > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            ⚠️ {unmappedCount} transaction(s) are not linked to a cluster/site. Add a mapping below or
            upload a statement with a matching card number to auto-link.
          </p>
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
                {(result as any).data?.rows_imported} new transactions, {(result as any).data?.rows_duplicate || 0} duplicates skipped.
                Total: {fmtNum((result as any).data?.total_liters)} L
              </p>
            </div>
          )}
          {error && <div style={{ marginTop: 16 }}><ErrorBox message={error} /></div>}

          {/* By cluster totals */}
          {Object.keys(clusterTotals).length > 0 && (
            <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Purchased Liters by Cluster</h3>
              {Object.entries(clusterTotals).sort((a, b) => b[1] - a[1]).map(([cluster, liters]) => (
                <div key={cluster} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                  <span>{cluster}</span>
                  <strong>{fmtNum(liters)} L</strong>
                </div>
              ))}
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
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Cluster *</label>
                <select
                  value={form.cluster}
                  onChange={e => handleClusterChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select cluster…</option>
                  {ALL_CLUSTERS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Site dropdown — filtered by cluster */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>
                  Site (optional — leave blank to map card to whole cluster)
                </label>
                <select
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

              {/* Card number — auto-filled from cluster selection */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Card Number *</label>
                <input
                  placeholder="e.g. 84948"
                  value={form.card_num}
                  onChange={e => setForm(f => ({ ...f, card_num: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Card label */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Card Label</label>
                <input
                  placeholder="e.g. TOTAL 84948"
                  value={form.card_label}
                  onChange={e => setForm(f => ({ ...f, card_label: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Truck plate */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Truck Plate (optional)</label>
                <input
                  placeholder="e.g. LT 1234 A"
                  value={form.truck_plate}
                  onChange={e => setForm(f => ({ ...f, truck_plate: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Driver name */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Driver Name (optional)</label>
                <input
                  placeholder="Driver name"
                  value={form.driver_name}
                  onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Hint */}
              {form.cluster && (
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', background: '#eff6ff', padding: '6px 10px', borderRadius: 6 }}>
                  ℹ️ One purchase on card <strong>#{form.card_num}</strong> can refuel multiple {form.cluster} sites.
                  Linking sites individually lets the system split costs proportional to field fuel added.
                </p>
              )}

              <Btn size="sm" onClick={handleSaveMapping} disabled={!form.card_num || !form.cluster || saving} style={{ width: '100%' }}>
                {saving ? 'Saving…' : 'Save Mapping'}
              </Btn>
            </div>
          )}

          {mappingsLoading ? <Spinner size={24} /> : maps.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              No mappings yet. Card-to-site links let the reconciliation engine split bulk purchases
              across multiple sites in the same cluster.
            </p>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {maps.map((m: any) => (
                <div key={m._id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    #{m.card_num} {m.card_label ? `— ${m.card_label}` : ''}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    {m.cluster}{m.site_id ? ` › ${m.site_id}` : ' (cluster-wide)'}
                    {m.truck_plate ? ` · ${m.truck_plate}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Transactions table ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Transactions</h3>
        {txnsLoading ? <Spinner /> : list.length === 0 ? (
          <EmptyState icon="🧾" title="No transactions" desc="Upload a Tom Card statement to see transactions here" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Date', 'Card', 'Station', 'Reg.', 'Liters', 'CFA', 'Cluster', 'Site', 'Mapping'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((t: any) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px' }}>{fmtDate(t.date)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.card_num}</td>
                    <td style={{ padding: '8px 12px' }}>{t.station_name}</td>
                    <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{t.registration_num}</td>
                    <td style={{ padding: '8px 12px' }}>{fmtNum(t.quantity_l, 1)}</td>
                    <td style={{ padding: '8px 12px' }}>{fmtNum(t.amount_cfa)}</td>
                    <td style={{ padding: '8px 12px' }}>{t.cluster || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 11 }}>{t.site_id || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: t.mapping_confidence === 'mapped'        ? '#dcfce7'
                                  : t.mapping_confidence === 'station_match' ? '#fef9c3'
                                  : '#fee2e2',
                        color: t.mapping_confidence === 'mapped'             ? '#166534'
                             : t.mapping_confidence === 'station_match'      ? '#854d0e'
                             : '#991b1b',
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

// ── Shared styles ─────────────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb',
  borderRadius: 6, padding: '7px 10px', fontSize: 12, background: '#fff',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb',
  borderRadius: 6, padding: '7px 10px', fontSize: 12,
};











// /**
//  * TomCardPage.tsx
//  * Upload Tom Card statements, view transactions, manage card-to-cluster mappings.
//  */
// import React, { useState } from 'react';
// import { tomCardApi } from '../../api/dieselApi';
// import { useCycles, useTomCardSummary, useTomCardTransactions, useTomCardMappings, useFileUpload } from '../../hooks/useDiesel';
// import {
//   PageHeader, CycleSelector, UploadZone, KpiCard,
//   fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn,
// } from '../../components/diesel/DieselComponents';
// import { reportsApi } from '../../api/dieselApi';

// export default function TomCardPage() {
//   const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
//   const { data: summary,  loading: summaryLoading,  refetch: refetchSummary }  = useTomCardSummary(selectedKey);
//   const { data: txns,     loading: txnsLoading,     refetch: refetchTxns }     = useTomCardTransactions({ cycle_key: selectedKey, limit: 100 });
//   const { data: mappings, loading: mappingsLoading, refetch: refetchMappings } = useTomCardMappings();
//   const { uploading, result, error, upload, reset } = useFileUpload();
//   const [showMappingForm, setShowMappingForm] = useState(false);
//   const [form, setForm] = useState({ card_num: '', card_label: '', cluster: '', truck_plate: '', driver_name: '' });

//   async function handleFile(file: File) {
//     reset();
//     await upload(() => tomCardApi.upload(file, selectedKey));
//     refetchSummary(); refetchTxns();
//   }

//   async function handleSaveMapping() {
//     if (!form.card_num) return;
//     await tomCardApi.saveMapping(form);
//     setForm({ card_num: '', card_label: '', cluster: '', truck_plate: '', driver_name: '' });
//     setShowMappingForm(false);
//     refetchMappings(); refetchTxns();
//   }

//   if (cyclesLoading) return <Spinner />;
//   const sum  = (summary as any) || {};
//   const list = (txns as any)?.data || txns || [];
//   const maps = (mappings as any)?.data || mappings || [];
//   const unmappedCount = list.filter((t: any) => t.mapping_confidence === 'unlinked').length;

//   return (
//     <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
//       <PageHeader
//         title="💳 Tom Card Reconciliation"
//         subtitle="Fuel purchase statements vs. field-recorded fuel added"
//         actions={
//           <>
//             <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
//             <a href={reportsApi.downloadTomCard(selectedKey)} target="_blank" rel="noreferrer"><Btn size="sm">⬇️ Export</Btn></a>
//           </>
//         }
//       />

//       {/* ── KPIs ── */}
//       {summaryLoading ? <Spinner /> : (
//         <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
//           <KpiCard label="Total Purchased (L)" value={fmtNum(sum.total_liters)}     icon="⛽" />
//           <KpiCard label="Total Spent (CFA)"   value={fmtNum(sum.total_amount_cfa)} icon="💰" />
//           <KpiCard label="Transactions"        value={sum.total_transactions || 0}  icon="🧾" />
//           <KpiCard label="Active Cards"        value={sum.by_card?.length || 0}     icon="💳" />
//           <KpiCard label="Unmapped Txns" value={unmappedCount} icon="❓" alert={unmappedCount > 0} color={unmappedCount > 0 ? '#dc2626' : '#1a1a2e'} />
//         </div>
//       )}

//       {unmappedCount > 0 && (
//         <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
//           <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
//             ⚠️ {unmappedCount} transaction(s) are not linked to a specific cluster or site. Add a card mapping below to improve reconciliation accuracy.
//           </p>
//         </div>
//       )}

//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginBottom: 24 }}>
//         {/* ── Upload ── */}
//         <div>
//           <UploadZone accept=".csv,.xlsx" label="Upload Tom Card statement" onFile={handleFile} uploading={uploading} />
//           {result && (
//             <div style={{ marginTop: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
//               <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✅ Imported</p>
//               <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
//                 {(result as any).data?.rows_imported} new transactions, {(result as any).data?.rows_duplicate || 0} duplicates skipped.
//                 Total: {fmtNum((result as any).data?.total_liters)} L
//               </p>
//             </div>
//           )}
//           {error && <div style={{ marginTop: 16 }}><ErrorBox message={error} /></div>}

//           {/* By station */}
//           <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
//             <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>By Station</h3>
//             {(sum.by_station || []).map((s: any) => (
//               <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
//                 <span>{s._id}</span>
//                 <strong>{fmtNum(s.total_liters)} L</strong>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Card mappings ── */}
//         <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//             <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Card → Cluster Mapping</h3>
//             <Btn variant="ghost" size="sm" onClick={() => setShowMappingForm(v => !v)}>{showMappingForm ? 'Cancel' : '+ Add'}</Btn>
//           </div>

//           {showMappingForm && (
//             <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, marginBottom: 14 }}>
//               {['card_num', 'card_label', 'cluster', 'truck_plate', 'driver_name'].map(field => (
//                 <input key={field} placeholder={field.replace(/_/g, ' ')} value={(form as any)[field]}
//                   onChange={e => setForm({ ...form, [field]: e.target.value })}
//                   style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 6 }} />
//               ))}
//               <Btn size="sm" onClick={handleSaveMapping} style={{ width: '100%' }}>Save Mapping</Btn>
//             </div>
//           )}

//           {mappingsLoading ? <Spinner size={24} /> : maps.length === 0 ? (
//             <p style={{ fontSize: 12, color: '#9ca3af' }}>No mappings configured yet. Card-to-site data hasn't been provided — transactions are linked by station geography until mappings are added.</p>
//           ) : (
//             maps.map((m: any) => (
//               <div key={m._id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
//                 <p style={{ margin: 0, fontWeight: 600 }}>{m.card_num} — {m.card_label || '—'}</p>
//                 <p style={{ margin: 0, color: '#9ca3af' }}>{m.cluster} · {m.truck_plate}</p>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* ── Transactions table ── */}
//       <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
//         <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Transactions</h3>
//         {txnsLoading ? <Spinner /> : list.length === 0 ? (
//           <EmptyState icon="🧾" title="No transactions" desc="Upload a Tom Card statement to see transactions here" />
//         ) : (
//           <div style={{ overflowX: 'auto' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
//               <thead>
//                 <tr style={{ background: '#f9fafb' }}>
//                   {['Date', 'Card', 'Station', 'Reg.', 'Liters', 'CFA', 'Cluster', 'Mapping'].map(h => (
//                     <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {list.map((t: any) => (
//                   <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
//                     <td style={{ padding: '8px 12px' }}>{fmtDate(t.date)}</td>
//                     <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.card_num}</td>
//                     <td style={{ padding: '8px 12px' }}>{t.station_name}</td>
//                     <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{t.registration_num}</td>
//                     <td style={{ padding: '8px 12px' }}>{fmtNum(t.quantity_l, 1)}</td>
//                     <td style={{ padding: '8px 12px' }}>{fmtNum(t.amount_cfa)}</td>
//                     <td style={{ padding: '8px 12px' }}>{t.cluster || '—'}</td>
//                     <td style={{ padding: '8px 12px' }}>
//                       <span style={{
//                         fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
//                         background: t.mapping_confidence === 'mapped' ? '#dcfce7' : t.mapping_confidence === 'station_match' ? '#fef9c3' : '#fee2e2',
//                         color: t.mapping_confidence === 'mapped' ? '#166534' : t.mapping_confidence === 'station_match' ? '#854d0e' : '#991b1b',
//                       }}>{t.mapping_confidence}</span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
