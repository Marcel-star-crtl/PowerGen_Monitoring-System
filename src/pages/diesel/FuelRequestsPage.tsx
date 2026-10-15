/**
 * FuelRequestsPage.tsx  —  src/pages/diesel/FuelRequestsPage.tsx
 *
 * PURPOSE: Analytics & lifecycle tracking — one row per site per cycle.
 *   Budget Allocated → Requested → Approved → Purchased → Refueled → Consumed
 *
 * This page is READ-ONLY analytics. Creating a new request is done from ScheduledPage.
 * Approval actions are surfaced here for people in the approval chain.
 *
 * Tabs:
 *   Overview     – lifecycle grid with sparkbars and status pills per site
 *   Approvals    – pending approvals for the logged-in user
 *   Consumption  – enriched consumption records with photos (old FuelRequestsPage content)
 *   Budget       – budget utilisation per site for selected cycle
 */

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { useCycles } from '@/hooks/useDiesel';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Modal }    from '@/components/common/Modal';
import {
  PageHeader, CycleSelector, Btn, Tag, Card, SectionLabel, KpiCard, Spinner, EmptyState,
} from '@/components/diesel/DieselComponents';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuthContext }  from '@/contexts/AuthContext';
import {
  FiDroplet, FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock,
  FiRefreshCw, FiChevronDown, FiChevronRight, FiBell, FiUser,
  FiTrendingDown, FiTrendingUp, FiEye, FiDownload, FiFilter,
  FiBarChart2, FiList, FiActivity,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { status as statusTokens, urgency as urgencyTokens, neutral, brand, font } from '@/styles/dieselTokens';

// ── Formatters — inlined to avoid path/export name mismatches ─────────────────
// (defined after imports to satisfy import/first eslint rule)
const formatFuelLevel = (level: number | null | undefined, capacity: number | null | undefined) => {
  if (!level || !capacity) return { text: '—', percentage: 0, color: neutral[400] };
  const percentage = (level / capacity) * 100;
  const color = percentage < 10 ? urgencyTokens.critical.fg : percentage < 25 ? urgencyTokens.high.fg : percentage < 50 ? '#eab308' : urgencyTokens.ok.fg;
  return { text: `${level.toFixed(0)} L (${Math.round(percentage)}%)`, percentage, color };
};

// ── Inline API client ─────────────────────────────────────────────────────────
const fuelRequestApi = {
  list:         (p?: any)  => apiClient.get('/fuel-requests', { params: p }).then(r => r.data),
  get:          (id: string) => apiClient.get(`/fuel-requests/${id}`).then(r => r.data),
  pendingForMe: ()          => apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),
  approve:      (id: string, d?: any) => apiClient.patch(`/fuel-requests/${id}/approve`, d || {}).then(r => r.data),
  reject:       (id: string, c: string) => apiClient.patch(`/fuel-requests/${id}/reject`, { comments: c }).then(r => r.data),
  budgetAlerts: (t = 50)   => apiClient.get('/fuel-requests/budget-alerts', { params: { threshold_liters: t } }).then(r => r.data),
  siteCycle:    (s: string, k: string) => apiClient.get(`/fuel-requests/site/${s}/cycle/${k}`).then(r => r.data),
  emergencyApprove: (id: string, d: { override_reason: string; liters_approved?: number }) =>
    apiClient.patch(`/fuel-requests/${id}/emergency-approve`, d).then(r => r.data),
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApprovalStep {
  level: number;
  approver: { name: string; email: string; role: string };
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: string;
}

interface FuelRequestDoc {
  _id: string;
  site_id: string;
  site_name: string;
  cluster?: string;
  cycle_key: string;
  liters_requested: number;
  liters_approved?: number;
  liters_actually_added?: number;
  xaf_requested: number;
  xaf_approved?: number;
  current_fuel_level?: number;
  fuel_percentage_at_request?: number;
  tank_capacity?: number;
  urgency: string;
  status: string;
  request_reason: string;
  approvalChain: ApprovalStep[];
  requested_by?: { fullName: string; email: string };
  assigned_to?: { fullName: string };
  scheduled_date?: string;
  budget_snapshot?: { budget_liters_total: number; budget_liters_remaining: number; budget_liters_used: number };
  cycle_refuel_count?: number;
  createdAt: string;
}

interface BudgetAlert {
  site_id: string; site_name: string; cluster: string;
  budget_liters: number; liters_remaining: number; liters_used: number;
  pct_remaining: number; alert_level: 'warning' | 'critical' | 'exhausted';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LITER_TO_XAF = 828;

// Bg/fg pairs sourced from the shared status/urgency tokens wherever a
// matching tone exists (pending→warning, approved/refueled→success,
// denied→danger, scheduled→info). Finance/HOB/CEO/purchase-made are
// legitimately distinct approval-chain stages beyond that 5-tone scale, so
// they keep their own literal colors rather than being forced onto a token
// that doesn't carry the same meaning.
const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending_diesel_coordinator: { label: 'Awaiting Minka',   bg: statusTokens.warning.bg, fg: statusTokens.warning.text },
  pending_operations_manager: { label: 'Awaiting Pascal',  bg: statusTokens.warning.bg, fg: statusTokens.warning.text },
  pending_technical_director: { label: 'Awaiting Didier',  bg: statusTokens.warning.bg, fg: statusTokens.warning.text },
  pending_finance:            { label: 'Awaiting Finance',  bg: '#ede9fe', fg: '#5b21b6' },
  pending_head_of_business:   { label: 'Awaiting HOB',     bg: '#e0e7ff', fg: '#3730a3' },
  pending_ceo:                { label: 'Awaiting CEO',      bg: '#fae8ff', fg: '#86198f' },
  approved:                   { label: 'Approved',          bg: statusTokens.success.bg, fg: statusTokens.success.text },
  scheduled:                  { label: 'Scheduled',         bg: statusTokens.info.bg, fg: statusTokens.info.text },
  purchase_made:              { label: 'Fuel Bought',       bg: '#ccfbf1', fg: '#134e4a' },
  refueled:                   { label: 'Refueled',          bg: statusTokens.success.bg, fg: statusTokens.success.text },
  completed:                  { label: 'Completed',         bg: statusTokens.neutral.bg, fg: statusTokens.neutral.text },
  denied:                     { label: 'Denied',            bg: statusTokens.danger.bg, fg: statusTokens.danger.text },
};

const URGENCY_CONFIG: Record<string, { bg: string; fg: string }> = {
  low:      { bg: statusTokens.neutral.bg, fg: statusTokens.neutral.text },
  medium:   { bg: statusTokens.info.bg,    fg: statusTokens.info.text },
  high:     { bg: statusTokens.warning.bg, fg: statusTokens.warning.text },
  critical: { bg: statusTokens.danger.bg,  fg: statusTokens.danger.text },
};

const fmtDate = (d?: string) => !d ? '—' : new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || { label: status, bg: statusTokens.neutral.bg, fg: statusTokens.neutral.text };
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.fg, borderRadius: 6,
      padding: '2px 8px', whiteSpace: 'nowrap',
    }}>{c.label}</span>
  );
}

function UrgencyPill({ urgency }: { urgency: string }) {
  const c = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.medium;
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.fg, borderRadius: 6, padding: '2px 8px',
    }}>{urgency.toUpperCase()}</span>
  );
}

