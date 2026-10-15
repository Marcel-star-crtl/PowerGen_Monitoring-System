/**
 * ValidationUploadPage.tsx
 *
 * Upload page for the GRATO Validation Template file (.xlsx with "Main"
 * and "Validation" sheets — see validationImportService.js on the backend
 * for the full parsing contract).
 *
 * What this page is for, in plain terms:
 *   - The Validation sheet is the validated, monthly source of truth for
 *     each site's contractual consumption rate (Final DG CPH) and KVA
 *     (Final DG). Uploading this file updates SiteBudget for every site it
 *     covers, so the next reconciliation run uses the corrected numbers
 *     automatically — no other action needed.
 *   - The Main sheet's rows are per-visit records, imported the same way
 *     GRATO Daily Report rows are, with their own per-row CCPH and Access
 *     Ticket reference.
 *   - The two sheets are NOT guaranteed to belong to the same cycle — the
 *     backend derives each Validation row's cycle independently from its
 *     own date, so this page doesn't ask the person to pick a cycle before
 *     uploading; the file's own dates decide that.
 *
 * Visual conventions intentionally match GratoUploadPage.tsx /
 * CmsUploadPage.tsx exactly (same color tokens, same KpiCard/Spinner/
 * ErrorBox/Btn usage, same card/grid layout) so this reads as a native
 * sibling page in the existing diesel app rather than a new design.
 */
