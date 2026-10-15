/**
 * SiteBudgetUploadPage.tsx
 *
 * Upload page for the Book11 Budget file (see siteBudgetImportService.js
 * on the backend for the full parsing contract).
 *
 * Key difference from GratoUploadPage.tsx / ValidationUploadPage.tsx /
 * CmsUploadPage.tsx: this file has NO per-row date column, so the cycle
 * cannot be derived from the file itself — the cycle selector here is
 * MANDATORY (upload is disabled until one is chosen), not just a display
 * filter like on the other upload pages.
 *
 * Also includes an inline-editable table so a diesel manager can correct
 * a single site's CCPH/KVA/budgeted RH without re-uploading the whole
 * Book11 file — backed by the PATCH /site-budget/:cycle_key/:site_id route.
 *
 * Visual conventions intentionally match ValidationUploadPage.tsx /
 * GratoUploadPage.tsx / CmsUploadPage.tsx exactly.
 */
import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { siteBudgetApi } from '../../api/dieselApi';
import {
  useCycles, useFileUpload, useSiteBudgets, useSiteBudgetUploads,
} from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, Card, SectionLabel,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';
import { neutral, status as statusTokens, font } from '../../styles/dieselTokens';

export default function SiteBudgetUploadPage() {
  const { isNarrow } = useBreakpoint();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { uploading, result, error, upload, reset } = useFileUpload();
  const { data: uploads, loading: uploadsLoading, refetch: refetchUploads } = useSiteBudgetUploads();
  const { data: budgets, loading: budgetsLoading, refetch: refetchBudgets } = useSiteBudgets(selectedKey);

  const [search, setSearch] = useState('');
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const importResult = (result as any)?.data;
  const uploadList = (uploads as any) || [];
  const budgetList: any[] = (budgets as any) || [];

  const filteredBudgets = useMemo(() => {
    if (!search.trim()) return budgetList;
    const q = search.trim().toLowerCase();
    return budgetList.filter((b: any) =>
      b.site_id?.toLowerCase().includes(q) || b.site_name?.toLowerCase().includes(q)
    );
  }, [budgetList, search]);

  async function handleFile(file: File) {
    reset();
    if (!selectedKey) {
      alert('Please select a cycle before uploading — this file has no date the cycle can be detected from.');
      return;
    }
    await upload(() =>
      import('@/api/dieselApi').then(({ default: api }) =>
        api.post('/site-budget-upload', (() => {
          const form = new FormData();
          form.append('file', file);
          form.append('cycle_key', selectedKey);
          return form;
        })(), { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(r => r.data)
      )
    );
    refetchUploads();
    refetchBudgets();
  }

  function startEdit(b: any) {
    setEditingSite(b.site_id);
    setEditValues({
      dg_kva: String(b.dg_kva ?? ''),
      ccph: String(b.ccph ?? ''),
      budgeted_rh: String(b.budgeted_rh ?? ''),
      budget_liters: String(b.budget_liters ?? ''),
    });
  }

  async function saveEdit() {
    if (!editingSite || !selectedKey) return;
    setSaving(true);
    try {
      const payload: Record<string, number> = {};
      for (const [k, v] of Object.entries(editValues)) {
        const n = parseFloat(v);
        if (!isNaN(n)) payload[k] = n;
      }
      await siteBudgetApi.update(selectedKey, editingSite, payload);
      setEditingSite(null);
      refetchBudgets();
    } catch (e: any) {
      alert(`Failed to save: ${e?.response?.data?.error || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (cyclesLoading) return <Spinner />;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="💰 Site Budget Upload"
        subtitle="Upload the Book11 Budget file at the start of each cycle — sets each site's contractual CCPH, KVA, and budgeted run hours."
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '420px 1fr', gap: 24, marginBottom: 28 }}>
        {/* ── Upload panel ── */}
        <div>
          {!selectedKey && (
            <div style={{
              background: statusTokens.warning.bg, border: `2px solid ${statusTokens.warning.border}`, borderRadius: 10,
              padding: '12px 16px', marginBottom: 12, fontSize: 12, color: statusTokens.warning.text,
            }}>
              ⚠️ <strong>Select a cycle above before uploading.</strong> The Book11 file has no
              date column the cycle can be detected from — you must choose it explicitly.
            </div>
          )}

          <UploadZone
            accept=".xlsx,.xls"
            label="Drop the Book11 Budget file here or click to browse"
            subLabel={selectedKey ? `Will be filed under cycle ${selectedKey}` : 'Select a cycle first'}
            onFile={handleFile}
            uploading={uploading}
          />

          <div style={{ background: statusTokens.info.bg, border: `1px solid ${statusTokens.info.border}`, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: statusTokens.info.text, lineHeight: 1.6 }}>
            <strong>What this upload does:</strong><br />
            • Sets <strong>CCPH</strong> (Genset CPH) and <strong>KVA</strong> (Genset Capacity
            Mapped) for every site in the file, for the cycle you select<br />
            • Sets budgeted run hours, grid availability target, and diesel budget (litres)<br />
            • Re-uploading the same cycle <strong>updates</strong> existing sites rather than
            duplicating them
          </div>

          {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

          {importResult && (
            <div style={{
              marginTop: 14, background: statusTokens.success.bg, border: `1px solid ${statusTokens.success.border}`,
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: statusTokens.success.text, margin: '0 0 6px' }}>✅ Import Complete</p>
              <div style={{ fontSize: 12, color: statusTokens.success.text, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span>Rows processed:</span><strong>{importResult.rows_total}</strong>
                <span>New sites:</span><strong>{importResult.rows_imported}</strong>
                <span>Updated sites:</span><strong>{importResult.rows_updated}</strong>
                <span>Skipped:</span><strong>{importResult.rows_skipped}</strong>
                <span>Cycle:</span><strong>{importResult.cycle_key}</strong>
                <span>Total Budget (L):</span><strong>{(importResult.summary?.total_budget_liters || 0).toLocaleString()} L</strong>
                <span>Total Budget (XAF):</span><strong>XAF {(importResult.summary?.total_budget_xaf || 0).toLocaleString()}</strong>
              </div>

              {importResult.warnings?.length > 0 && (
                <div style={{ marginTop: 10, background: statusTokens.warning.bg, border: `1px solid ${statusTokens.warning.border}`, borderRadius: 8, padding: '8px 10px' }}>
                  {importResult.warnings.map((w: string, i: number) => (
                    <p key={i} style={{ fontSize: 11, color: statusTokens.warning.text, margin: '2px 0' }}>⚠️ {w}</p>
                  ))}
                </div>
              )}

              {importResult.errors?.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, cursor: 'pointer', color: statusTokens.success.text }}>
                    {importResult.errors.length} row error(s)
                  </summary>
                  {importResult.errors.map((e: any, i: number) => (
                    <p key={i} style={{ fontSize: 11, color: statusTokens.danger.text, margin: '2px 0' }}>
                      {typeof e === 'string' ? e : `${e.site}: ${e.error}`}
                    </p>
                  ))}
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Upload history ── */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionLabel style={{ marginBottom: 0 }}>Upload History</SectionLabel>
            <Btn size="sm" variant="ghost" onClick={refetchUploads}>↻ Refresh</Btn>
          </div>
          {uploadsLoading ? <Spinner size={24} /> : uploadList.length === 0 ? (
            <EmptyState icon="📭" title="No uploads yet" desc="Upload your first Book11 file above" />
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: neutral[50] }}>
                    {['Cycle', 'Filename', 'Status', 'New', 'Updated', 'Errors', 'Uploaded By', 'When'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: neutral[500], borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadList.map((u: any) => (
                    <tr key={u._id} style={{ borderBottom: `1px solid ${neutral[100]}`, cursor: 'pointer' }} onClick={() => setSelectedKey(u.cycle_key)}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>
                        {u.cycle_key}
                        {u.month_labels_detected && new Set(Object.values(u.month_labels_detected)).size > 1 && (
                          <span title="Header month labels disagreed in this file" style={{ marginLeft: 4 }}>⚠️</span>
                        )}
                      </td>
                      <td style={{ padding: '6px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.filename}</td>
                      <td style={{ padding: '6px 10px' }}><StatusPill status={u.status} /></td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.rows_imported}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.rows_updated}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: u.error_count > 0 ? statusTokens.danger.text : statusTokens.success.text }}>{u.error_count}</td>
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

      {/* ── Current cycle's budgets — view & inline edit ── */}
      {selectedKey && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              Site Budgets — {selectedKey}
              <span style={{ marginLeft: 8, background: neutral[100], color: neutral[700], borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                {budgetList.length}
              </span>
            </h3>
            <input
              type="text"
              placeholder="Search site ID or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search site budgets by ID or name"
              style={{ padding: '6px 10px', fontSize: 12, border: `1px solid ${neutral[200]}`, borderRadius: 6, width: 220 }}
            />
          </div>

          {budgetsLoading ? <Spinner /> : budgetList.length === 0 ? (
            <EmptyState icon="📋" title="No budgets for this cycle" desc="Upload a Book11 file above to populate this cycle" />
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: neutral[50] }}>
                  <tr>
                    {['Site', 'Cluster', 'Topology', 'KVA', 'CCPH (L/h)', 'Budgeted RH', 'Budget (L)', 'Grid Target', 'Fueling', ''].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, color: neutral[500], borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets.map((b: any) => {
                    const isEditing = editingSite === b.site_id;
                    return (
                      <tr key={b.site_id} style={{ borderBottom: `1px solid ${neutral[100]}`, background: isEditing ? statusTokens.info.bg : undefined }}>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600, fontSize: 11 }}>{b.site_id}</div>
                          <div style={{ color: neutral[400], fontSize: 10 }}>{b.site_name}</div>
                        </td>
                        <td style={{ padding: '6px 10px', color: neutral[500] }}>{b.cluster}</td>
                        <td style={{ padding: '6px 10px', color: neutral[500], fontSize: 11 }}>{b.topology}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input type="number" value={editValues.dg_kva}
                              onChange={(e) => setEditValues(v => ({ ...v, dg_kva: e.target.value }))}
                              aria-label={`DG KVA for ${b.site_id}`}
                              style={{ width: 60, fontSize: 11, padding: '2px 4px', border: `1px solid ${statusTokens.info.border}`, borderRadius: 4 }} />
                          ) : b.dg_kva}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input type="number" step="0.01" value={editValues.ccph}
                              onChange={(e) => setEditValues(v => ({ ...v, ccph: e.target.value }))}
                              aria-label={`CCPH for ${b.site_id}`}
                              style={{ width: 60, fontSize: 11, padding: '2px 4px', border: `1px solid ${statusTokens.info.border}`, borderRadius: 4 }} />
                          ) : b.ccph}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input type="number" value={editValues.budgeted_rh}
                              onChange={(e) => setEditValues(v => ({ ...v, budgeted_rh: e.target.value }))}
                              aria-label={`Budgeted run-hours for ${b.site_id}`}
                              style={{ width: 70, fontSize: 11, padding: '2px 4px', border: `1px solid ${statusTokens.info.border}`, borderRadius: 4 }} />
                          ) : fmtNum(b.budgeted_rh, 0)}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input type="number" value={editValues.budget_liters}
                              onChange={(e) => setEditValues(v => ({ ...v, budget_liters: e.target.value }))}
                              aria-label={`Budget liters for ${b.site_id}`}
                              style={{ width: 70, fontSize: 11, padding: '2px 4px', border: `1px solid ${statusTokens.info.border}`, borderRadius: 4 }} />
                          ) : fmtNum(b.budget_liters, 0)}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {b.final_grid_availability != null ? `${Math.round(b.final_grid_availability * 100)}%` : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          {b.is_fueling_site ? '✓' : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <>
                              <Btn size="sm" disabled={saving} onClick={saveEdit}>{saving ? '…' : 'Save'}</Btn>
                              <Btn size="sm" variant="ghost" disabled={saving} onClick={() => setEditingSite(null)}>Cancel</Btn>
                            </>
                          ) : (
                            <Btn size="sm" variant="ghost" onClick={() => startEdit(b)}>Edit</Btn>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}