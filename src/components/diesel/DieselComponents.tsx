/**
 * DieselComponents.tsx
 * Shared UI components used across all diesel pages.
 */
import React, { useState, useRef } from 'react';
import type { AlertSeverity, AlertType, CycleReconciliation, DieselAlert } from '../types/diesel.types';

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
  critical: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  high:     { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  medium:   { bg: '#dbeafe', text: '#1e3a8a', dot: '#2563eb' },
  low:      { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' },
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
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Cycle:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13, background: '#fff', cursor: 'pointer' }}
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
  compact?: boolean;
}
export function AlertCard({ alert, onAcknowledge, onResolve, compact }: AlertCardProps) {
  const [showResolve, setShowResolve] = useState(false);
  const [note, setNote] = useState('');
  const icon = ALERT_ICONS[alert.alert_type] || '🔔';

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: compact ? '12px 16px' : '16px 20px', marginBottom: compact ? 8 : 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: SEVERITY_STYLE[alert.severity]?.bg || '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</span>
            <SeverityBadge severity={alert.severity} />
            {alert.status !== 'open' && (
              <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '1px 8px', borderRadius: 10 }}>{alert.status}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 6px', lineHeight: 1.5 }}>{alert.message}</p>
          {!compact && (
            <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#9ca3af', flexWrap: 'wrap' }}>
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
              <button onClick={() => onAcknowledge(alert._id)} style={btnStyle('#dbeafe', '#1e40af')}>Acknowledge</button>
            )}
            {onResolve && (
              <button onClick={() => setShowResolve(v => !v)} style={btnStyle('#dcfce7', '#166534')}>Resolve</button>
            )}
          </div>
        )}
      </div>
      {showResolve && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Resolution note (required)…"
            rows={2}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowResolve(false)} style={btnStyle('#f3f4f6', '#374151')}>Cancel</button>
            <button onClick={() => { if (note.trim()) { onResolve!(alert._id); setShowResolve(false); } }} style={btnStyle('#dcfce7', '#166534')}>Confirm Resolve</button>
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
  if (value === null || value === undefined) return <span style={{ color: '#9ca3af' }}>—</span>;
  const abs = Math.abs(pct ?? 0);
  let color = '#374151';
  if (abs > 0.15) color = invertColor ? '#16a34a' : '#dc2626';
  else if (abs > 0.05) color = '#d97706';
  else color = invertColor ? '#dc2626' : '#16a34a';
  return (
    <span style={{ color, fontWeight: abs > 0.05 ? 600 : 400 }}>
      {value > 0 ? '+' : ''}{fmtNum(value, 0)} L
      {pct !== null && pct !== undefined && <span style={{ fontSize: 11, marginLeft: 4 }}>({fmtPct(pct)})</span>}
    </span>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: string | number; sub?: string; color?: string; icon?: string; alert?: boolean }
export function KpiCard({ label, value, sub, color = '#1a1a2e', icon, alert }: KpiCardProps) {
  return (
    <div style={{ background: '#fff', border: alert ? '2px solid #dc2626' : '1px solid #e5e7eb', borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
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
  onFile: (f: File) => void;
  uploading?: boolean;
  children?: React.ReactNode;
}
export function UploadZone({ accept, label, onFile, uploading, children }: UploadZoneProps) {
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
      style={{
        border: `2px dashed ${drag ? '#2563eb' : '#e5e7eb'}`,
        borderRadius: 12, padding: '32px 24px', textAlign: 'center',
        background: drag ? '#eff6ff' : '#fafafa', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <div style={{ fontSize: 32, marginBottom: 8 }}>{uploading ? '⏳' : '📂'}</div>
      <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#374151' }}>{uploading ? 'Uploading…' : label}</p>
      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Drag & drop or click to browse</p>
      {children}
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    completed: ['#dcfce7', '#166534'],
    ok:        ['#dcfce7', '#166534'],
    open:      ['#fee2e2', '#991b1b'],
    over:      ['#fee2e2', '#991b1b'],
    failed:    ['#fee2e2', '#991b1b'],
    processing:['#dbeafe', '#1e40af'],
    pending:   ['#fef9c3', '#854d0e'],
    under:     ['#fef9c3', '#854d0e'],
    partial:   ['#fef9c3', '#854d0e'],
    unknown:   ['#f3f4f6', '#374151'],
    resolved:  ['#f3f4f6', '#374151'],
  };
  const [bg, color] = map[status?.toLowerCase()] || ['#f3f4f6', '#374151'];
  return <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}

// ─── SiteDetailDrawer ─────────────────────────────────────────────────────────
interface DrawerProps { recon: CycleReconciliation | null; onClose: () => void; }
export function SiteDetailDrawer({ recon, onClose }: DrawerProps) {
  if (!recon) return null;
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', color: '#fff' }}>
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
              <p style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>ACTIVE ALERTS ({activeAlerts.length})</p>
              {activeAlerts.map(a => (
                <div key={a} style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {ALERT_ICONS[a.toUpperCase().replace(/_([a-z])/g, (_, c) => '_' + c.toUpperCase()) as AlertType] || '⚠️'} {a.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {rows.map(([label, value]) => (
              <div key={label} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#1a1a2e' }}>{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {recon.had_mid_cycle_swap && (
            <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 12, margin: '0 0 8px', color: '#92400e' }}>⚠️ Mid-Cycle Generator Swap Detected</p>
              {recon.swap_segments.map((seg, i) => (
                <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 4 }}>
                  Gen {seg.generator_id}: {fmtNum(seg.rh_in_segment, 1)} RH × {fmtNum(seg.ccph, 3)} CCPH = {fmtNum(seg.consumption_in_segment)} L
                  <span style={{ color: '#9ca3af', marginLeft: 4 }}>({fmtDate(seg.from_date)} → {fmtDate(seg.to_date)})</span>
                </div>
              ))}
            </div>
          )}
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}
export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const variants = {
    primary:   { background: '#1a1a2e', color: '#fff', border: 'none' },
    secondary: { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
    danger:    { background: '#fee2e2', color: '#991b1b', border: 'none' },
    ghost:     { background: 'none', color: '#374151', border: '1px solid #e5e7eb' },
  };
  const sizes = { sm: { padding: '4px 12px', fontSize: 12 }, md: { padding: '8px 18px', fontSize: 13 } };
  return (
    <button style={{ borderRadius: 8, fontWeight: 600, cursor: 'pointer', ...variants[variant], ...sizes[size], ...style }} {...rest}>
      {children}
    </button>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{ width: size, height: size, border: '3px solid #e5e7eb', borderTopColor: '#1a1a2e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>❌</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: '#991b1b', margin: 0 }}>Error</p>
        <p style={{ color: '#b91c1c', fontSize: 13, margin: '2px 0 0' }}>{message}</p>
      </div>
      {onRetry && <Btn variant="ghost" size="sm" onClick={onRetry}>Retry</Btn>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>{title}</p>
      {desc && <p style={{ fontSize: 13, margin: 0 }}>{desc}</p>}
    </div>
  );
}