import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { validationApi } from '../../api/dieselApi';
import {
  useFileUpload, useValidationUploads, useValidationStats,
} from '../../hooks/useDiesel';
import {
  PageHeader, UploadZone, KpiCard, Card, SectionLabel,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';
import { neutral, ink, status as statusTokens, urgency as urgencyTokens, font } from '../../styles/dieselTokens';

export default function ValidationUploadPage() {
  const { isNarrow } = useBreakpoint();
  const { uploading, result, error, upload, reset } = useFileUpload();
  const { data: uploads, loading: uploadsLoading, refetch: refetchUploads } = useValidationUploads();

  // Once an upload completes, we know which cycle(s) it touched — default
  // the stats panel to the first one so the person sees results immediately
  // without picking anything.
  const [statsCycle, setStatsCycle] = useState<string>('');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useValidationStats(statsCycle);

  const importResult = (result as any)?.data;
  const uploadList = (uploads as any) || [];
  const statsData = (stats as any)?.data;

  async function handleFile(file: File) {
    reset();
    const res = await upload(() => validationApi.upload(file));
    refetchUploads();
    const cyclesTouched = (res as any)?.data?.validation?.cycles_touched || [];
    if (cyclesTouched.length > 0) {
      setStatsCycle(cyclesTouched[0]);
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="✅ GRATO Validation Upload"
        subtitle="Upload the monthly Validation Template — updates each site's contractual CPH and KVA from the validated figures, and imports the visit-level Main sheet."
      />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '420px 1fr', gap: 24, marginBottom: 28 }}>
        {/* ── Upload panel ── */}
        <div>
          <UploadZone
            accept=".xlsx,.xls"
            label="Drop the Validation Template here or click to browse"
            subLabel="Expects sheets named 'Main' and 'Validation'"
            onFile={handleFile}
            uploading={uploading}
          />

          {/* Info box — same blue-info convention as GratoUploadPage's box */}
          <div style={{ background: statusTokens.info.bg, border: `1px solid ${statusTokens.info.border}`, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: statusTokens.info.text, lineHeight: 1.6 }}>
            <strong>What this upload does:</strong><br />
            • <strong>Validation sheet</strong> → updates each site's contractual CPH and KVA
            (<strong>Final DG CPH</strong> / <strong>Final DG</strong>) for the cycle derived from
            that row's own date — used instead of the standard CPH lookup table<br />
            • <strong>Main sheet</strong> → imports per-visit records, same destination as the
            GRATO Daily Report, with each row's own CCPH and Access Ticket<br />
            • Meter readings marked <strong>FAULTY</strong> and CMS RH marked <strong>#N/A</strong> in
            the source file are recorded as missing, not zero
          </div>

          {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

          {importResult && (
            <div style={{
              marginTop: 14, background: statusTokens.success.bg, border: `1px solid ${statusTokens.success.border}`,
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: statusTokens.success.text, margin: '0 0 10px' }}>✅ Import Complete</p>

              <p style={{ fontSize: 11, fontWeight: 700, color: statusTokens.success.text, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Validation sheet
              </p>
              <div style={{ fontSize: 12, color: statusTokens.success.text, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
                <span>Rows processed:</span><strong>{importResult.validation.rows_total}</strong>
                <span>Imported:</span><strong>{importResult.validation.rows_imported}</strong>
                <span>Skipped (dup):</span><strong>{importResult.validation.rows_skipped}</strong>
                <span>Site budgets updated:</span><strong>{importResult.validation.site_budgets_updated}</strong>
                <span>Cycle(s) touched:</span><strong>{importResult.validation.cycles_touched?.join(', ') || '—'}</strong>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: statusTokens.success.text, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Main sheet
              </p>
              <div style={{ fontSize: 12, color: statusTokens.success.text, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span>Rows processed:</span><strong>{importResult.main.rows_total}</strong>
                <span>Imported:</span><strong>{importResult.main.rows_imported}</strong>
                <span>Skipped (dup):</span><strong>{importResult.main.rows_skipped}</strong>
                <span>Technician links:</span><strong>{importResult.main.technician_links}</strong>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: importResult.error_count > 0 ? statusTokens.danger.text : statusTokens.success.text }}>
                Errors: <strong>{importResult.error_count}</strong>
              </div>

              {importResult.errors?.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, cursor: 'pointer' }}>Show errors</summary>
                  {importResult.errors.map((e: string, i: number) => (
                    <p key={i} style={{ fontSize: 11, color: statusTokens.danger.text, margin: '2px 0' }}>{e}</p>
                  ))}
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Upload history ── */}
        <Card style={{ padding: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionLabel style={{ marginBottom: 0 }}>Upload History</SectionLabel>
            <Btn size="sm" variant="ghost" onClick={refetchUploads}>↻ Refresh</Btn>
          </div>
          {uploadsLoading ? <Spinner size={24} /> : uploadList.length === 0 ? (
            <EmptyState icon="📭" title="No uploads yet" desc="Upload your first Validation Template above" />
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: neutral[50] }}>
                    {['Filename', 'Status', 'Main Rows', 'Validation Rows', 'Budgets Updated', 'Cycles', 'Uploaded By', 'When'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: neutral[500], borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadList.map((u: any) => (
                    <tr
                      key={u._id}
                      style={{ borderBottom: `1px solid ${neutral[100]}`, cursor: u.validation_cycles_touched?.length ? 'pointer' : 'default' }}
                      onClick={() => u.validation_cycles_touched?.[0] && setStatsCycle(u.validation_cycles_touched[0])}
                    >
                      <td style={{ padding: '6px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.filename}</td>
                      <td style={{ padding: '6px 10px' }}><StatusPill status={u.status} /></td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.main_rows_imported}/{u.main_rows_total}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.validation_rows_imported}/{u.validation_rows_total}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.site_budgets_updated}</td>
                      <td style={{ padding: '6px 10px', color: neutral[500] }}>{(u.validation_cycles_touched || []).join(', ') || '—'}</td>
                      <td style={{ padding: '6px 10px', color: neutral[500] }}>{u.uploaded_by?.fullName || '—'}</td>
                      <td style={{ padding: '6px 10px', color: neutral[400], fontSize: 11 }}>{fmtDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Stats for the selected cycle ── */}
      {statsCycle && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: ink }}>Validation Summary — {statsCycle}</h2>
            <Btn size="sm" variant="ghost" onClick={refetchStats}>↻ Refresh</Btn>
          </div>

          {statsLoading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>}

          {statsData && !statsLoading && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
                <KpiCard label="Sites Validated" value={statsData.totals?.sites || 0} icon="📍" />
                <KpiCard label="Total Final RH" value={fmtNum(statsData.totals?.total_final_rh, 0)} icon="⏱️" />
                <KpiCard label="Total Final Consumption (L)" value={fmtNum(statsData.totals?.total_final_cons)} icon="⛽" />
                <KpiCard label="Total Management Amount" value={fmtNum(statsData.totals?.total_management_amount, 0)} icon="💰" />
                <KpiCard label="DG KVA Mismatches" value={statsData.totals?.dg_check_mismatches || 0} icon="⚠️"
                  tone={(statsData.totals?.dg_check_mismatches || 0) > 0 ? 'warn' : undefined} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* By cluster */}
                <Card>
                  <SectionLabel>Final Consumption by Cluster (L)</SectionLabel>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={statsData.by_cluster || []} margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                      <XAxis dataKey="cluster" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmtNum(v) + ' L'} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="total_final_cons" fill={urgencyTokens.medium.fg} name="Final Cons (L)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* DG KVA mismatches */}
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                    <SectionLabel style={{ marginBottom: 0 }}>DG KVA Mismatches</SectionLabel>
                    <span style={{ marginLeft: 8, background: statusTokens.danger.bg, color: statusTokens.danger.text, borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                      {statsData.dg_check_mismatches?.length || 0}
                    </span>
                  </div>
                  {(!statsData.dg_check_mismatches || statsData.dg_check_mismatches.length === 0) ? (
                    <EmptyState icon="✅" title="No mismatches" desc="SBC-recorded KVA matched the validated value for every site" />
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: neutral[50] }}>
                            {['Site', 'SBC KVA', 'Final KVA', 'Resolution'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: neutral[500], borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.dg_check_mismatches.map((m: any) => (
                            <tr key={m.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{m.site_id}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.sbc_dg_kva}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: urgencyTokens.critical.fg, fontVariantNumeric: 'tabular-nums' }}>{m.final_dg_kva}</td>
                              <td style={{ padding: '6px 10px', color: neutral[500], fontSize: 11 }}>{m.dg_comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              {/* CMS vs Field top variances */}
              <Card>
                <SectionLabel>Largest CMS vs Field RH Variances</SectionLabel>
                {(!statsData.cms_vs_field_top || statsData.cms_vs_field_top.length === 0) ? (
                  <EmptyState icon="✅" title="No variances" desc="CMS and field RH agreed for every validated site" />
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                        <tr>
                          {['Site', 'CMS RH', 'Final RH', 'Variance', 'Comment'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, color: neutral[500], borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.cms_vs_field_top.map((r: any) => (
                          <tr key={r.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11 }}>{r.site_id}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.cms_rh != null ? fmtNum(r.cms_rh) : '—'}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.final_rh)}</td>
                            <td style={{
                              padding: '6px 10px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                              color: Math.abs(r.cms_vs_field) > 50 ? urgencyTokens.critical.fg : neutral[700],
                            }}>{fmtNum(r.cms_vs_field)}</td>
                            <td style={{ padding: '6px 10px', color: neutral[500], fontSize: 11 }}>{r.cms_vs_field_comment || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}