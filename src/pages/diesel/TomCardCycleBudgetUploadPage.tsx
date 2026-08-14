/**
 * TomCardCycleBudgetUploadPage.tsx
 *
 * Upload page for the cycle-opening Tom Card budget/limit aggregate
 * (columns: New SBC, Cluster, Vendor, Card Number, New Card Number,
 * Diesel Budget (L), Diesel Budget Amount (XAF), Initial % Recharge
 * Amount, Actual Card Limit, New limit — see
 * tomCardCycleBudgetImportService.js on the backend).
 *
 * Key difference from other upload pages: this file has NO per-row date,
 * so the cycle cannot be derived from the file itself — the cycle
 * selector is MANDATORY (upload is disabled until one is chosen), same
 * reasoning as SiteBudgetUploadPage.tsx.
 *
 * Once uploaded, this data feeds GET /technician/fuel-purchases/cards/:cycle_key
 * — the mobile fuel-purchase form's card picker — automatically. No
 * separate "publish" step; uploading here is the whole workflow.
 */
import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { tomCardCycleBudgetApi } from '../../api/dieselApi';
import {
  useCycles, useFileUpload, useTomCardCycleBudget, useTomCardCycleBudgetUploads,
} from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, KpiCard,
  fmtNum, fmtDate, Spinner, ErrorBox, EmptyState, Btn, StatusPill,
} from '../../components/diesel/DieselComponents';

export default function TomCardCycleBudgetUploadPage() {
  const { isNarrow } = useBreakpoint();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { uploading, result, error, upload, reset } = useFileUpload();
  const { data: uploads, loading: uploadsLoading, refetch: refetchUploads } = useTomCardCycleBudgetUploads();
  const { data: cards, loading: cardsLoading, error: cardsError, refetch: refetchCards } = useTomCardCycleBudget(selectedKey);

  const importResult = (result as any)?.data;
  const uploadList = (uploads as any) || [];
  const cardList: any[] = (cards as any) || [];

  const totalBudgetLiters = cardList.reduce((s, c) => s + (c.budget_liters || 0), 0);
  const totalBudgetXaf = cardList.reduce((s, c) => s + (c.budget_xaf || 0), 0);
  const reissuedCount = cardList.filter(c => c.was_reissued).length;

  async function handleFile(file: File) {
    reset();
    if (!selectedKey) {
      alert('Please select a cycle before uploading.');
      return;
    }
    await upload(() => tomCardCycleBudgetApi.upload(file, selectedKey));
    refetchUploads();
    refetchCards();
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="💳 Tom Card Cycle Budget Upload"
        subtitle="Upload once at the start of every cycle. Feeds the mobile fuel-purchase card picker automatically — no separate publish step."
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '420px 1fr', gap: 24, marginBottom: 28 }}>
        {/* ── Upload panel ── */}
        <div>
          {!selectedKey && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
              Select a cycle above before uploading — this file has no per-row date to derive one from.
            </div>
          )}
          <UploadZone
            accept=".xlsx,.xls"
            label="Drop the Tom Card budget file here or click to browse"
            subLabel="Cluster, Card Number, New Card Number, Diesel Budget (L/XAF), Recharge %"
            onFile={handleFile}
            uploading={uploading}
          />

          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
            <strong>What this upload does:</strong><br />
            • Loads each cluster's card budget/limit for the cycle<br />
            • If a card was reissued (a "New Card Number" different from the old one), the
            <strong> new number becomes the active one</strong> shown to technicians<br />
            • The implied XAF/L rate (Budget XAF ÷ Budget L) is computed per card and
            pre-fills the price field in the mobile purchase form when that card is selected —
            more accurate than the flat 828 XAF/L fallback
          </div>

          {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

          {importResult && (
            <div style={{
              marginTop: 14, background: '#dcfce7', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 10px' }}>✅ Import Complete</p>
              <div style={{ fontSize: 13, color: '#166534', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span>Rows processed:</span><strong>{importResult.rows_total}</strong>
                <span>Cards loaded:</span><strong>{importResult.rows_imported}</strong>
                <span>Cards reissued this cycle:</span>
                <strong style={{ color: importResult.cards_reissued > 0 ? '#92400e' : '#166534' }}>
                  {importResult.cards_reissued}
                </strong>
              </div>
              {importResult.warnings?.length > 0 && (
                <details style={{ marginTop: 8, fontSize: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#166534' }}>
                    {importResult.warnings.length} warning(s)
                  </summary>
                  <ul style={{ margin: '6px 0 0 18px', color: '#166534' }}>
                    {importResult.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Upload history ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Upload History</h3>
            <Btn size="sm" variant="ghost" onClick={refetchUploads}>↻ Refresh</Btn>
          </div>
          {uploadsLoading ? <Spinner size={24} /> : uploadList.length === 0 ? (
            <EmptyState icon="📭" title="No uploads yet" desc="Upload the first cycle's Tom Card budget file above" />
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Cycle', 'Filename', 'Status', 'Cards', 'Reissued', 'Uploaded By', 'When'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadList.map((u: any) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => u.cycle_key && setSelectedKey(u.cycle_key)}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{u.cycle_key}</td>
                      <td style={{ padding: '6px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.filename}</td>
                      <td style={{ padding: '6px 10px' }}><StatusPill status={u.status} /></td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{u.rows_imported}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: u.cards_reissued > 0 ? '#92400e' : undefined }}>{u.cards_reissued || 0}</td>
                      <td style={{ padding: '6px 10px', color: '#6b7280' }}>{u.uploaded_by?.fullName || '—'}</td>
                      <td style={{ padding: '6px 10px', color: '#9ca3af', fontSize: 11 }}>{fmtDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Cards for the selected cycle ── */}
      {selectedKey && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Cards Loaded" value={cardList.length} icon="💳" />
            <KpiCard label="Total Budget (L)" value={fmtNum(totalBudgetLiters)} icon="⛽" />
            <KpiCard label="Total Budget (XAF)" value={fmtNum(totalBudgetXaf, 0)} icon="💰" />
            <KpiCard label="Reissued This Cycle" value={reissuedCount} color={reissuedCount > 0 ? '#d97706' : undefined} icon="🔁" />
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Cards — {selectedKey}</h3>
            {cardsError && <ErrorBox message={cardsError} onRetry={refetchCards} />}
            {cardsLoading ? <Spinner /> : cardList.length === 0 ? (
              <EmptyState icon="📭" title="No cards for this cycle" desc="Upload the Tom Card budget file above" />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Cluster', 'Vendor', 'Card Number', 'Budget (L)', 'Budget (XAF)', 'Implied XAF/L', 'Card Limit (XAF)', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cardList.map((c: any) => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.cluster}</td>
                        <td style={{ padding: '9px 12px', color: '#6b7280' }}>{c.vendor}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{c.card_number}</td>
                        <td style={{ padding: '9px 12px' }}>{fmtNum(c.budget_liters)} L</td>
                        <td style={{ padding: '9px 12px' }}>{fmtNum(c.budget_xaf, 0)}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{fmtNum(c.implied_xaf_per_liter, 0)}</td>
                        <td style={{ padding: '9px 12px' }}>{c.card_limit_xaf ? fmtNum(c.card_limit_xaf, 0) : '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {c.was_reissued && (
                            <span title={`Was card ${c.card_number_old}`} style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                              🔁 reissued
                            </span>
                          )}
                        </td>
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
  );
}