function ProgressBar({ pct, color = urgencyTokens.medium.fg, height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ background: neutral[200], borderRadius: 3, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

function ApprovalDots({ chain }: { chain: ApprovalStep[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {chain.map(s => (
        <div key={s.level} title={`L${s.level}: ${s.approver.name} — ${s.status}`} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: s.status === 'approved' ? urgencyTokens.ok.fg : s.status === 'rejected' ? urgencyTokens.critical.fg : neutral[300],
          flexShrink: 0,
        }} />
      ))}
      <span style={{ fontSize: 10, color: neutral[400], marginLeft: 2 }}>
        {chain.filter(s => s.status === 'approved').length}/{chain.length}
      </span>
    </div>
  );
}

// ── Approval trail (expanded) ─────────────────────────────────────────────────
function ApprovalTrail({ chain }: { chain: ApprovalStep[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
      {chain.map(s => (
        <div key={s.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ marginTop: 2, flexShrink: 0 }}>
            {s.status === 'approved'  ? <FiCheckCircle size={14} color={urgencyTokens.ok.fg} /> :
             s.status === 'rejected'  ? <FiXCircle     size={14} color={urgencyTokens.critical.fg} /> :
                                        <FiClock        size={14} color={neutral[400]} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>L{s.level}: {s.approver.name}</span>
              <span style={{ color: neutral[400], fontSize: 11 }}>{s.approver.role}</span>
              {s.actionDate && <span style={{ color: neutral[400], fontSize: 11 }}>{fmtDate(s.actionDate)}</span>}
            </div>
            {s.comments && (
              <p style={{ fontSize: 12, color: neutral[500], margin: '2px 0 0', fontStyle: 'italic' }}>
                "{s.comments}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lifecycle row (overview tab) ──────────────────────────────────────────────
function LifecycleRow({
  req, onApprove, onReject, onView, userEmail,
}: {
  req: FuelRequestDoc;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onView:    (req: FuelRequestDoc) => void;
  userEmail: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const myStep = req.approvalChain?.find(s => s.approver.email === userEmail && s.status === 'pending');
  const prevOk = myStep ? req.approvalChain.filter(s => s.level < myStep.level).every(s => s.status === 'approved') : false;
  const canAct = !!myStep && prevOk;

  const approved  = req.liters_approved ?? req.liters_requested;
  const refueled  = req.liters_actually_added ?? 0;
  const budgetTotal = req.budget_snapshot?.budget_liters_total || 0;
  const budgetUsed  = req.budget_snapshot?.budget_liters_used  || 0;
  const budgetPct   = budgetTotal > 0 ? Math.round((budgetUsed / budgetTotal) * 100) : 0;
  const approvalPct = req.approvalChain?.length
    ? Math.round((req.approvalChain.filter(s => s.status === 'approved').length / req.approvalChain.length) * 100)
    : 0;
  const isFullyApproved = ['approved','scheduled','purchase_made','refueled','completed'].includes(req.status);

  return (
    <Card padded={false} style={{ marginBottom: 8, overflow: 'hidden', ...(canAct ? { border: `2px solid ${urgencyTokens.high.fg}` } : {}) }}>
      {/* ── Main row ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>

        {/* Site */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: neutral[900], whiteSpace: 'nowrap' }}>
              {req.site_name || req.site_id}
            </span>
            <UrgencyPill urgency={req.urgency} />
            {canAct && (
              <span style={{ fontSize: 10, fontWeight: 800, background: statusTokens.warning.bg, color: statusTokens.warning.text, borderRadius: 4, padding: '1px 6px' }}>
                ↑ YOUR TURN
              </span>
            )}
            {req.cycle_refuel_count && req.cycle_refuel_count > 3 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: statusTokens.danger.bg, color: statusTokens.danger.text, borderRadius: 4, padding: '1px 6px' }}>
                ⚠ {req.cycle_refuel_count}×
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: neutral[400], marginTop: 2 }}>
            {req.site_id} · {req.cluster || '—'} · FUEL-{req._id.slice(-6).toUpperCase()} · {fmtDate(req.createdAt)}
          </div>
        </div>

        {/* Quantities — ONLY visible when fully approved, completely hidden when pending */}
        <div style={{ textAlign: 'right', minWidth: 88, flexShrink: 0 }}>
          {isFullyApproved ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: neutral[900] }}>{approved} L</div>
              <div style={{ fontSize: 10, color: neutral[400] }}>XAF {(approved * LITER_TO_XAF).toLocaleString()}</div>
              {refueled > 0 && (
                <div style={{ fontSize: 10, color: statusTokens.success.text, marginTop: 1 }}>✓ {refueled} L added</div>
              )}
            </>
          ) : (
            <div style={{
              fontSize: 10, color: neutral[300], background: neutral[50],
              borderRadius: 6, padding: '4px 8px', border: `1px dashed ${neutral[200]}`,
            }}>
              awaiting approval
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ minWidth: 130, flexShrink: 0 }}>
          <StatusPill status={req.status} />
          <div style={{ marginTop: 6 }}>
            <ApprovalDots chain={req.approvalChain || []} />
          </div>
        </div>

        {/* Budget bar */}
        <div style={{ minWidth: 100, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: neutral[400], marginBottom: 3 }}>Budget used</div>
          <ProgressBar
            pct={budgetPct}
            color={budgetPct > 90 ? urgencyTokens.critical.fg : budgetPct > 70 ? urgencyTokens.high.fg : urgencyTokens.medium.fg}
          />
          <div style={{ fontSize: 10, color: neutral[500], marginTop: 2 }}>{budgetPct}%</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onView(req)} style={{ ...btnBase, background: neutral[100], color: neutral[700] }}>
            <FiEye size={13} />
          </button>
          {canAct && (
            <>
              <button onClick={() => onApprove(req._id)} style={{ ...btnBase, background: statusTokens.success.bg, color: statusTokens.success.text }}>
                <FiCheckCircle size={13} />
              </button>
              <button onClick={() => onReject(req._id)} style={{ ...btnBase, background: statusTokens.danger.bg, color: statusTokens.danger.text }}>
                <FiXCircle size={13} />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(e => !e)} style={{ ...btnBase, background: neutral[100], color: neutral[700] }}>
            {expanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
          </button>
        </div>
      </div>

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${neutral[100]}`, padding: '12px 16px', background: neutral[50] }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            <div>
              <SectionLabel>Request Details</SectionLabel>
              <div style={detailGrid}>
                <span style={detailKey}>Reason</span>
                <span style={detailVal}>{req.request_reason}</span>
                <span style={detailKey}>Fuel at request</span>
                <span style={detailVal}>{req.current_fuel_level ?? '—'} L ({req.fuel_percentage_at_request ?? '—'}%)</span>
                <span style={detailKey}>Requested by</span>
                <span style={detailVal}>{req.requested_by?.fullName || '—'}</span>
                {req.assigned_to && <>
                  <span style={detailKey}>Assigned to</span>
                  <span style={detailVal}>{req.assigned_to.fullName}</span>
                </>}
                {req.scheduled_date && <>
                  <span style={detailKey}>Scheduled</span>
                  <span style={detailVal}>{fmtDate(req.scheduled_date)}</span>
                </>}
              </div>
            </div>

            <div>
              <SectionLabel>Budget Snapshot</SectionLabel>
              {req.budget_snapshot ? (
                <div style={detailGrid}>
                  <span style={detailKey}>Cycle budget</span>
                  <span style={detailVal}>{req.budget_snapshot.budget_liters_total} L</span>
                  <span style={detailKey}>Used (all requests)</span>
                  <span style={detailVal}>{req.budget_snapshot.budget_liters_used} L</span>
                  <span style={detailKey}>Remaining</span>
                  <span style={{ ...detailVal, color: req.budget_snapshot.budget_liters_remaining < 50 ? urgencyTokens.critical.fg : statusTokens.success.text, fontWeight: 700 }}>
                    {req.budget_snapshot.budget_liters_remaining} L
                  </span>
                  <span style={detailKey}>XAF budget</span>
                  <span style={detailVal}>XAF {(req.budget_snapshot.budget_liters_total * LITER_TO_XAF).toLocaleString()}</span>
                </div>
              ) : <span style={{ fontSize: 12, color: neutral[400] }}>No budget data</span>}
            </div>

            <div>
              <SectionLabel>Approval Trail</SectionLabel>
              <ApprovalTrail chain={req.approvalChain || []} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Consumption record card (old FuelRequestsPage) ────────────────────────────
const API_BASE = 'http://localhost:5000';
const resolveUrl = (p: any): string => {
  const s = typeof p === 'string' ? p : (p?.url || p?.uri || p?.path || '');
  if (!s) return '';
  return s.startsWith('http') ? s : `${API_BASE}${s}`;
};

function PhotoThumb({ src, label }: { src: string; label: string }) {
  const [broken, setBroken] = useState(false);
  const url = resolveUrl(src);
  if (broken) return <span style={{ fontSize: 11, color: neutral[400] }}>Unavailable</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
      <img src={url} alt={label} onError={() => setBroken(true)} style={{
        width: 80, height: 80, objectFit: 'cover', borderRadius: 6,
        border: `1px solid ${neutral[200]}`, display: 'block',
      }} />
      <span style={{ fontSize: 10, color: neutral[400], display: 'block', textAlign: 'center', marginTop: 2 }}>{label}</span>
    </a>
  );
}

// ── Shared style atoms ────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const detailGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px',
};
const detailKey: React.CSSProperties = { fontSize: 12, color: neutral[400], whiteSpace: 'nowrap' };
const detailVal: React.CSSProperties = { fontSize: 12, color: neutral[700], fontWeight: 500 };

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const FuelRequestsPage: React.FC = () => {
  const { user }              = useAuthContext();
  const { isNarrow, isMobile } = useBreakpoint();
  const { success, error: showError } = useNotification();
  // useCycles shape varies — destructure what exists, manage selectedKey locally as fallback
  const cyclesResult = useCycles();
  const cycles = cyclesResult.cycles || [];
  // Some builds return selectedKey/setSelectedKey; others only return cycles + currentCycle
  const externalSelectedKey = (cyclesResult as any).selectedKey;
  const externalSetSelected = (cyclesResult as any).setSelectedKey;
  const defaultCycleKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const [_localKey, _setLocalKey] = useState<string>(defaultCycleKey);
  const selectedKey    = externalSelectedKey   ?? _localKey;
  const setSelectedKey = externalSetSelected   ?? _setLocalKey;

  const [tab, setTab]         = useState<'overview' | 'approvals' | 'consumption' | 'budget'>('overview');
  const [requests, setRequests] = useState<FuelRequestDoc[]>([]);
  const [pendingForMe, setPendingForMe] = useState<FuelRequestDoc[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [consumption, setConsumption]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Approve modal
  const [approveId, setApproveId]   = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [approveOverride, setApproveOverride] = useState('');
  const [approving, setApproving]   = useState(false);

  // Reject modal
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting]   = useState(false);

  // Emergency override modal — bypasses the entire approval chain. Backend
  // (PATCH /:id/emergency-approve) restricts this to admin/head_of_business/
  // ceo; previously there was no way to reach it from the app at all, so an
  // authorized person in a real emergency had no option but to ask a
  // developer to call the API directly.
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyLiters, setEmergencyLiters] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const canEmergencyOverride = ['admin', 'head_of_business', 'ceo'].includes(user?.role || '');

  // View modal
  const [viewReq,        setViewReq]        = useState<FuelRequestDoc | null>(null);
  const [viewReqLoading, setViewReqLoading] = useState(false);

  const handleView = async (req: FuelRequestDoc) => {
    // Show modal immediately with list data, then enrich with full detail
    setViewReq(req);
    setViewReqLoading(true);
    try {
      const res = await apiClient.get('/fuel-requests/' + req._id);
      if (res.data?.data) setViewReq(res.data.data as FuelRequestDoc);
    } catch { /* keep the list-item data */ }
    finally { setViewReqLoading(false); }
  };

  // Consumption detail modal
  const [viewConsumption, setViewConsumption] = useState<any | null>(null);

  // Export dates
  const [exportStart, setExportStart] = useState('');
  const [exportEnd,   setExportEnd]   = useState('');

  // Consumption data — loaded directly, no dependency on useFuel hook shape

  const isManager = ['diesel_manager', 'admin'].includes(user?.role || '');

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!selectedKey) return;
    setLoading(true);
    try {
      const [reqRes, pendRes, alertRes] = await Promise.all([
        fuelRequestApi.list({ cycle_key: selectedKey, limit: 300 }),
        fuelRequestApi.pendingForMe(),
        isManager ? fuelRequestApi.budgetAlerts(50) : Promise.resolve({ data: [] }),
      ]);
      setRequests(reqRes.data || []);
      setPendingForMe(pendRes.data || []);
      setBudgetAlerts(alertRes.data || []);
    } catch (err: any) {
      showError('Failed to load fuel requests');
    } finally {
      setLoading(false);
    }
  }, [selectedKey, isManager]);

  const loadConsumption = useCallback(async () => {
    try {
      // Load actual FuelConsumption records — these have fuel_data, photos, runtime_data
      // Merge with FuelRequest data so the cards show Added / Consumed / Efficiency
      const [fcResult, frResult] = await Promise.all([
        apiClient.get('/technician/fuel-consumption-records', {
          params: { limit: 200 }
        }).then(r => r.data).catch(() => ({ data: [] })),
        apiClient.get('/fuel-requests', {
          params: { status: 'refueled,completed', limit: 200 }
        }).then(r => r.data).catch(() => ({ data: [] })),
      ]);

      // If the dedicated endpoint exists, use it; otherwise fall back to
      // FuelRequests and enrich them with their linked consumption records
      const fcRecords: any[] = fcResult.data || [];
      const frRecords: any[] = frResult.data || [];

      if (fcRecords.length > 0) {
        setConsumption(fcRecords);
      } else {
        // Enrich each FuelRequest with its FuelConsumption inline
        const enriched = await Promise.all(
          frRecords.map(async (fr: any) => {
            if (!fr.fuel_consumption_id) return fr;
            try {
              const fc = await apiClient
                .get('/fuel-requests/' + fr._id)
                .then(r => r.data?.data?.fuel_consumption);
              return fc ? { ...fc, _fuelRequest: fr, site_name: fr.site_name, site_id: fr.site_id } : fr;
            } catch { return fr; }
          })
        );
        setConsumption(enriched);
      }
    } catch { /* tab falls back silently */ }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (tab === 'consumption') loadConsumption();
  }, [tab, loadConsumption]);

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const totalLitersRequested = requests.reduce((s, r) => s + r.liters_requested, 0);
  const totalLitersApproved  = requests.filter(r => r.liters_approved != null).reduce((s, r) => s + (r.liters_approved || 0), 0);
  const totalRefueled        = requests.filter(r => r.liters_actually_added != null).reduce((s, r) => s + (r.liters_actually_added || 0), 0);
  const denied               = requests.filter(r => r.status === 'denied').length;
  const overRefuel           = requests.filter(r => (r.cycle_refuel_count || 0) > 3).length;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveId) return;
    setApproving(true);
    try {
      await fuelRequestApi.approve(approveId, {
        comments: approveComment,
        liters_approved: approveOverride ? parseFloat(approveOverride) : undefined,
      });
      success('Approved — next level notified');
      setApproveId(null); setApproveComment(''); setApproveOverride('');
      loadAll();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Approval failed');
    } finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) { showError('Reason required'); return; }
    setRejecting(true);
    try {
      await fuelRequestApi.reject(rejectId, rejectReason);
      success('Request rejected');
      setRejectId(null); setRejectReason('');
      loadAll();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Rejection failed');
    } finally { setRejecting(false); }
  };

  const handleEmergencyOverride = async () => {
    if (!emergencyId || !emergencyReason.trim()) { showError('An override reason is required'); return; }
    setEmergencyLoading(true);
    try {
      const res = await fuelRequestApi.emergencyApprove(emergencyId, {
        override_reason: emergencyReason.trim(),
        liters_approved: emergencyLiters ? parseFloat(emergencyLiters) : undefined,
      });
      const skipped = res?.skipped_steps?.length ?? 0;
      success(`Emergency approval granted — ${skipped} approval level(s) bypassed. All approvers and the requester have been notified.`);
      setEmergencyId(null); setEmergencyReason(''); setEmergencyLiters('');
      loadAll();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Emergency override failed');
    } finally { setEmergencyLoading(false); }
  };

  const handleExport = () => {
    let src = [...requests, ...consumption];
    if (exportStart) src = src.filter(r => r.createdAt && new Date(r.createdAt) >= new Date(exportStart));
    if (exportEnd) {
      const end = new Date(exportEnd); end.setDate(end.getDate() + 1);
      src = src.filter(r => r.createdAt && new Date(r.createdAt) < end);
    }
    if (!src.length) { showError('No data for selected period'); return; }
    const rows = src.map((r: any) => ({
      'ID':             r._id?.slice(-6).toUpperCase(),
      'Site Name':      r.site_name || r.site_id,
      'Site ID':        r.site_id,
      'Cluster':        r.cluster || r.site_details?.GRATO_Cluster || '',
      'Cycle':          r.cycle_key || '',
      'Status':         r.status || r.approval_status || '',
      'Litres Requested': r.liters_requested ?? r.request_info?.fuel_requested ?? '',
      'Litres Approved':  r.liters_approved ?? '',
      'Litres Added':     r.liters_actually_added ?? r.fuel_data?.fuel_added ?? '',
      'XAF Requested':    r.xaf_requested ?? '',
      'Budget Total (L)': r.budget_snapshot?.budget_liters_total ?? '',
      'Budget Remaining (L)': r.budget_snapshot?.budget_liters_remaining ?? '',
      'Urgency':        r.urgency || r.request_info?.request_urgency || '',
      'Reason':         r.request_reason || r.request_info?.request_reason || '',
      'Requested By':   r.requested_by?.fullName || '',
      'Assigned To':    r.assigned_to?.fullName || '',
      'Refuel Count':   r.cycle_refuel_count ?? '',
      'Created':        fmtDate(r.createdAt),
      'Scheduled':      fmtDate(r.scheduled_date),
      'Opening Level (L)': r.fuel_data?.opening_level ?? '',
      'Closing Level (L)': r.fuel_data?.closing_level ?? '',
      'Fuel Consumed (L)': r.fuel_data?.fuel_consumed ?? '',
      'Tank Capacity (L)': r.fuel_data?.tank_capacity ?? '',
      'Runtime Hours':     r.runtime_data?.runtime_hours ?? '',
      'Truck Plate':       r.runtime_data?.truck_plate_number ?? '',
      'Consumption Rate':  r.metrics?.consumption_rate ?? '',
      'Efficiency':        r.metrics?.efficiency_rating ?? '',
      'Guard Name':        r.guard_name ?? '',
      'Comments':          r.comments ?? r.request_reason ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fuel Data');
    XLSX.writeFile(wb, `Fuel_${selectedKey}_${Date.now()}.xlsx`);
    success(`Exported ${rows.length} records`);
  };

  // ── Tab content ───────────────────────────────────────────────────────────────
  const renderOverview = () => {
    const statusOrder = [
      'denied','pending_diesel_coordinator','pending_operations_manager',
      'pending_technical_director','pending_finance','pending_head_of_business','pending_ceo',
      'approved','scheduled','purchase_made','refueled','completed',
    ];
    const sorted = [...requests].sort((a,b) => {
      const ai = statusOrder.indexOf(a.status); const bi = statusOrder.indexOf(b.status);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    if (!sorted.length) return (
      <EmptyState
        icon="💧"
        title={`No fuel requests for cycle ${selectedKey}`}
        desc="Create a request from the Scheduled Refueling page"
      />
    );

    return sorted.map(r => (
      <LifecycleRow
        key={r._id} req={r}
        onApprove={id => setApproveId(id)}
        onReject={id  => setRejectId(id)}
        onView={handleView}
        userEmail={user?.email || ''}
      />
    ));
  };

  const renderApprovals = () => {
    if (!pendingForMe.length) return (
      <EmptyState
        icon="✅"
        title="No pending approvals for you"
        desc="You will be notified by email when a request reaches your level"
      />
    );
    return pendingForMe.map(r => (
      <LifecycleRow
        key={r._id} req={r}
        onApprove={id => setApproveId(id)}
        onReject={id  => setRejectId(id)}
        onView={handleView}
        userEmail={user?.email || ''}
      />
    ));
  };

  const renderConsumption = () => {
    const items = consumption.length ? consumption : requests.filter(r => r.status === 'refueled' || r.status === 'completed');
    if (!items.length) return (
      <EmptyState
        icon="📊"
        title="No consumption records"
        desc="Completed refuels will appear here"
      />
    );

    const getUrgencyTagVariant = (u: string) =>
      ({ low: 'neutral', medium: 'info', high: 'warning', critical: 'danger' } as const)[u] || 'neutral';

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {items.map((r: any) => {
          const fuelInfo = r.fuel_data
            ? formatFuelLevel(r.fuel_data.closing_level, r.fuel_data.tank_capacity)
            : { text: '—', percentage: 0, color: neutral[400] };
          const mainPhotos = Array.isArray(r.photos) ? r.photos as string[] : [];
          return (
            <Card key={r._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{r.site_name || r.site_id}</p>
                  <p style={{ fontSize: 11, color: neutral[400], margin: '2px 0 0' }}>{r.site_id}</p>
                </div>
                <Tag variant={getUrgencyTagVariant(r.request_info?.request_urgency || r.urgency || 'medium')}>
                  {(r.request_info?.request_urgency || r.urgency || 'MEDIUM').toUpperCase()}
                </Tag>
              </div>

              {/* Fuel bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: neutral[400], marginBottom: 3 }}>Current Fuel Level</div>
                <ProgressBar pct={fuelInfo.percentage} color={fuelInfo.color} />
                <div style={{ fontSize: 11, color: neutral[700], marginTop: 2 }}>{fuelInfo.text}</div>
              </div>

              <div style={{ ...detailGrid, marginBottom: 10 }}>
                <span style={detailKey}>Added</span>
                <span style={detailVal}>{r.fuel_data?.fuel_added ?? r.liters_actually_added ?? '—'} L</span>
                <span style={detailKey}>Consumed</span>
                <span style={detailVal}>{r.fuel_data?.fuel_consumed ?? '—'} L</span>
                <span style={detailKey}>Efficiency</span>
                <span style={detailVal}>{r.metrics?.efficiency_rating || '—'}</span>
                {r.metrics?.anomaly_detected && (
                  <><span style={detailKey}>Anomaly</span><span style={{ ...detailVal, color: urgencyTokens.critical.fg }}>⚠ Detected</span></>
                )}
              </div>

              {mainPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {mainPhotos.slice(0, 3).map((u, i) => <PhotoThumb key={i} src={u} label={`Photo ${i+1}`} />)}
                  {mainPhotos.length > 3 && <span style={{ fontSize: 11, color: neutral[400], alignSelf: 'center' }}>+{mainPhotos.length - 3} more</span>}
                </div>
              )}

              <button
                onClick={async () => {
                // If r is a FuelRequest (has no fuel_data), fetch the enriched version
                // which includes the linked FuelConsumption document
                if (!r.fuel_data && r._id) {
                  try {
                    const full = await apiClient.get('/fuel-requests/' + r._id).then(x => x.data?.data);
                    if (full?.fuel_consumption) {
                      setViewConsumption({ ...full.fuel_consumption, _fuelRequest: full, site_name: full.site_name, site_id: full.site_id });
                      return;
                    }
                  } catch { /* fall through to show what we have */ }
                }
                setViewConsumption(r);
              }}
                style={{ ...btnBase, width: '100%', background: neutral[100], color: neutral[700], padding: '6px' }}
              >
                <FiEye size={13} style={{ marginRight: 4 }} /> View Full Details
              </button>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderBudget = () => {
    if (!budgetAlerts.length && isManager) return (
      <EmptyState
        icon="✅"
        title="All sites have healthy budgets"
        desc="Sites with less than 50 L remaining will appear here"
      />
    );
    if (!isManager) return (
      <EmptyState
        icon="🔒"
        title="Budget data restricted"
        desc="Budget alerts are visible to diesel managers and admins"
      />
    );

    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 13, color: neutral[500] }}>
          {budgetAlerts.length} site{budgetAlerts.length !== 1 ? 's' : ''} with &lt; 50 L remaining in cycle {selectedKey}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {budgetAlerts.map(a => (
            // alert_level is a 3-step escalation (exhausted > critical > warning)
            // distinct from the shared urgency scale's semantics, so these
            // stay their own literal colors rather than being forced onto it.
            <Card key={a.site_id} style={{ borderLeft: `4px solid ${a.alert_level === 'exhausted' ? '#dc2626' : a.alert_level === 'critical' ? '#f97316' : '#f59e0b'}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.site_name}</div>
              <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>{a.site_id} · {a.cluster}</div>
              <ProgressBar
                pct={100 - a.pct_remaining}
                color={a.alert_level === 'exhausted' ? '#dc2626' : a.alert_level === 'critical' ? '#f97316' : '#f59e0b'}
                height={8}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                <span style={{ color: neutral[400] }}>Used: {a.liters_used.toFixed(0)} L</span>
                <span style={{ fontWeight: 700, color: a.alert_level === 'exhausted' ? '#dc2626' : neutral[700] }}>
                  {a.liters_remaining.toFixed(0)} L left
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: a.alert_level === 'exhausted' ? '#dc2626' : a.alert_level === 'critical' ? '#f97316' : '#f59e0b' }}>
                {a.alert_level === 'exhausted' ? '❌ EXHAUSTED' : a.alert_level === 'critical' ? '🔴 CRITICAL' : '⚠ WARNING'}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 60px', fontFamily: font.ui }}>

      {/* ── Header ── */}
      <PageHeader
        title="⛽ Fuel Requests & Analytics"
        subtitle="Full lifecycle tracking — budget allocation → approval → purchase → refuel → consumption"
        actions={
          <>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)}
              aria-label="Export range start date"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 8px', fontSize: 12 }} />
            <span style={{ fontSize: 12, color: neutral[400] }}>→</span>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)}
              aria-label="Export range end date"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 8px', fontSize: 12 }} />
            <Btn onClick={handleExport} variant="secondary" size="sm">
              <FiDownload size={13} style={{ marginRight: 4 }} /> Export
            </Btn>
            <Btn onClick={loadAll} variant="ghost" size="sm">
              <FiRefreshCw size={13} />
            </Btn>
          </>
        }
      />

      {/* ── KPI row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isNarrow ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        <KpiCard label="Total Requests"      value={requests.length}             icon="📋" />
        <KpiCard label="Litres Requested"    value={`${totalLitersRequested} L`} icon="💧" color={urgencyTokens.medium.fg} />
        <KpiCard label="Litres Approved"     value={`${totalLitersApproved} L`}  icon="✅" color={statusTokens.success.text} />
        <KpiCard label="Actually Refueled"   value={`${totalRefueled} L`}        icon="⛽" color="#7c3aed" />
        <KpiCard label="My Pending Approvals" value={pendingForMe.length} icon="⏳"
          color={pendingForMe.length > 0 ? urgencyTokens.high.fg : neutral[700]}
          sub={overRefuel > 0 ? `⚠ ${overRefuel} over-refueled` : denied > 0 ? `${denied} denied` : undefined} />
      </div>

      {/* ── Budget alert banner ── */}
      {budgetAlerts.length > 0 && (
        <div style={{
          background: urgencyTokens.critical.bg, border: `1px solid ${statusTokens.danger.border}`, borderRadius: 10,
          padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <FiBell color={urgencyTokens.critical.fg} size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: urgencyTokens.critical.fg, fontSize: 13 }}>
              Budget Alert — {budgetAlerts.length} site{budgetAlerts.length !== 1 ? 's' : ''} with &lt;50 L remaining
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {budgetAlerts.slice(0, 6).map(a => (
                <span key={a.site_id} style={{
                  fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 8px',
                  background: a.alert_level === 'exhausted' ? statusTokens.danger.bg : statusTokens.warning.bg,
                  color: a.alert_level === 'exhausted' ? statusTokens.danger.text : statusTokens.warning.text,
                }}>
                  {a.site_name} — {a.liters_remaining.toFixed(0)} L
                </span>
              ))}
              {budgetAlerts.length > 6 && <span style={{ fontSize: 11, color: neutral[400] }}>+{budgetAlerts.length - 6} more</span>}
            </div>
          </div>
          <button onClick={() => setTab('budget')} style={{
            ...btnBase, background: urgencyTokens.critical.fg, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', whiteSpace: 'nowrap',
          }}>
            View All
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${neutral[200]}`, paddingBottom: 0 }}>
        {([
          { key: 'overview',    label: `Overview (${requests.length})`,            icon: <FiList size={14} />, badge: undefined as number | undefined },
          { key: 'approvals',   label: `My Approvals (${pendingForMe.length})`,    icon: <FiCheckCircle size={14} />, badge: pendingForMe.length as number | undefined },
          { key: 'consumption', label: 'Consumption',                              icon: <FiBarChart2 size={14} />, badge: undefined as number | undefined },
          { key: 'budget',      label: `Budget Alerts (${budgetAlerts.length})`,   icon: <FiBell size={14} />, badge: budgetAlerts.length as number | undefined },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'none', borderBottom: tab === t.key ? `2px solid ${brand.primary}` : '2px solid transparent',
            color: tab === t.key ? brand.primary : neutral[500],
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {t.icon} {t.label}
            {t.badge ? (
              <span style={{
                background: urgencyTokens.critical.fg, color: '#fff', borderRadius: 10,
                fontSize: 10, fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center',
              }}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner /></div>
      ) : (
        <>
          {tab === 'overview'    && renderOverview()}
          {tab === 'approvals'   && renderApprovals()}
          {tab === 'consumption' && renderConsumption()}
          {tab === 'budget'      && renderBudget()}
        </>
      )}

      {/* ── Approve modal ── */}
      <Modal isOpen={!!approveId} onClose={() => setApproveId(null)} title="Approve Fuel Request" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Which request */}
          {approveId && (() => {
            const req = [...requests, ...pendingForMe].find(r => r._id === approveId);
            return req ? (
              <div style={{ background: neutral[50], borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: neutral[900] }}>{req.site_name || req.site_id}</div>
                <div style={{ color: neutral[500], fontSize: 12, marginTop: 2 }}>
                  {req.liters_requested} L requested
                  {req.xaf_requested ? ` · XAF ${req.xaf_requested.toLocaleString()}` : ''}
                  {' · '}<StatusPill status={req.status} />
                </div>
              </div>
            ) : null;
          })()}

          {/* Finance only: override litres */}
          {approveId && (() => {
            const req = [...requests, ...pendingForMe].find(r => r._id === approveId);
            const myStep = req?.approvalChain?.find(s => s.approver.email === user?.email && s.status === 'pending');
            const isFinanceStep = myStep?.approver?.role === 'Finance Officer';
            return isFinanceStep ? (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Litres Approved
                  <span style={{ fontWeight: 400, color: neutral[400], marginLeft: 6 }}>
                    (leave blank to approve as-requested)
                  </span>
                </label>
                <input
                  type="number" min={1}
                  value={approveOverride}
                  onChange={e => setApproveOverride(e.target.value)}
                  aria-label="Litres approved override"
                  placeholder={approveId ? (() => {
                    const r = [...requests, ...pendingForMe].find(x => x._id === approveId);
                    return r ? `${r.liters_requested} L (as requested)` : 'Optional override';
                  })() : 'Optional override'}
                  style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const }}
                />
                {approveOverride && parseFloat(approveOverride) > 0 && (
                  <div style={{ fontSize: 11, color: neutral[500], marginTop: 3 }}>
                    ≈ XAF {Math.round(parseFloat(approveOverride) * 828).toLocaleString()}
                  </div>
                )}
              </div>
            ) : null;
          })()}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Comments</label>
            <textarea
              value={approveComment}
              onChange={e => setApproveComment(e.target.value)}
              rows={3}
              placeholder="Optional comments for the next approver..."
              aria-label="Approval comments"
              style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => { setApproveId(null); setApproveComment(''); setApproveOverride(''); }} variant="secondary">
              Cancel
            </Btn>
            {/* Btn has no "success" variant — primary + a green style override
                stands in for it, matching the pattern used on other pages. */}
            <Btn onClick={handleApprove} loading={approving} style={{ background: brand.success }}>
              <FiCheckCircle style={{ marginRight: 4 }} /> Approve
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal isOpen={!!rejectId} onClose={() => setRejectId(null)} title="Reject Fuel Request" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Which request */}
          {rejectId && (() => {
            const req = [...requests, ...pendingForMe].find(r => r._id === rejectId);
            return req ? (
              <div style={{ background: statusTokens.danger.bg, borderRadius: 8, padding: '10px 14px', fontSize: 13, border: `1px solid ${statusTokens.danger.border}` }}>
                <div style={{ fontWeight: 700, color: statusTokens.danger.text }}>{req.site_name || req.site_id}</div>
                <div style={{ color: neutral[500], fontSize: 12, marginTop: 2 }}>
                  {req.liters_requested} L · {req.urgency.toUpperCase()}
                </div>
              </div>
            ) : null;
          })()}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Reason for rejection <span style={{ color: urgencyTokens.critical.fg }}>*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Explain why this request is being rejected. The requester will see this reason."
              aria-label="Reason for rejection"
              style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => { setRejectId(null); setRejectReason(''); }} variant="secondary">
              Cancel
            </Btn>
            <Btn onClick={handleReject} variant="danger" loading={rejecting}>
              <FiXCircle style={{ marginRight: 4 }} /> Reject
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── View Request modal ── */}
      <Modal isOpen={!!viewReq} onClose={() => { setViewReq(null); setViewReqLoading(false); }} title={viewReq ? `FUEL-${viewReq._id.slice(-6).toUpperCase()} — ${viewReq.site_name}` : ''} size="xl">
        {viewReq && (
          <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Status + urgency */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <StatusPill status={viewReq.status} />
              <UrgencyPill urgency={viewReq.urgency} />
              {viewReqLoading && (
                <span style={{ fontSize: 11, color: neutral[400], marginLeft: 8, fontStyle: 'italic' }}>
                  Loading full details…
                </span>
              )}
            </div>
            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <SectionLabel>Request</SectionLabel>
                <div style={detailGrid}>
                  {[
                    ['Site', viewReq.site_name],
                    ['Site ID', viewReq.site_id],
                    ['Cluster', viewReq.cluster || '—'],
                    ['Cycle', viewReq.cycle_key],
                    ['Litres Requested', `${viewReq.liters_requested} L`],
                    ['Litres Approved', viewReq.liters_approved != null ? `${viewReq.liters_approved} L` : 'Pending'],
                    ['Actually Added', viewReq.liters_actually_added != null ? `${viewReq.liters_actually_added} L` : '—'],
                    ['XAF Requested', `XAF ${(viewReq.xaf_requested || 0).toLocaleString()}`],
                    ['Requested by', viewReq.requested_by?.fullName || '—'],
                    ['Created', fmtDate(viewReq.createdAt)],
                    ...(viewReq.assigned_to ? [['Assigned to', viewReq.assigned_to.fullName]] : []),
                    ...(viewReq.scheduled_date ? [['Scheduled', fmtDate(viewReq.scheduled_date)]] : []),
                    ...(viewReq.cycle_refuel_count ? [['Refuel count', `${viewReq.cycle_refuel_count}×`]] : []),
                  ].map(([k, v]) => (
                    <React.Fragment key={k as string}>
                      <span style={detailKey}>{k}</span>
                      <span style={detailVal}>{v}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: 10, background: neutral[50], borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Reason: </span>{viewReq.request_reason}
                </div>
              </div>
              <div>
                <SectionLabel>Budget Snapshot</SectionLabel>
                {viewReq.budget_snapshot ? (
                  <>
                    <div style={detailGrid}>
                      <span style={detailKey}>Cycle budget</span>
                      <span style={detailVal}>{viewReq.budget_snapshot.budget_liters_total} L</span>
                      <span style={detailKey}>Used (all)</span>
                      <span style={detailVal}>{viewReq.budget_snapshot.budget_liters_used} L</span>
                      <span style={detailKey}>Remaining</span>
                      <span style={{ ...detailVal, color: viewReq.budget_snapshot.budget_liters_remaining < 50 ? urgencyTokens.critical.fg : statusTokens.success.text, fontWeight: 700 }}>
                        {viewReq.budget_snapshot.budget_liters_remaining} L
                      </span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <ProgressBar
                        pct={viewReq.budget_snapshot.budget_liters_total > 0
                          ? Math.round((viewReq.budget_snapshot.budget_liters_used / viewReq.budget_snapshot.budget_liters_total) * 100)
                          : 0}
                        height={8}
                      />
                    </div>
                  </>
                ) : <span style={{ fontSize: 12, color: neutral[400] }}>No budget data</span>}

                <SectionLabel style={{ marginTop: 20 }}>Approval Trail</SectionLabel>
                <ApprovalTrail chain={viewReq.approvalChain || []} />
              </div>
            </div>

            {/* ── Refueling Execution Data ── */}
            {(viewReq as any).fuel_consumption && (() => {
              const fc = (viewReq as any).fuel_consumption;
              const f  = fc.fuel_data || {};
              const rt = fc.runtime_data || {};
              const mainPhotos        = Array.isArray(fc.photos)             ? fc.photos             : [];
              const measurePhotos     = Array.isArray(fc.measurement_photos) ? fc.measurement_photos : [];
              const guardPhotos       = Array.isArray(fc.guard_photos)       ? fc.guard_photos       : [];
              const allPhotos         = [...mainPhotos, ...measurePhotos, ...guardPhotos];
              return (
                <div style={{ borderTop: `1px solid ${neutral[200]}`, paddingTop: 20 }}>
                  <SectionLabel style={{ marginBottom: 14, color: brand.primary }}>⛽ Refueling Execution</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    {/* Fuel Data */}
                    <div>
                      <SectionLabel>Fuel Measurements</SectionLabel>
                      <div style={detailGrid}>
                        {[
                          ['Opening Level',    f.opening_level   != null ? `${f.opening_level} L`   : null],
                          ['Closing Level',    f.closing_level   != null ? `${f.closing_level} L`   : null],
                          ['Fuel Added',       f.fuel_added      != null ? `${f.fuel_added} L`       : null],
                          ['Fuel Consumed',    f.fuel_consumed   != null ? `${f.fuel_consumed} L`   : null],
                          ['Tank Capacity',    f.tank_capacity   != null ? `${f.tank_capacity} L`   : null],
                          ['Dip Stick Before', f.dip_stick_before_cm != null ? `${f.dip_stick_before_cm} cm` : null],
                          ['Dip Stick After',  f.dip_stick_after_cm  != null ? `${f.dip_stick_after_cm} cm`  : null],
                          ['Tank Notes',       f.tank_observations],
                          ['Sensor Status',    f.fuel_sensor_status],
                        ].filter(([,v]) => v != null).map(([k,v]) => (
                          <React.Fragment key={k as string}>
                            <span style={detailKey}>{k}</span>
                            <span style={detailVal}>{v}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    {/* Runtime & Truck */}
                    <div>
                      <SectionLabel>Runtime & Truck</SectionLabel>
                      <div style={detailGrid}>
                        {[
                          ['Opening Hours',  rt.opening_hours   != null ? `${rt.opening_hours} hrs`   : null],
                          ['Closing Hours',  rt.closing_hours   != null ? `${rt.closing_hours} hrs`   : null],
                          ['Runtime Hours',  rt.runtime_hours   != null ? `${rt.runtime_hours} hrs`   : null],
                          ['Truck Plate',    rt.truck_plate_number || fc.truck_plate_number],
                          ['Transfer Time',  rt.transfer_time_min != null ? `${rt.transfer_time_min} min` : null],
                        ].filter(([,v]) => v != null).map(([k,v]) => (
                          <React.Fragment key={k as string}>
                            <span style={detailKey}>{k}</span>
                            <span style={detailVal}>{v}</span>
                          </React.Fragment>
                        ))}
                      </div>
                      <SectionLabel style={{ marginTop: 14 }}>Personnel</SectionLabel>
                      <div style={detailGrid}>
                        {[
                          ['Guard Name', fc.guard_name],
                          ['Guard No.',  fc.guard_number],
                          ['FSE',        fc.fse_name],
                        ].filter(([,v]) => v).map(([k,v]) => (
                          <React.Fragment key={k as string}>
                            <span style={detailKey}>{k}</span>
                            <span style={detailVal}>{v}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    {/* Purchase / Tom Card */}
                    {(viewReq as any).fuel_purchase && (() => {
                      const fp = (viewReq as any).fuel_purchase;
                      return (
                        <div>
                          <SectionLabel>Purchase / Tom Card</SectionLabel>
                          <div style={detailGrid}>
                            {[
                              ['Tom Card',      fp.tom_card_number || (viewReq as any).tom_card_number],
                              ['Station',       fp.station || (viewReq as any).tom_card_station],
                              ['Receipt No.',   fp.receipt_number || (viewReq as any).tom_card_receipt_num],
                              ['Unit Price',    fp.unit_price_xaf != null ? `XAF ${fp.unit_price_xaf}/L` : null],
                              ['Total Cost',    fp.total_cost_xaf != null ? `XAF ${fp.total_cost_xaf.toLocaleString()}` : null],
                              ['Litres Bought', fp.liters_purchased != null ? `${fp.liters_purchased} L` : null],
                              ['Purchase Date', fp.purchase_date ? new Date(fp.purchase_date).toLocaleDateString() : null],
                            ].filter(([,v]) => v != null).map(([k,v]) => (
                              <React.Fragment key={k as string}>
                                <span style={detailKey}>{k}</span>
                                <span style={detailVal}>{v}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Photos */}
                  {allPhotos.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <SectionLabel>Photos ({allPhotos.length})</SectionLabel>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                        {allPhotos.map((photo: any, i: number) => {
                          const url     = typeof photo === 'string' ? photo : photo?.url || photo?.uri || photo?.path;
                          const caption = typeof photo === 'object' ? photo?.category || photo?.type : '';
                          if (!url) return null;
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', position: 'relative' }}>
                              <img
                                src={url}
                                alt={caption || `Photo ${i + 1}`}
                                style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8,
                                  border: `1px solid ${neutral[200]}`, display: 'block' }}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              {caption && (
                                <span style={{ fontSize: 10, color: neutral[500], textTransform: 'capitalize',
                                  display: 'block', textAlign: 'center', marginTop: 3 }}>
                                  {caption}
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Workflow timeline */}
                  {fc.workflow && fc.workflow.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <SectionLabel>Workflow Timeline</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {fc.workflow.map((step: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyTokens.ok.fg, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: neutral[700], textTransform: 'capitalize' }}>
                              {(step.type || step.stage || '').replace(/_/g, ' ')}
                            </span>
                            <span style={{ color: neutral[400] }}>
                              {step.timestamp ? new Date(step.timestamp).toLocaleString() : ''}
                            </span>
                            {step.note && <span style={{ color: neutral[500] }}>— {step.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Emergency override ──────────────────────────────────────────
                Restricted to admin/head_of_business/ceo (mirrors the backend
                guard on PATCH /:id/emergency-approve). Only shown for requests
                that aren't already in a terminal state, matching the backend's
                own check. Deliberately visually distinct from the ordinary
                approve/reject actions above — this is meant to feel like an
                exception, not a routine option. */}
            {canEmergencyOverride && !['approved','denied','refueled','completed'].includes(viewReq.status) && (
              <div style={{
                marginTop: 24, padding: 16, borderRadius: 10,
                border: `1px dashed ${urgencyTokens.critical.fg}`, background: urgencyTokens.critical.bg,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: statusTokens.danger.text }}>
                  ⚠️ Emergency Override
                </p>
                {/* Deliberately a shade darker than statusTokens.danger.text — this
                    body copy needs to read as secondary to the heading above it. */}
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#7f1d1d' }}>
                  Bypasses every remaining approval level immediately and marks this request
                  fully approved. Every approver and the requester will be notified, and a
                  permanent audit record is created with your name and the reason below.
                  Use only for genuine emergencies.
                </p>
                <Btn
                  size="sm"
                  variant="danger"
                  onClick={() => { setEmergencyId(viewReq._id); setEmergencyReason(''); setEmergencyLiters(''); }}
                >
                  Emergency Override…
                </Btn>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* ── Emergency override modal ── */}
      <Modal isOpen={!!emergencyId} onClose={() => setEmergencyId(null)} title="⚠️ Emergency Approval Override" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: urgencyTokens.critical.bg, border: `1px solid ${statusTokens.danger.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7f1d1d' }}>
            This immediately approves the request and skips every pending approval level.
            This action is logged and broadcast to the full approval chain — it cannot be undone.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Reason for override <span style={{ color: urgencyTokens.critical.fg }}>*</span>
            </label>
            <textarea
              value={emergencyReason}
              onChange={e => setEmergencyReason(e.target.value)}
              rows={4}
              placeholder="Explain the emergency — this is included in the audit trail and the notification sent to every approver."
              aria-label="Reason for emergency override"
              style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Liters approved (optional — defaults to liters requested)
            </label>
            <input
              type="number" min={0}
              value={emergencyLiters}
              onChange={e => setEmergencyLiters(e.target.value)}
              placeholder="Leave blank to approve the full requested amount"
              aria-label="Emergency override liters approved"
              style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setEmergencyId(null)} variant="secondary">
              Cancel
            </Btn>
            <Btn onClick={handleEmergencyOverride} variant="danger" loading={emergencyLoading} disabled={!emergencyReason.trim()}>
              Confirm Emergency Override
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── Consumption detail modal ── */}
      <Modal
        isOpen={!!viewConsumption}
        onClose={() => setViewConsumption(null)}
        title={`Consumption — ${viewConsumption?.site_name || viewConsumption?.site_id || ''}`}
        size="xl"
      >
        {viewConsumption && (() => {
          const r  = viewConsumption;
          const fr = r._fuelRequest;   // linked FuelRequest (if enriched)
          const f  = r.fuel_data || {}; const rt = r.runtime_data || {};
          const mainPhotos = Array.isArray(r.photos) ? r.photos as string[] : [];
          const guardPhotos = Array.isArray(r.guard_photos) ? r.guard_photos as string[] : [];
          const measurementPhotos = Array.isArray(r.measurement_photos) ? r.measurement_photos as string[] : [];
          return (
            <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <SectionLabel>Fuel Data</SectionLabel>
                  <div style={detailGrid}>
                    {[
                      ['Opening Level', `${f?.opening_level ?? '—'} L`],
                      ['Closing Level', `${f?.closing_level ?? '—'} L`],
                      ['Fuel Added',    `${f?.fuel_added    ?? '—'} L`],
                      ['Fuel Consumed', `${f?.fuel_consumed ?? '—'} L`],
                      ['Tank Capacity', `${f?.tank_capacity ?? '—'} L`],
                      ['Dip Stick Before', f?.dip_stick_before_cm != null ? `${f.dip_stick_before_cm} cm` : null],
                      ['Dip Stick After',  f?.dip_stick_after_cm  != null ? `${f.dip_stick_after_cm} cm`  : null],
                      ['Tank Observations', f?.tank_observations],
                      ['Sensor Status', f?.fuel_sensor_status],
                    ].filter(([,v]) => v != null).map(([k,v]) => (
                      <React.Fragment key={k as string}>
                        <span style={detailKey}>{k}</span>
                        <span style={detailVal}>{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Runtime & Truck</SectionLabel>
                  <div style={detailGrid}>
                    {[
                      ['Opening Hours', rt?.opening_hours != null ? `${rt.opening_hours} hrs` : null],
                      ['Closing Hours', rt?.closing_hours != null ? `${rt.closing_hours} hrs` : null],
                      ['Runtime Hours', rt?.runtime_hours != null ? `${rt.runtime_hours} hrs` : null],
                      ['Truck Plate',   rt?.truck_plate_number],
                      ['Flow Meter Before', rt?.truck_flow_meter_before_l != null ? `${rt.truck_flow_meter_before_l} L` : null],
                      ['Flow Meter After',  rt?.truck_flow_meter_after_l  != null ? `${rt.truck_flow_meter_after_l} L`  : null],
                      ['Transfer Time', rt?.transfer_time_min != null ? `${rt.transfer_time_min} min` : null],
                    ].filter(([,v]) => v != null).map(([k,v]) => (
                      <React.Fragment key={k as string}>
                        <span style={detailKey}>{k}</span>
                        <span style={detailVal}>{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  <SectionLabel style={{ marginTop: 16 }}>Personnel</SectionLabel>
                  <div style={detailGrid}>
                    {[
                      ['Guard Name', r.guard_name], ['Guard No.', r.guard_number],
                      ['FSE', r.fse_name], ['Planifier', r.planifier],
                    ].filter(([,v]) => v).map(([k,v]) => (
                      <React.Fragment key={k as string}>
                        <span style={detailKey}>{k}</span>
                        <span style={detailVal}>{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Metrics</SectionLabel>
                  <div style={detailGrid}>
                    {[
                      ['Consumption Rate', r.metrics?.consumption_rate != null ? `${r.metrics.consumption_rate} L/hr` : null],
                      ['Efficiency', r.metrics?.efficiency_rating],
                      ['Anomaly', r.metrics?.anomaly_detected ? '⚠ Detected' : null],
                    ].filter(([,v]) => v != null).map(([k,v]) => (
                      <React.Fragment key={k as string}>
                        <span style={detailKey}>{k}</span>
                        <span style={{ ...detailVal, color: k === 'Anomaly' ? urgencyTokens.critical.fg : detailVal.color }}>{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {r.comments && (
                    <>
                      <SectionLabel style={{ marginTop: 16 }}>Comments</SectionLabel>
                      <p style={{ fontSize: 13, color: neutral[700] }}>{r.comments}</p>
                    </>
                  )}
                </div>
              </div>
              {/* Photos */}
              {(mainPhotos.length > 0 || guardPhotos.length > 0 || measurementPhotos.length > 0) && (
                <div style={{ borderTop: `1px solid ${neutral[200]}`, paddingTop: 12 }}>
                  {mainPhotos.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <SectionLabel>Documentation ({mainPhotos.length})</SectionLabel>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {mainPhotos.map((u: any,i: number) => <PhotoThumb key={i} src={typeof u === 'string' ? u : u?.url || u?.uri || ''} label={`Photo ${i+1}`} />)}
                      </div>
                    </div>
                  )}
                  {guardPhotos.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <SectionLabel>Guard ({guardPhotos.length})</SectionLabel>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {guardPhotos.map((u: any,i: number) => <PhotoThumb key={i} src={typeof u === 'string' ? u : u?.url || u?.uri || ''} label={`Guard ${i+1}`} />)}
                      </div>
                    </div>
                  )}
                  {measurementPhotos.length > 0 && (
                    <div>
                      <SectionLabel>Measurements ({measurementPhotos.length})</SectionLabel>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {measurementPhotos.map((u: any,i: number) => <PhotoThumb key={i} src={typeof u === 'string' ? u : u?.url || u?.uri || ''} label={`Meas. ${i+1}`} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default FuelRequestsPage;