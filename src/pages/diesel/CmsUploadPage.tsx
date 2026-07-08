/**
 * CmsUploadPage.tsx
 * Daily ERS/CMS CSV upload with history, missing-days tracker, and reprocess action.
 *
 * Changes from original:
 *  1. Two-panel guidance banner distinguishing CMS telemetry (this page) from
 *     GRATO Daily Report (different page) — GRATO panel is clickable.
 *  2. Client-side file name check: if the dropped file matches
 *     /GRATO|Daily.?Report|Global/i, shows the wrong-file warning immediately
 *     before the upload starts.
 *  3. Server-side "Wrong endpoint" error is also caught and surfaced the same way.
 *  4. UploadZone now accepts .csv and .xlsx.
 *  5. Import result panel updated to show rows_total / rows_imported / rows_skipped
 *     / error_count to match the new backend response shape.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cmsApi } from '../../api/dieselApi';
import { useCycles, useCmsUploads, useMissingDays, useFileUpload } from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, UploadZone, StatusPill, Btn,
  fmtDate, Spinner, ErrorBox, EmptyState,
} from '../../components/diesel/DieselComponents';

export default function CmsUploadPage() {
  const navigate = useNavigate();
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: uploads, loading: uploadsLoading, error: uploadsError, refetch: refetchUploads } = useCmsUploads(selectedKey);
  const { data: missing, loading: missingLoading, refetch: refetchMissing } = useMissingDays(selectedKey);
  const { uploading, result, error, upload, reset } = useFileUpload();
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [wrongFile, setWrongFile] = useState(false);

  async function handleFile(file: File) {
    reset();
    setWrongFile(false);

    // Client-side guard: warn immediately if filename looks like a GRATO file
    if (/GRATO|Daily.?Report|Global/i.test(file.name)) {
      setWrongFile(true);
      return;
    }

    if (!selectedKey) {
      alert('Please select a cycle before uploading.');
      return;
    }

    await upload(() => cmsApi.upload(file, selectedKey));
    refetchUploads();
    refetchMissing();
  }

  async function handleReprocess(uploadId: string) {
    setReprocessing(uploadId);
    try { await cmsApi.reprocess(uploadId); } finally { setReprocessing(null); }
  }

  if (cyclesLoading) return <Spinner />;

  const uploadList = (uploads as any) || [];
  const missingDays = (missing as any)?.missing_days || [];
  const importResult = (result as any)?.data;
  const apiError = error;

  // Surface wrong-endpoint error from the server too
  const isWrongEndpoint = wrongFile || apiError?.includes('Wrong endpoint');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="📡 CMS Daily Upload"
        subtitle="Upload the ERS extraction file once per day. Each file covers one day's telemetry for all sites."
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      {/* ── File type guidance banner ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
      }}>
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '12px 16px',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
            📡 This page: CMS/ERS Telemetry
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
            CSV export from the CMS/ERS monitoring system.<br />
            Contains: Gen RH per day, grid availability hours, fuel sensor level.
          </p>
        </div>
        <div
          onClick={() => navigate('/diesel/grato-upload')}
          style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#166534' }}>
            📋 GRATO Daily Report → different page ↗
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
            The GRATO Global Daily Report (.xlsx) goes to the <strong>GRATO Upload</strong> page,
            not here. Click to go there.
          </p>
        </div>
      </div>

      {/* ── Wrong file warning ── */}
      {isWrongEndpoint && (
        <div style={{
          background: '#fef9c3', border: '2px solid #fde68a',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#92400e' }}>
            ⚠️ Wrong file for this page
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#78350f' }}>
            This looks like the <strong>GRATO Global Daily Report</strong> (.xlsx).
            That file belongs on the GRATO Upload page — it contains daily maintenance
            visits by technicians, not CMS telemetry.
          </p>
          <Btn size="sm" onClick={() => navigate('/diesel/grato-upload')}>
            Go to GRATO Upload →
          </Btn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
        {/* ── Upload zone ── */}
        <div>
          <UploadZone
            accept=".csv,.xlsx"
            label="Upload today's CMS/ERS file"
            subLabel="Accepts .csv (preferred) or .xlsx CMS exports"
            onFile={handleFile}
            uploading={uploading}
          />

          {!isWrongEndpoint && apiError && (
            <div style={{ marginTop: 16 }}><ErrorBox message={apiError} /></div>
          )}

          {importResult && (
            <div style={{
              marginTop: 16, background: '#dcfce7', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>
                ✅ Import successful
              </p>
              <div style={{
                fontSize: 13, color: '#166534',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              }}>
                <span>Rows processed:</span><strong>{importResult.rows_total}</strong>
                <span>Imported:</span><strong>{importResult.rows_imported}</strong>
                <span>Skipped (dup):</span><strong>{importResult.rows_skipped}</strong>
                <span>Errors:</span>
                <strong style={{ color: importResult.error_count > 0 ? '#dc2626' : '#166534' }}>
                  {importResult.error_count}
                </strong>
              </div>
              {importResult.errors?.length > 0 && (
                <details style={{ marginTop: 8, fontSize: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#166534' }}>
                    {importResult.errors.length} row error(s)
                  </summary>
                  <ul style={{ margin: '6px 0 0 18px', color: '#166534' }}>
                    {importResult.errors.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Format guide */}
          <div style={{
            marginTop: 16, background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#6b7280',
          }}>
            <strong style={{ color: '#374151' }}>Expected CMS CSV columns:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Site ID (IHS_ID_SITE)</li>
              <li>Date (YYYY-MM-DD)</li>
              <li>Gen RH (hours generator ran that day)</li>
              <li>Grid Availability (hours grid was present)</li>
              <li>Fuel Level % (sensor reading)</li>
              <li>Fuel Consumed (L) — optional</li>
            </ul>
          </div>
        </div>

        {/* ── Missing days panel ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Missing Days This Cycle</h3>
          {missingLoading ? <Spinner size={24} /> : missingDays.length === 0 ? (
            <p style={{ color: '#16a34a', fontSize: 13 }}>✅ All days covered so far</p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>
                {missingDays.length} day(s) with no CMS data:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {missingDays.map((d: string) => (
                  <span key={d} style={{
                    background: '#fee2e2', color: '#991b1b',
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  }}>
                    {new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Upload history ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Upload History</h3>
        {uploadsError && <ErrorBox message={uploadsError} onRetry={refetchUploads} />}
        {uploadsLoading ? <Spinner /> : uploadList.length === 0 ? (
          <EmptyState icon="📭" title="No uploads yet" desc="Upload your first daily CMS file above" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Date', 'Filename', 'Status', 'Sites', 'Skipped', 'Uploaded By', 'When', ''].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uploadList.map((u: any) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{fmtDate(u.data_date)}</td>
                  <td style={{
                    padding: '9px 12px', color: '#6b7280',
                    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{u.filename}</td>
                  <td style={{ padding: '9px 12px' }}><StatusPill status={u.status} /></td>
                  <td style={{ padding: '9px 12px' }}>{u.sites_processed} / {u.sites_in_file}</td>
                  <td style={{ padding: '9px 12px' }}>{u.sites_skipped || 0}</td>
                  <td style={{ padding: '9px 12px', color: '#6b7280' }}>{u.uploaded_by?.fullName || '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <Btn
                      variant="ghost"
                      size="sm"
                      disabled={reprocessing === u._id}
                      onClick={() => handleReprocess(u._id)}
                    >
                      {reprocessing === u._id ? '⏳' : '🔄 Reprocess'}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}




