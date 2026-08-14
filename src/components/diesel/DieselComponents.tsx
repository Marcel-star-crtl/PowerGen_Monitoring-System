/**
 * DieselComponents.tsx
 * Shared UI components used across all diesel pages.
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand, neutral, ink, status as statusTokens, urgency as urgencyTokens, type as typeScale, radius as radiusTokens } from '../../styles/dieselTokens';
import type { AlertSeverity, AlertType, CycleReconciliation, DieselAlert } from '../../types/diesel.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function fmtNum(v: number | null | undefined, dec = 0): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('en', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

export function fmtDate(s: string | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function varianceClass(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '';
  const abs = Math.abs(pct);
  if (abs <= 0.05) return 'var-ok';
  if (abs <= 0.15) return 'var-warn';
  return 'var-danger';
}

// ─── Severity colours ─────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<AlertSeverity, { bg: string; text: string; dot: string }> = {
  critical: { bg: statusTokens.danger.bg, text: statusTokens.danger.text, dot: urgencyTokens.critical.fg },
  high:     { bg: statusTokens.warning.bg, text: statusTokens.warning.text, dot: urgencyTokens.high.fg },
  medium:   { bg: statusTokens.info.bg, text: '#1e3a8a', dot: urgencyTokens.medium.fg },
  low:      { bg: neutral[100], text: neutral[700], dot: neutral[500] },
  info:     { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
};

const ALERT_ICONS: Partial<Record<AlertType, string>> = {
  LOW_FUEL:               '🪫',
  ZERO_GRID_24H:          '⚡',
  CONSUMPTION_OVER_CCPH:  '📈',
  REFUEL_MISMATCH_CMS:    '🔄',
  REFUEL_MISMATCH_TOMCARD:'💳',
  MISSING_GRATO:          '📋',
  MISSING_CMS:            '📡',
  FAULTY_METER:           '🔧',
  THEFT_SUSPECTED:        '🚨',
  RH_MISMATCH:            '📊',
  GENERATOR_MOVED:        '🔁',
  IMPORT_ERROR:           '❌',
  DATA_IMPORTED:          '✅',
};

// ─── CycleSelector ────────────────────────────────────────────────────────────
interface CycleSelectorProps {
  cycles: Array<{ cycle_key: string; label: string; status: string }>;
  value: string;
  onChange: (key: string) => void;
}
export function CycleSelector({ cycles, value, onChange }: CycleSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: neutral[500], fontWeight: 500 }}>Cycle:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Select billing cycle"
        style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, background: '#fff', cursor: 'pointer' }}
      >
        {cycles.map(c => (
          <option key={c.cycle_key} value={c.cycle_key}>
            {c.label} {c.status !== 'open' ? `(${c.status})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const s = SEVERITY_STYLE[severity] || SEVERITY_STYLE.info;
  return (
    <span style={{ background: s.bg, color: s.text, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {severity.toUpperCase()}
    </span>
  );
}

// ─── AlertCard ────────────────────────────────────────────────────────────────
interface AlertCardProps {
  alert: DieselAlert;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
  isAdmin?: boolean;
}
export function AlertCard({ alert, onAcknowledge, onResolve, onDismiss, compact, isAdmin }: AlertCardProps) {
  const [showResolve, setShowResolve] = useState(false);
  const [note, setNote] = useState('');
  const navigate = useNavigate();
  const icon = ALERT_ICONS[alert.alert_type] || '🔔';
  const canInvestigate = alert.alert_type === 'THEFT_SUSPECTED' && alert.site_id && alert.cycle_key;

  return (
    <div style={{ background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: compact ? '12px 16px' : '16px 20px', marginBottom: compact ? 8 : 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: SEVERITY_STYLE[alert.severity]?.bg || neutral[100], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</span>
            <SeverityBadge severity={alert.severity} />
            {alert.status !== 'open' && (
              <span style={{ fontSize: 11, color: neutral[500], background: neutral[100], padding: '1px 8px', borderRadius: 10 }}>{alert.status}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: neutral[600], margin: '0 0 6px', lineHeight: 1.5 }}>{alert.message}</p>
          {!compact && (
            <div style={{ display: 'flex', gap: 6, fontSize: 11, color: neutral[400], flexWrap: 'wrap' }}>
              {alert.site_id  && <span>Site: {alert.site_id}</span>}
              {alert.cluster  && <span>· {alert.cluster}</span>}
              {alert.cycle_key && <span>· Cycle: {alert.cycle_key}</span>}
              <span>· {fmtDate(alert.createdAt)}</span>
              {alert.email_sent && <span>· 📧 Email sent</span>}
            </div>
          )}
        </div>
        {alert.status === 'open' && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onAcknowledge && (
              <button onClick={() => onAcknowledge(alert._id)} style={btnStyle(statusTokens.info.bg, '#1e40af')}>Acknowledge</button>
            )}
            {onResolve && (
              <button onClick={() => setShowResolve(v => !v)} style={btnStyle(statusTokens.success.bg, statusTokens.success.text)}>Resolve</button>
            )}
            {onDismiss && isAdmin && (
              <button
                onClick={() => { if (window.confirm('Dismiss this alert? This hides it without resolving the underlying issue.')) onDismiss(alert._id); }}
                style={btnStyle(neutral[100], neutral[600])}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
        {canInvestigate && (
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/diesel/theft-investigation?site_id=${alert.site_id}&cycle_key=${alert.cycle_key}`)}
              style={btnStyle('#fef2f2', '#dc2626')}
            >
              🔍 Investigate
            </button>
          </div>
        )}
      </div>
      {showResolve && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Resolution note (required)…"
            aria-label="Resolution note"
            rows={2}
            style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowResolve(false)} style={btnStyle(neutral[100], neutral[700])}>Cancel</button>
            <button onClick={() => { if (note.trim()) { onResolve!(alert._id); setShowResolve(false); } }} style={btnStyle(statusTokens.success.bg, statusTokens.success.text)}>Confirm Resolve</button>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, color: string) {
  return { background: bg, color, border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties;
}

// ─── VarianceCell ─────────────────────────────────────────────────────────────
export function VarianceCell({ value, pct, invertColor }: { value: number | null; pct?: number | null; invertColor?: boolean }) {
  if (value === null || value === undefined) return <span style={{ color: neutral[400] }}>—</span>;
  const abs = Math.abs(pct ?? 0);
  let color: string = neutral[700];
  if (abs > 0.15) color = invertColor ? urgencyTokens.ok.fg : urgencyTokens.critical.fg;
  else if (abs > 0.05) color = urgencyTokens.high.fg;
  else color = invertColor ? urgencyTokens.critical.fg : urgencyTokens.ok.fg;
  return (
    <span style={{ color, fontWeight: abs > 0.05 ? 600 : 400 }}>
      {value > 0 ? '+' : ''}{fmtNum(value, 0)} L
      {pct !== null && pct !== undefined && <span style={{ fontSize: 11, marginLeft: 4 }}>({fmtPct(pct)})</span>}
    </span>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: string | number; sub?: string; color?: string; icon?: string; alert?: boolean }
export function KpiCard({ label, value, sub, color = ink, icon, alert }: KpiCardProps) {
  return (
    <div style={{ background: '#fff', border: alert ? '2px solid #dc2626' : `1px solid ${neutral[200]}`, borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: neutral[500], margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: neutral[400], margin: '4px 0 0' }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 24 }}>{icon}</span>}
      </div>
    </div>
  );
}

// ─── UploadZone ───────────────────────────────────────────────────────────────
interface UploadZoneProps {
  accept: string;
  label: string;
  subLabel?: string;
  onFile: (f: File) => void;
  uploading?: boolean;
  children?: React.ReactNode;
}
export function UploadZone({ accept, label, subLabel, onFile, uploading, children }: UploadZoneProps) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ref.current?.click(); } }}
      style={{
        border: `2px dashed ${drag ? urgencyTokens.medium.fg : neutral[200]}`,
        borderRadius: 12, padding: '32px 24px', textAlign: 'center',
        background: drag ? '#eff6ff' : '#fafafa', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <input ref={ref} type="file" accept={accept} aria-hidden="true" tabIndex={-1} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <div style={{ fontSize: 32, marginBottom: 8 }}>{uploading ? '⏳' : '📂'}</div>
      <p style={{ fontWeight: 600, margin: '0 0 4px', color: neutral[700] }}>{uploading ? 'Uploading…' : label}</p>
      <p style={{ fontSize: 12, color: neutral[400], margin: 0 }}>Drag & drop or click to browse</p>
      {subLabel && <p style={{ fontSize: 11, color: neutral[400], margin: '4px 0 0' }}>{subLabel}</p>}
      {children}
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    completed:  statusTokens.success,
    ok:         statusTokens.success,
    open:       statusTokens.danger,
    over:       statusTokens.danger,
    failed:     statusTokens.danger,
    processing: statusTokens.info,
    pending:    statusTokens.warning,
    under:      statusTokens.warning,
    partial:    statusTokens.warning,
    unknown:    statusTokens.neutral,
    resolved:   statusTokens.neutral,
  };
  const { bg, text: color } = map[status?.toLowerCase()] || statusTokens.neutral;
  return <span style={{ background: bg, color, padding: '2px 10px', borderRadius: radiusTokens.pill, fontSize: typeScale.small - 1, fontWeight: 600 }}>{status}</span>;
}

// ─── SiteDetailDrawer ─────────────────────────────────────────────────────────
interface DrawerProps {
  recon: CycleReconciliation | null;
  onClose: () => void;
  /** Only pass true when the current user's role matches the backend's
   *  admin-only guard on PATCH /:cycle_key/site/:site_id/override — showing
   *  the review form to someone who'll just get a 403 is worse than not
   *  showing it at all. */
  canReview?: boolean;
  /** Called with the notes text on save. Throw to signal failure — the
   *  drawer shows the error inline and keeps the form open. */
  onSaveReview?: (notes: string) => Promise<void>;
}
export function SiteDetailDrawer({ recon, onClose, canReview = false, onSaveReview }: DrawerProps) {
  const [reviewNotes, setReviewNotes] = React.useState('');
  const [reviewSaving, setReviewSaving] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);

  // Reset the form whenever a different site is opened.
  React.useEffect(() => {
    setReviewNotes('');
    setReviewError(null);
    setShowReviewForm(false);
  }, [recon?.site_id, recon?.cycle_key]);

  if (!recon) return null;

  async function handleSaveReview() {
    if (!onSaveReview) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await onSaveReview(reviewNotes);
      setShowReviewForm(false);
    } catch (e: any) {
      setReviewError(e?.response?.data?.message || e?.message || 'Failed to save review');
    } finally {
      setReviewSaving(false);
    }
  }

  const rows: [string, any][] = [
    ['Topology',           recon.topology],
    ['Generator',          recon.generator_brand || '—'],
    ['KVA',                recon.dg_kva],
    ['CCPH (L/h)',         fmtNum(recon.ccph, 3)],
    ['Budget RH',          fmtNum(recon.budgeted_rh, 1)],
    ['Field RH',           fmtNum(recon.field_rh, 1)],
    ['CMS RH',             fmtNum(recon.cms_rh, 1)],
    ['Final RH',           fmtNum(recon.final_rh, 1)],
    ['Faulty Meter Days',  recon.faulty_meter_days || 0],
    ['Contractual (L)',    fmtNum(recon.contractual_consumption)],
    ['CMS Consumed (L)',   fmtNum(recon.cms_consumption)],
    ['Field Actual (L)',   fmtNum(recon.field_consumption_actual)],
    ['Cons Variance (L)',  recon.cons_variance != null ? `${recon.cons_variance > 0 ? '+' : ''}${fmtNum(recon.cons_variance)} (${fmtPct(recon.cons_variance_pct)})` : '—'],
    ['Field Added (L)',    fmtNum(recon.field_fuel_added)],
    ['CMS Refuel (L)',     fmtNum(recon.cms_refuel_total)],
    ['Tom Card (L)',       recon.tomcard_purchased != null ? fmtNum(recon.tomcard_purchased) : 'Not mapped'],
    ['Theft (L)',          recon.theft_liters > 0 ? `⚠️ ${fmtNum(recon.theft_liters)}` : 'None'],
    ['Grid Avail',         fmtPct(recon.grid_avail_actual)],
    ['Zero Grid Max (h)',  recon.zero_grid_max_streak],
    ['CMS Days',           `${recon.cms_days_covered} / ${recon.cms_days_expected}`],
    ['Field Visits',       recon.field_visits_count],
    ['Last Reconciled',    fmtDate(recon.last_reconciled_at)],
  ];

  const activeAlerts = Object.entries(recon.alerts).filter(([, v]) => v).map(([k]) => k);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', zIndex: 201, overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral[200]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: ink, color: '#fff' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{recon.cluster} · {recon.cycle_key}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700 }}>{recon.site_name || recon.site_id}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{recon.site_id}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>✕ Close</button>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {activeAlerts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 12, color: neutral[500], marginBottom: 8 }}>ACTIVE ALERTS ({activeAlerts.length})</p>
              {activeAlerts.map(a => (
                <div key={a} style={{ background: statusTokens.danger.bg, color: statusTokens.danger.text, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {ALERT_ICONS[a.toUpperCase().replace(/_([a-z])/g, (_, c) => '_' + c.toUpperCase()) as AlertType] || '⚠️'} {a.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {rows.map(([label, value]) => (
              <div key={label} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <p style={{ fontSize: 11, color: neutral[400], margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: ink }}>{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {recon.had_mid_cycle_swap && (
            <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 12, margin: '0 0 8px', color: statusTokens.warning.text }}>⚠️ Mid-Cycle Generator Swap Detected</p>
              {recon.swap_segments.map((seg, i) => (
                <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 4 }}>
                  Gen {seg.generator_id}: {fmtNum(seg.rh_in_segment, 1)} RH × {fmtNum(seg.ccph, 3)} CCPH = {fmtNum(seg.consumption_in_segment)} L
                  <span style={{ color: neutral[400], marginLeft: 4 }}>({fmtDate(seg.from_date)} → {fmtDate(seg.to_date)})</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Manual review ────────────────────────────────────────────────
              Previously this whole drawer was read-only — an investigator
              could SEE a theft-suspected or refuel-mismatch flag here but had
              no way to record "I looked into this, here's what I found"
              without going outside the app entirely. */}
          <div style={{ marginTop: 16, borderTop: `1px solid ${neutral[200]}`, paddingTop: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 12, color: neutral[500], marginBottom: 8 }}>MANUAL REVIEW</p>

            {recon.is_manually_reviewed && !showReviewForm && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: statusTokens.success.text }}>
                  ✓ Reviewed{recon.reviewed_at ? ` — ${fmtDate(recon.reviewed_at)}` : ''}
                  {recon.reviewed_by && typeof recon.reviewed_by === 'object' && recon.reviewed_by.fullName
                    ? ` by ${recon.reviewed_by.fullName}` : ''}
                </p>
                {recon.override_notes && (
                  <p style={{ margin: 0, fontSize: 12, color: statusTokens.success.text, whiteSpace: 'pre-wrap' }}>{recon.override_notes}</p>
                )}
              </div>
            )}

            {!recon.is_manually_reviewed && !showReviewForm && (
              <p style={{ fontSize: 12, color: neutral[400], marginBottom: 10 }}>Not yet reviewed.</p>
            )}

            {canReview && !showReviewForm && (
              <button
                onClick={() => { setShowReviewForm(true); setReviewNotes(recon.override_notes || ''); }}
                style={{
                  fontSize: 12, fontWeight: 600, color: ink, background: neutral[100],
                  border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                }}
              >
                {recon.is_manually_reviewed ? 'Update review' : 'Mark as reviewed…'}
              </button>
            )}

            {canReview && showReviewForm && (
              <div>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="What did you find? e.g. 'Confirmed with site guard — theft flag was a meter reading error, not an actual loss.'"
                  aria-label="Manual review notes"
                  style={{
                    width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8,
                    padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' as const,
                  }}
                />
                {reviewError && (
                  <p style={{ color: urgencyTokens.critical.fg, fontSize: 12, margin: '6px 0 0' }}>{reviewError}</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    disabled={reviewSaving}
                    style={{ fontSize: 12, fontWeight: 600, color: neutral[700], background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReview}
                    disabled={reviewSaving || !reviewNotes.trim()}
                    style={{
                      fontSize: 12, fontWeight: 600, color: '#fff', background: ink, border: 'none',
                      borderRadius: 6, padding: '6px 14px', cursor: reviewSaving ? 'not-allowed' : 'pointer',
                      opacity: reviewSaving || !reviewNotes.trim() ? 0.6 : 1,
                    }}
                  >
                    {reviewSaving ? 'Saving…' : 'Save Review'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: ink, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: neutral[500], margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  /**
   * When true: disables the button, shows a small inline spinner before the
   * label, and sets aria-busy. Previously every page had to remember to
   * manually pass `disabled={someLoadingFlag}` during an async action —
   * inconsistently applied across the 16 diesel pages, risking double-submit
   * on a slow network (e.g. double-clicking "Approve" or "Save Mapping").
   * Purely opt-in — existing callers that don't pass this prop are unaffected.
   */
  loading?: boolean;
}
export function Btn({ variant = 'primary', size = 'md', children, style, loading = false, disabled, ...rest }: BtnProps) {
  const variants = {
    primary:   { background: brand.primary, color: '#fff', border: 'none' },
    secondary: { background: neutral[100], color: neutral[700], border: `1px solid ${neutral[200]}` },
    danger:    { background: statusTokens.danger.bg, color: statusTokens.danger.text, border: 'none' },
    ghost:     { background: 'none', color: neutral[700], border: `1px solid ${neutral[200]}` },
  };
  const sizes = { sm: { padding: '4px 12px', fontSize: typeScale.small }, md: { padding: '8px 18px', fontSize: typeScale.small + 1 } };
  const isDisabled = disabled || loading;
  return (
    <button
      aria-busy={loading || undefined}
      disabled={isDisabled}
      style={{
        borderRadius: radiusTokens.md, fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.65 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...variants[variant], ...sizes[size], ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            display: 'inline-block', animation: 'diesel-btn-spin 0.7s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}
// Keyframe injected once — scoped by a unique name so it can't collide with
// other spin animations elsewhere in the app.
if (typeof document !== 'undefined' && !document.getElementById('diesel-btn-spin-kf')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'diesel-btn-spin-kf';
  styleTag.textContent = '@keyframes diesel-btn-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(styleTag);
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{ width: size, height: size, border: '3px solid #e5e7eb', borderTopColor: ink, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ background: statusTokens.danger.bg, border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>❌</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: statusTokens.danger.text, margin: 0 }}>Error</p>
        <p style={{ color: '#b91c1c', fontSize: 13, margin: '2px 0 0' }}>{message}</p>
      </div>
      {onRetry && <Btn variant="ghost" size="sm" onClick={onRetry}>Retry</Btn>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: neutral[400] }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 600, color: neutral[700], margin: '0 0 6px' }}>{title}</p>
      {desc && <p style={{ fontSize: 13, margin: 0 }}>{desc}</p>}
    </div>
  );
}

