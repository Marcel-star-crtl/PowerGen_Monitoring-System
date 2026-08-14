/**
 * TankLevelUploadPage.tsx
 * Daily tank-level telemetry upload — a distinct source/format from the
 * CMS/ERS upload (see CmsUploadPage.tsx and models/TankLevelReading.js).
 * The file's "Value" column is the site's current fuel level in liters,
 * exported daily from the RMS/telemetry system.
 */
import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { tankLevelApi } from '../../api/dieselApi';
import { useTankLevelUploads, useTankLevelReadings, useFileUpload } from '../../hooks/useDiesel';
import {
  PageHeader, UploadZone, StatusPill, Btn,
  fmtDate, fmtNum, Spinner, ErrorBox, EmptyState,
} from '../../components/diesel/DieselComponents';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TankLevelUploadPage() {
  const { isNarrow } = useBreakpoint();
  const [readingDate, setReadingDate] = useState(todayISO());
  const { data: uploads, loading: uploadsLoading, error: uploadsError, refetch: refetchUploads } = useTankLevelUploads({ limit: 15 });
  const { data: readings, loading: readingsLoading, error: readingsError, refetch: refetchReadings } = useTankLevelReadings({ reading_date: readingDate });
  const { uploading, result, error, upload, reset } = useFileUpload();

  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'sensor_error'>('all');

  async function handleFile(file: File) {
    reset();
    if (!readingDate) {
      alert('Please select the date this file represents before uploading.');
      return;
    }
    await upload(() => tankLevelApi.upload(file, readingDate));
    refetchUploads();
    refetchReadings();
  }

  const uploadList = (uploads as any) || [];
  const readingList = ((readings as any) || []).filter((r: any) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );
  const importResult = (result as any)?.data;
  const apiError = error;

  const okCount = ((readings as any) || []).filter((r: any) => r.status === 'ok').length;
  const errCount = ((readings as any) || []).filter((r: any) => r.status === 'sensor_error').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="🛢️ Daily Tank Level Upload"
        subtitle="Upload the daily tank-telemetry export. The 'Value' column is read as each site's current fuel level in liters — this becomes the live current level used across fuel planning, requests, and the mobile app."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="tank-level-reading-date" style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              Reading date:
            </label>
            <input
              id="tank-level-reading-date"
              type="date"
              value={readingDate}
              max={todayISO()}
              onChange={e => setReadingDate(e.target.value)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
            />
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 320px', gap: 24, marginBottom: 24 }}>
        {/* ── Upload zone ── */}
        <div>
          <UploadZone
            accept=".csv"
            label={`Upload tank levels for ${fmtDate(readingDate)}`}
            subLabel="Accepts the daily RMS/telemetry CSV export"
            onFile={handleFile}
            uploading={uploading}
          />

          {apiError && (
            <div style={{ marginTop: 16 }}><ErrorBox message={apiError} /></div>
          )}

          {importResult && (
            <div style={{
              marginTop: 16,
              background: importResult.sites_sensor_error > 0 ? '#fffbeb' : '#dcfce7',
              border: `1px solid ${importResult.sites_sensor_error > 0 ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>
                ✅ Import complete
              </p>
              <div style={{
                fontSize: 13, color: '#166534',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              }}>
                <span>Rows processed:</span><strong>{importResult.rows_total}</strong>
                <span>Sites updated:</span><strong>{importResult.sites_ok}</strong>
                <span>Sensor errors:</span>
                <strong style={{ color: importResult.sites_sensor_error > 0 ? '#dc2626' : '#166534' }}>
                  {importResult.sites_sensor_error}
                </strong>
                <span>Skipped (unknown site):</span><strong>{importResult.sites_skipped}</strong>
                <span>Current level refreshed:</span><strong>{importResult.sites_refreshed}</strong>
              </div>
              {importResult.warnings?.length > 0 && (
                <details style={{ marginTop: 8, fontSize: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#166534' }}>
                    {importResult.warnings.length} warning(s)
                  </summary>
                  <ul style={{ margin: '6px 0 0 18px', color: '#166534' }}>
                    {importResult.warnings.slice(0, 30).map((w: string, i: number) => <li key={i}>{w}</li>)}
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
            <strong style={{ color: '#374151' }}>Expected columns:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, lineHeight: 1.8 }}>
              <li>SiteName (IHS site ID)</li>
              <li>Component = "Fuel Tank"</li>
              <li>Location — only "Quant" rows are read as fuel level; "Cover" rows are sensor/status flags and are ignored</li>
              <li>Value — current fuel level in liters (a site with multiple tanks sums all its Quant readings)</li>
              <li>Column1 — reading timestamp</li>
            </ul>
            <p style={{ margin: '8px 0 0' }}>
              A value of <strong>-1</strong> (or any negative number) is treated as a sensor error, not a
              literal negative fuel level, and is excluded from the site's total.
            </p>
          </div>
        </div>

        {/* ── Day summary ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{fmtDate(readingDate)} Summary</h3>
          {readingsLoading ? <Spinner size={24} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>Sites with a reading</span>
                <strong>{okCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>Sensor errors</span>
                <strong style={{ color: errCount > 0 ? '#dc2626' : undefined }}>{errCount}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Readings table for the selected day ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Readings — {fmtDate(readingDate)}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'ok', 'sensor_error'] as const).map(s => (
              <Btn key={s} size="sm" variant={statusFilter === s ? 'primary' : 'secondary'} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s === 'ok' ? 'OK' : 'Sensor Error'}
              </Btn>
            ))}
          </div>
        </div>
        {readingsError && <ErrorBox message={readingsError} onRetry={refetchReadings} />}
        {readingsLoading ? <Spinner /> : readingList.length === 0 ? (
          <EmptyState icon="📭" title="No readings for this day" desc="Upload a file above, or pick a different date" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Site', 'Cluster', 'Fuel Level (L)', 'Tanks', 'Reading Time', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {readingList.map((r: any) => (
                <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{r.site_id}</td>
                  <td style={{ padding: '9px 12px', color: '#6b7280' }}>{r.cluster || '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    {r.status === 'ok' ? `${fmtNum(r.fuel_level_l)} L` : '—'}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#6b7280' }}>{r.tank_count}</td>
                  <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: 12 }}>
                    {r.reading_time ? new Date(r.reading_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <StatusPill status={r.status === 'ok' ? 'completed' : r.status === 'sensor_error' ? 'failed' : 'pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Upload history ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Upload History</h3>
        {uploadsError && <ErrorBox message={uploadsError} onRetry={refetchUploads} />}
        {uploadsLoading ? <Spinner /> : uploadList.length === 0 ? (
          <EmptyState icon="📭" title="No uploads yet" desc="Upload today's tank-level file above" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Reading Date', 'Filename', 'Status', 'OK', 'Sensor Errors', 'Skipped', 'Uploaded By', 'When'].map(h => (
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
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{fmtDate(u.reading_date)}</td>
                  <td style={{
                    padding: '9px 12px', color: '#6b7280',
                    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{u.filename}</td>
                  <td style={{ padding: '9px 12px' }}><StatusPill status={u.status} /></td>
                  <td style={{ padding: '9px 12px' }}>{u.sites_ok}</td>
                  <td style={{ padding: '9px 12px', color: u.sites_sensor_error > 0 ? '#dc2626' : undefined }}>{u.sites_sensor_error || 0}</td>
                  <td style={{ padding: '9px 12px' }}>{u.sites_skipped || 0}</td>
                  <td style={{ padding: '9px 12px', color: '#6b7280' }}>{u.uploaded_by?.fullName || '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
