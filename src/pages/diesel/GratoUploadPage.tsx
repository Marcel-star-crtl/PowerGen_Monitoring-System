/**
 * GratoUploadPage_v2.tsx
 * 
 * Replaces the old GratoUploadPage. Now handles both:
 *   - GRATO Global Daily Report (multi-site Excel with 880 rows)
 *   - Individual GRATO visit sheets (per-cycle per-site)
 *
 * Shows:
 *   1. Upload zone with auto-detect
 *   2. Post-upload statistics: visits by technician, cluster, day
 *   3. Missing GRATO sites for the selected cycle
 */
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts';
import { gratoApi } from '../../api/dieselApi';
import {
  useCycles, useFileUpload, useMissingGrato,
} from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, KpiCard,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn,
} from '../../components/diesel/DieselComponents';

export default function GratoUploadPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: missingData, loading: missingLoading } = useMissingGrato(selectedKey);
  const { uploading, result, error, upload, reset } = useFileUpload();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'auto' | 'grato_daily_report' | 'grato_visit_sheet'>('auto');

  const missingSites: any[] = (missingData as any)?.data || missingData || [];

  async function handleFile(file: File) {
    reset();
    setStats(null);
    const res = await upload(() => gratoApi.upload(file, selectedKey, uploadType));
    // After upload, fetch stats
    if (res) {
      setStatsLoading(true);
      try {
        const statsRes = await gratoApi.getStats(selectedKey);
        setStats(statsRes.data);
      } catch (_) {}
      setStatsLoading(false);
    }
  }

  async function loadStats() {
    if (!selectedKey) return;
    setStatsLoading(true);
    try {
      const statsRes = await gratoApi.getStats(selectedKey);
      setStats(statsRes.data);
    } catch (_) {}
    setStatsLoading(false);
  }

  if (cyclesLoading) return <Spinner />;

  const importResult = (result as any)?.data;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="📋 GRATO Upload"
        subtitle="Upload GRATO Global Daily Report or individual site visit sheets"
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            {selectedKey && (
              <Btn size="sm" variant="ghost" onClick={loadStats}>
                📊 Refresh Stats
              </Btn>
            )}
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, marginBottom: 28 }}>
        {/* ── Upload panel ── */}
        <div>
          {/* File type selector */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#374151' }}>File Format</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { v: 'auto',               label: '🔍 Auto-detect (recommended)' },
                { v: 'grato_daily_report', label: '📊 GRATO Global Daily Report (multi-site)' },
                { v: 'grato_visit_sheet',  label: '📄 GRATO Visit Sheet (single cycle)' },
              ].map(opt => (
                <label key={opt.v} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="upload_type" value={opt.v}
                    checked={uploadType === opt.v}
                    onChange={() => setUploadType(opt.v as any)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <UploadZone
            accept=".xlsx,.xls,.csv"
            label="Drop GRATO Excel file here or click to browse"
            onFile={handleFile}
            uploading={uploading}
          />

          {/* Info box */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
            <strong>GRATO Global Daily Report</strong> — Each row is one maintenance visit
            by one technician. The importer will:<br />
            • Link records to the technician's maintenance history<br />
            • Update generator info on site if serial number changed<br />
            • Use <strong>CPH 1</strong> (actual measured) — not the contractual CPH<br />
            • Derive fuel added = Qté Laissée − Qté Trouvée<br />
            • Treat Run Hours G1 as the inter-visit RH delta
          </div>

          {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

          {importResult && (
            <div style={{
              marginTop: 14, background: '#dcfce7', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✅ Import Complete</p>
              <div style={{ fontSize: 12, color: '#166534', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span>Rows processed:</span><strong>{importResult.rows_total}</strong>
                <span>Imported:</span><strong>{importResult.rows_imported}</strong>
                <span>Skipped (dup):</span><strong>{importResult.rows_skipped}</strong>
                <span>Technician links:</span><strong>{importResult.technician_links}</strong>
                <span>Errors:</span>
                <strong style={{ color: importResult.error_count > 0 ? '#dc2626' : '#166534' }}>
                  {importResult.error_count}
                </strong>
              </div>
              {importResult.errors?.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, cursor: 'pointer' }}>Show errors</summary>
                  {importResult.errors.map((e: any, i: number) => (
                    <p key={i} style={{ fontSize: 11, color: '#7f1d1d', margin: '2px 0' }}>
                      {e.site} / {e.date}: {e.error}
                    </p>
                  ))}
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Missing GRATO ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              ⚠️ Sites Missing GRATO Submission
            </h3>
            <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              {missingSites.length}
            </span>
          </div>
          {missingLoading ? <Spinner size={24} /> : missingSites.length === 0 ? (
            <EmptyState icon="✅" title="All sites submitted" desc="No missing GRATO records for this cycle" />
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Site ID', 'Site Name', 'Cluster', 'Last Visit'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {missingSites.map((s: any) => (
                    <tr key={s.site_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: '#dc2626' }}>{s.site_id}</td>
                      <td style={{ padding: '6px 10px' }}>{s.site_name}</td>
                      <td style={{ padding: '6px 10px', color: '#6b7280' }}>{s.cluster}</td>
                      <td style={{ padding: '6px 10px', color: '#9ca3af' }}>{s.last_visit ? fmtDate(s.last_visit) : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Statistics (shown after upload or on manual refresh) ── */}
      {statsLoading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>}

      {stats && !statsLoading && (
        <>
          {/* KPI row */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="Total Visits" value={stats.totals?.total_visits || 0} icon="🔧" />
            <KpiCard label="Total Fuel Added (L)" value={fmtNum(stats.totals?.total_fuel_added)} icon="⛽" />
            <KpiCard label="Total Consumed (L)" value={fmtNum(stats.totals?.total_fuel_consumed)} icon="🔥" />
            <KpiCard label="Technicians" value={stats.by_technician?.length || 0} icon="👷" />
            <KpiCard label="Clusters" value={stats.by_cluster?.length || 0} icon="📍" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Visits by technician */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Visits by Technician</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.by_technician || []} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="technician_name" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="pm_visits"  fill="#2563eb" name="PM"  radius={[0,4,4,0]} stackId="a" />
                  <Bar dataKey="rf_visits"  fill="#16a34a" name="RF"  radius={[0,4,4,0]} stackId="a" />
                  <Bar dataKey="end_visits" fill="#f59e0b" name="END" radius={[0,4,4,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Visits by cluster */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Fuel Added by Cluster (L)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.by_cluster || []} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="cluster" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmtNum(v) + ' L'} />
                  <Bar dataKey="total_fuel_added"    fill="#2563eb" name="Added (L)"    radius={[4,4,0,0]} />
                  <Bar dataKey="total_fuel_consumed" fill="#dc2626" name="Consumed (L)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily visits chart */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Daily Visit Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.by_day || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="visits" stroke="#2563eb" name="Visits" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-site table */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Per-Site Summary</h3>
            <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
                  <tr>
                    {['Site', 'Visits', 'Last Visit', 'Last Tech', 'Type', 'Fuel Added (L)', 'Consumed (L)', 'RH', 'CPH Act.', 'DG Issues', 'Last Gen'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats.by_site || []).map((s: any) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11 }}>{s._id}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{s.visit_count}</td>
                      <td style={{ padding: '6px 10px', color: '#6b7280', fontSize: 11 }}>{fmtDate(s.last_visit)}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11 }}>{s.last_technician}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 8,
                          background: s.last_visit_type?.includes('PM') ? '#dbeafe' : s.last_visit_type?.includes('RF') ? '#dcfce7' : '#fef3c7',
                          color: s.last_visit_type?.includes('PM') ? '#1e40af' : s.last_visit_type?.includes('RF') ? '#166534' : '#92400e',
                        }}>
                          {s.last_visit_type}
                        </span>
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtNum(s.total_fuel_added, 1)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtNum(s.total_fuel_consumed, 1)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtNum(s.total_run_hours, 0)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#6b7280' }}>
                        {s.last_cph ? s.last_cph.toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        {s.has_dg_issues > 0 ? (
                          <span style={{ color: '#dc2626', fontSize: 11 }}>⚠️ {s.has_dg_issues}</span>
                        ) : <span style={{ color: '#16a34a', fontSize: 11 }}>✓</span>}
                      </td>
                      <td style={{ padding: '6px 10px', fontSize: 11, color: '#6b7280' }}>
                        {s.last_gen_brand} {s.last_gen_serial ? `(${s.last_gen_serial.slice(0, 8)}…)` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}












// /**
//  * GratoUploadPage.tsx
//  * Upload GRATO Main Excel (per cycle) and Book11 Budget Excel (cycle start).
//  */
// import React, { useState } from 'react';
// import { gratoApi } from '../../api/dieselApi';
// import { useCycles, useGratoUploads, useMissingGrato, useFileUpload } from '../../hooks/useDiesel';
// import {
//   PageHeader, CycleSelector, UploadZone, StatusPill,
//   fmtDate, fmtNum, Spinner, ErrorBox, EmptyState, Btn,
// } from '../../components/diesel/DieselComponents';

// export default function GratoUploadPage() {
//   const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
//   const { data: uploads, loading: uploadsLoading, refetch: refetchUploads } = useGratoUploads(selectedKey);
//   const { data: missing, loading: missingLoading, refetch: refetchMissing } = useMissingGrato(selectedKey);
//   const mainUpload    = useFileUpload();
//   const budgetUpload   = useFileUpload();
//   const [tab, setTab] = useState<'main' | 'budget'>('main');

//   async function handleMainFile(file: File) {
//     mainUpload.reset();
//     await mainUpload.upload(() => gratoApi.uploadMain(file, selectedKey));
//     refetchUploads(); refetchMissing();
//   }

//   async function handleBudgetFile(file: File) {
//     budgetUpload.reset();
//     await budgetUpload.upload(() => gratoApi.uploadBook11(file, selectedKey));
//     refetchUploads();
//   }

//   if (cyclesLoading) return <Spinner />;
//   const uploadList    = (uploads as any)?.data || [];
//   const missingSites  = (missing as any)?.sites || [];
//   const missingCount  = (missing as any)?.missing_count || 0;

//   return (
//     <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
//       <PageHeader
//         title="📋 GRATO Field Data Upload"
//         subtitle="Upload technician field visit data (Main sheet) and cycle budget parameters (Book11)."
//         actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
//       />

//       {/* ── Tabs ── */}
//       <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
//         {(['main', 'budget'] as const).map(t => (
//           <button key={t} onClick={() => setTab(t)}
//             style={{
//               padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
//               fontSize: 13, fontWeight: 600, color: tab === t ? '#1a1a2e' : '#9ca3af',
//               borderBottom: tab === t ? '2px solid #1a1a2e' : '2px solid transparent',
//             }}>
//             {t === 'main' ? '📝 Field Visits (Main)' : '💰 Budget (Book11)'}
//           </button>
//         ))}
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
//         <div>
//           {tab === 'main' ? (
//             <>
//               <UploadZone accept=".xlsx,.xls" label="Upload GRATO Main Excel sheet" onFile={handleMainFile} uploading={mainUpload.uploading} />
//               {mainUpload.result && (
//                 <div style={{ marginTop: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
//                   <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✅ Import successful</p>
//                   <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
//                     {(mainUpload.result as any).data?.rows_imported} visits imported.
//                     {(mainUpload.result as any).data?.faulty_meters > 0 && (
//                       <span style={{ color: '#92400e' }}> ⚠️ {(mainUpload.result as any).data.faulty_meters} faulty meters detected — CMS fallback will be used.</span>
//                     )}
//                   </p>
//                 </div>
//               )}
//               {mainUpload.error && <div style={{ marginTop: 16 }}><ErrorBox message={mainUpload.error} /></div>}
//             </>
//           ) : (
//             <>
//               <UploadZone accept=".xlsx,.xls" label="Upload Book11 Budget Excel sheet" onFile={handleBudgetFile} uploading={budgetUpload.uploading} />
//               <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>This sets CCPH, KVA, and budgeted RH for cycle <strong>{selectedKey}</strong>. Upload once at the start of each cycle.</p>
//               {budgetUpload.result && (
//                 <div style={{ marginTop: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
//                   <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✅ Budget imported</p>
//                   <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>{(budgetUpload.result as any).data?.sites_imported} site budgets set for {(budgetUpload.result as any).data?.cycle_key}.</p>
//                 </div>
//               )}
//               {budgetUpload.error && <div style={{ marginTop: 16 }}><ErrorBox message={budgetUpload.error} /></div>}
//             </>
//           )}
//         </div>

//         {/* ── Missing GRATO panel ── */}
//         <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
//           <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Sites Missing Field Data</h3>
//           {missingLoading ? <Spinner size={24} /> : missingCount === 0 ? (
//             <p style={{ color: '#16a34a', fontSize: 13 }}>✅ All budgeted sites have a visit</p>
//           ) : (
//             <>
//               <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{missingCount} site(s) with no GRATO visit this cycle:</p>
//               <div style={{ maxHeight: 240, overflowY: 'auto' }}>
//                 {missingSites.slice(0, 30).map((s: any) => (
//                   <div key={s.site_id} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
//                     <p style={{ margin: 0, fontWeight: 600 }}>{s.site_id}</p>
//                     <p style={{ margin: 0, color: '#9ca3af' }}>{s.site_name} · {s.cluster}</p>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* ── Upload history ── */}
//       <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
//         <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Upload History</h3>
//         {uploadsLoading ? <Spinner /> : uploadList.length === 0 ? (
//           <EmptyState icon="📭" title="No uploads yet" />
//         ) : (
//           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
//             <thead>
//               <tr style={{ background: '#f9fafb' }}>
//                 {['Sheet', 'Filename', 'Status', 'Rows', 'Faulty Meters', 'Fuel Added', 'When'].map(h => (
//                   <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {uploadList.map((u: any) => (
//                 <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
//                   <td style={{ padding: '9px 12px', fontWeight: 600 }}>{u.sheet}</td>
//                   <td style={{ padding: '9px 12px', color: '#6b7280' }}>{u.original_filename || u.filename}</td>
//                   <td style={{ padding: '9px 12px' }}><StatusPill status={u.status} /></td>
//                   <td style={{ padding: '9px 12px' }}>{u.rows_imported} / {u.rows_in_file}</td>
//                   <td style={{ padding: '9px 12px' }}>{u.faulty_meters > 0 ? <span style={{ color: '#d97706', fontWeight: 600 }}>{u.faulty_meters}</span> : '0'}</td>
//                   <td style={{ padding: '9px 12px' }}>{u.total_fuel_added ? `${fmtNum(u.total_fuel_added)} L` : '—'}</td>
//                   <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }
