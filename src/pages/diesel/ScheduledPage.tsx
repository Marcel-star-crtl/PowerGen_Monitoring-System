/**
 * ScheduledPage.tsx  —  src/pages/diesel/ScheduledPage.tsx
 *
 * PURPOSE: Fuel request creation and scheduling hub for diesel_manager / admin.
 *
 * This page is where ALL new fuel requests are created (web side).
 * Organized into three workflow stages shown as distinct sections:
 *
 *   Stage 1 — Awaiting Approval   (pending_* statuses)
 *   Stage 2 — Ready to Schedule   (approved, not yet assigned)
 *   Stage 3 — Active / Executing  (scheduled | purchase_made)
 *
 * Also includes the legacy maintenance schedule tab.
 *
 * Key UX decisions:
 *  - Quantities shown ONLY when fully approved
 *  - Assign Refueler modal shows a real dropdown of technician/fuel users
 *  - Create request form includes fuel level bar preview + XAF calculation
 *  - Month cycle selector with last 6 months
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuthContext }   from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { dieselManagerAPI } from '@/api/endpoints/dieselManager';
import apiClient from '@/api/client';
import { Card }    from '@/components/common/Card';
import { Badge }   from '@/components/common/Badge';
import { Button }  from '@/components/common/Button';
import { Modal }   from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { Input }   from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FiCalendar, FiUser, FiMapPin, FiEye, FiPlus, FiRefreshCw,
  FiCheckCircle, FiClock, FiDroplet, FiXCircle, FiChevronDown,
  FiChevronRight, FiList, FiAlertCircle, FiZap,
} from 'react-icons/fi';

// ── Inline API ────────────────────────────────────────────────────────────────
const fuelRequestApi = {
  create:  (d: any)                => apiClient.post('/fuel-requests', d).then(r => r.data),
  list:    (p?: any)               => apiClient.get('/fuel-requests', { params: p }).then(r => r.data),
  approve: (id: string, d?: any)   => apiClient.patch(`/fuel-requests/${id}/approve`, d || {}).then(r => r.data),
  reject:  (id: string, c: string) => apiClient.patch(`/fuel-requests/${id}/reject`, { comments: c }).then(r => r.data),
  assign:  (id: string, d: any)    => apiClient.patch(`/fuel-requests/${id}/assign`, d).then(r => r.data),
  siteCycle: (site_id: string, cycle_key: string) => apiClient.get(`/fuel-requests/site/${site_id}/cycle/${cycle_key}`).then(r => r.data),
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
  site_id: string; site_name: string; cluster?: string;
  cycle_key: string;
  liters_requested: number;
  liters_approved?: number;
  xaf_requested: number; xaf_approved?: number;
  current_fuel_level?: number; fuel_percentage_at_request?: number;
  urgency: string; status: string; request_reason: string;
  approvalChain: ApprovalStep[];
  requested_by?: { fullName: string; email: string } | string;
  assigned_to?:  { _id: string; fullName: string; email: string; phone?: string } | string;
  scheduled_date?: string;
  budget_snapshot?: { budget_liters_total: number; budget_liters_remaining: number };
  cycle_refuel_count?: number;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LITER_TO_XAF = 828;

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; stage: number }> = {
  // Real backend statuses
  pending_diesel_coordinator: { label: 'Awaiting Minka',   bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_operations_manager: { label: 'Awaiting Pascal',  bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_technical_director: { label: 'Awaiting Didier',  bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_finance:            { label: 'Awaiting Finance',  bg: '#ede9fe', fg: '#5b21b6', stage: 1 },
  pending_head_of_business:   { label: 'Awaiting HOB',     bg: '#e0e7ff', fg: '#3730a3', stage: 1 },
  pending_ceo:                { label: 'Awaiting CEO',      bg: '#fae8ff', fg: '#86198f', stage: 1 },
  // New chain statuses (pending_l1 … pending_l6)
  pending_l1:                 { label: 'Awaiting Minka',   bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_l2:                 { label: 'Awaiting Pascal',  bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_l3:                 { label: 'Awaiting Didier',  bg: '#fef3c7', fg: '#92400e', stage: 1 },
  pending_l4:                 { label: 'Awaiting Finance',  bg: '#ede9fe', fg: '#5b21b6', stage: 1 },
  pending_l5:                 { label: 'Awaiting HOB',     bg: '#e0e7ff', fg: '#3730a3', stage: 1 },
  pending_l6:                 { label: 'Awaiting CEO',      bg: '#fae8ff', fg: '#86198f', stage: 1 },
  // Post-approval statuses
  approved:                   { label: 'Approved — Ready to Schedule', bg: '#dcfce7', fg: '#166534', stage: 2 },
  scheduled:                  { label: 'Scheduled',         bg: '#dbeafe', fg: '#1e40af', stage: 3 },
  purchase_made:              { label: 'Fuel Bought',       bg: '#ccfbf1', fg: '#134e4a', stage: 3 },
  refueled:                   { label: 'Refueled ✓',        bg: '#dcfce7', fg: '#166534', stage: 3 },
  completed:                  { label: 'Completed',         bg: '#f3f4f6', fg: '#374151', stage: 3 },
  denied:                     { label: 'Denied',            bg: '#fee2e2', fg: '#991b1b', stage: 0 },
  cancelled:                  { label: 'Cancelled',         bg: '#f3f4f6', fg: '#6b7280', stage: 0 },
};

const fmtDate = (d?: string) => !d ? '—' : new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || { label: status, bg: '#f3f4f6', fg: '#374151' };
  return <span style={{ display:'inline-block', fontSize:11, fontWeight:700, background:c.bg, color:c.fg, borderRadius:6, padding:'2px 8px' }}>{c.label}</span>;
}

function ApprovalDots({ chain }: { chain: ApprovalStep[] }) {
  return (
    <div style={{ display:'flex', gap:3, alignItems:'center' }}>
      {chain.map(s => (
        <div key={s.level} title={`L${s.level}: ${s.approver.name}`} style={{
          width:7, height:7, borderRadius:'50%',
          background: s.status==='approved' ? '#16a34a' : s.status==='rejected' ? '#dc2626' : '#d1d5db',
        }} />
      ))}
      <span style={{ fontSize:10, color:'#9ca3af', marginLeft:3 }}>
        {chain.filter(s => s.status==='approved').length}/{chain.length}
      </span>
    </div>
  );
}

function ProgressBar({ pct, color='#2563eb', height=5 }: { pct:number; color?:string; height?:number }) {
  return (
    <div style={{ background:'#e5e7eb', borderRadius:3, height, overflow:'hidden' }}>
      <div style={{ width:`${Math.min(pct,100)}%`, background:color, height, borderRadius:3 }} />
    </div>
  );
}

const btnBase: React.CSSProperties = { border:'none', borderRadius:6, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };
const sectionLabel: React.CSSProperties = { fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' };
const detailGrid: React.CSSProperties  = { display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 12px' };
const detailKey: React.CSSProperties   = { fontSize:12, color:'#9ca3af', whiteSpace:'nowrap' };
const detailVal: React.CSSProperties   = { fontSize:12, color:'#374151', fontWeight:500 };

// ── Form field styles (matches existing "Schedule Fuel Task" modal aesthetic) ─
const fieldLabel: React.CSSProperties  = { display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 };
const selectStyle: React.CSSProperties = {
  width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'9px 12px',
  fontSize:14, color:'#111827', background:'#fff', outline:'none', boxSizing:'border-box' as const,
};
const inputStyle: React.CSSProperties  = {
  width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'9px 12px',
  fontSize:14, color:'#111827', background:'#fff', outline:'none', boxSizing:'border-box' as const,
};

// ── ApprovalTrail mini ────────────────────────────────────────────────────────
function ApprovalTrail({ chain }: { chain: ApprovalStep[] }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {chain.map(s => (
        <div key={s.level} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
          <div style={{ marginTop:2, flexShrink:0 }}>
            {s.status==='approved' ? <FiCheckCircle size={13} color="#16a34a" /> :
             s.status==='rejected' ? <FiXCircle     size={13} color="#dc2626" /> :
                                     <FiClock        size={13} color="#9ca3af" />}
          </div>
          <div>
            <span style={{ fontSize:12, fontWeight:600, color:s.status==='pending'?'#9ca3af':'#374151' }}>
              L{s.level}: {s.approver.name}
            </span>
            {s.actionDate && <span style={{ fontSize:11, color:'#9ca3af', marginLeft:6 }}>{fmtDate(s.actionDate)}</span>}
            {s.comments && <p style={{ fontSize:11, color:'#6b7280', margin:'1px 0 0', fontStyle:'italic' }}>"{s.comments}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({
  req, onAssign, onView, onApprove, onReject, userEmail, isManager,
}: {
  req: FuelRequestDoc;
  onAssign?: (req: FuelRequestDoc) => void;
  onView:   (req: FuelRequestDoc) => void;
  onApprove:(id: string) => void;
  onReject: (id: string) => void;
  userEmail: string;
  isManager: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const cfg = STATUS_CONFIG[req.status];
  const isFullyApproved = ['approved','scheduled','purchase_made','refueled','completed'].includes(req.status);
  const approvedLiters  = req.liters_approved ?? req.liters_requested;
  const canAssign       = isManager && req.status === 'approved';

  // Approval permission check
  const myStep = req.approvalChain?.find(s => s.approver.email === userEmail && s.status === 'pending');
  const prevOk = myStep ? req.approvalChain.filter(s => s.level < myStep.level).every(s => s.status === 'approved') : false;
  const canAct = !!myStep && prevOk;

  const approvalPct = req.approvalChain?.length
    ? Math.round((req.approvalChain.filter(s => s.status==='approved').length / req.approvalChain.length) * 100) : 0;

  return (
    <div style={{
      background: '#fff', borderRadius: 10, marginBottom: 10,
      border: canAct ? '2px solid #f59e0b' : `1px solid ${cfg?.bg || '#e5e7eb'}`,
      overflow: 'hidden',
    }}>
      {/* Status bar at top */}
      <div style={{ height: 3, background: cfg?.fg || '#e5e7eb', opacity: 0.5 }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Row 1: site + status + quantity */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                {req.site_name || req.site_id}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, background: (
                  { low:'#f3f4f6', medium:'#dbeafe', high:'#fef3c7', critical:'#fee2e2' } as any
                )[req.urgency] || '#f3f4f6',
                color: (
                  { low:'#374151', medium:'#1e40af', high:'#92400e', critical:'#991b1b' } as any
                )[req.urgency] || '#374151',
                borderRadius: 5, padding: '1px 7px',
              }}>{req.urgency.toUpperCase()}</span>
              <StatusPill status={req.status} />
              {canAct && <span style={{ fontSize:10, fontWeight:800, background:'#fef3c7', color:'#92400e', borderRadius:4, padding:'1px 6px' }}>↑ YOUR TURN</span>}
              {(req.cycle_refuel_count || 0) > 3 && <span style={{ fontSize:10, fontWeight:800, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'1px 6px' }}>⚠ {req.cycle_refuel_count}× refueled</span>}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
              {req.site_id}
              {req.cluster && ` · ${req.cluster}`}
              {` · FUEL-${req._id.slice(-6).toUpperCase()}`}
              {` · ${fmtDate(req.createdAt)}`}
              {req.requested_by && ` · ${typeof req.requested_by === 'string' ? req.requested_by : req.requested_by.fullName}`}
            </div>
          </div>
          {/* Quantity — only show when fully approved */}
          <div style={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
            {isFullyApproved ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{approvedLiters} L</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>XAF {(approvedLiters * LITER_TO_XAF).toLocaleString()}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#9ca3af' }}>{req.liters_requested} L</div>
                <div style={{ fontSize: 10, color: '#d1d5db' }}>awaiting approval</div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: approval dots + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <ProgressBar pct={approvalPct} color="#16a34a" />
            <div style={{ marginTop: 4 }}>
              <ApprovalDots chain={req.approvalChain || []} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => onView(req)} style={{ ...btnBase, background:'#f3f4f6', color:'#374151', fontSize:12, padding:'5px 10px' }}>
              <FiEye size={13} style={{ marginRight:4 }} />View
            </button>
            {canAct && (
              <>
                <button onClick={() => onApprove(req._id)} style={{ ...btnBase, background:'#dcfce7', color:'#166534', fontSize:12, padding:'5px 10px' }}>
                  <FiCheckCircle size={13} style={{ marginRight:4 }} />Approve
                </button>
                <button onClick={() => onReject(req._id)} style={{ ...btnBase, background:'#fee2e2', color:'#991b1b', fontSize:12, padding:'5px 10px' }}>
                  <FiXCircle size={13} style={{ marginRight:4 }} />Reject
                </button>
              </>
            )}
            {canAssign && (
              <button onClick={() => onAssign?.(req)} style={{ ...btnBase, background:'#1e3a5f', color:'#fff', fontSize:12, padding:'5px 12px', fontWeight:700 }}>
                <FiUser size={13} style={{ marginRight:4 }} />Assign Refueler
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} style={{ ...btnBase, background:'#f3f4f6', color:'#374151' }}>
              {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
            </button>
          </div>
        </div>

        {/* Assignment badge */}
        {req.assigned_to && (
          <div style={{ marginTop: 8, background:'#eff6ff', borderRadius:6, padding:'5px 10px', fontSize:12, color:'#1e40af', display:'flex', alignItems:'center', gap:6 }}>
            <FiUser size={12} />
            <span style={{ color:'#1e40af', fontWeight:700 }}>👷 Refueler: {(req.assigned_to as any)?.fullName || (req.assigned_to as any)?.email}</span>
            {req.scheduled_date && ` · Scheduled ${fmtDate(req.scheduled_date)}`}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop:'1px solid #f3f4f6', padding:'12px 14px', background:'#fafafa' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <p style={sectionLabel}>Details</p>
              <div style={detailGrid}>
                <span style={detailKey}>Reason</span>
                <span style={detailVal}>{req.request_reason}</span>
                <span style={detailKey}>Fuel at request</span>
                <span style={detailVal}>{req.current_fuel_level ?? '—'} L ({req.fuel_percentage_at_request ?? '—'}%)</span>
                {req.budget_snapshot && <>
                  <span style={detailKey}>Cycle budget</span>
                  <span style={detailVal}>{req.budget_snapshot.budget_liters_total} L</span>
                  <span style={detailKey}>Budget remaining</span>
                  <span style={{ ...detailVal, color: req.budget_snapshot.budget_liters_remaining < 50 ? '#dc2626' : '#059669', fontWeight:700 }}>
                    {req.budget_snapshot.budget_liters_remaining} L
                  </span>
                </>}
              </div>
            </div>
            <div>
              <p style={sectionLabel}>Approval Trail</p>
              <ApprovalTrail chain={req.approvalChain || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stage section header ──────────────────────────────────────────────────────
function StageHeader({ number, label, count, color, icon }: {
  number: number; label: string; count: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, marginTop:number > 1 ? 28 : 0 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>
        {number}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
        {icon}
        <span style={{ fontWeight:700, fontSize:16, color:'#111827' }}>{label}</span>
        <span style={{ background:color, color:'#fff', fontSize:11, fontWeight:800, borderRadius:10, padding:'2px 8px' }}>{count}</span>
      </div>
      <div style={{ flex:1, height:1, background:'#e5e7eb' }} />
    </div>
  );
}

// ── Fuel level preview bar ────────────────────────────────────────────────────
function FuelLevelPreview({ current, capacity, requested }: { current: number; capacity: number; requested: number }) {
  if (!capacity || !current) return null;
  const currentPct = Math.min((current / capacity) * 100, 100);
  const afterPct   = Math.min(((current + requested) / capacity) * 100, 100);
  return (
    <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
        <span>Current: {current} L ({Math.round(currentPct)}%)</span>
        <span>After refuel: {current + requested} L ({Math.round(afterPct)}%)</span>
      </div>
      <div style={{ position: 'relative', background: '#e5e7eb', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: `${currentPct}%`, height: '100%', background: currentPct < 20 ? '#ef4444' : '#f97316', borderRadius: 4 }} />
        {requested > 0 && <div style={{ position: 'absolute', left: `${currentPct}%`, top: 0, width: `${Math.min(afterPct - currentPct, 100 - currentPct)}%`, height: '100%', background: '#22c55e', opacity: 0.7 }} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const ScheduledPage: React.FC = () => {
  const { user }              = useAuthContext();
  const { isNarrow, isMobile } = useBreakpoint();
  const { success, error: showError } = useNotification();

  // Cycles from DB (same source as TomCardPage / FinanceDashboard)
  const [cycles,   setCycles]   = useState<{cycle_key:string; label:string; status:string}[]>([]);
  const [cycleKey, setCycleKey] = useState('');
  useEffect(() => {
    import('@/api/dieselApi').then(({ cyclesApi }) => {
      cyclesApi.list()
        .then(res => {
          const list = res.data || [];
          setCycles(list);
          if (list.length > 0) setCycleKey(list[0].cycle_key);
        })
        .catch(() => {
          // Fallback to current month
          const d = new Date();
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          setCycles([{ cycle_key: key, label: d.toLocaleDateString('en-GB', { year:'numeric', month:'long' }), status: 'open' }]);
          setCycleKey(key);
        });
    });
  }, []);

  const [tab, setTab] = useState<'fuel' | 'maintenance'>('fuel');

  // Data
  const [requests, setRequests]       = useState<FuelRequestDoc[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [sites, setSites]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [maintLoading, setMaintLoading] = useState(false);

  const isManager = ['diesel_manager', 'admin'].includes(user?.role || '');

  // ── Create modal ──────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    site_id:            '',   // IHS site ID (e.g. IHS_BNB_004)
    site_name:          '',   // auto-filled on site selection
    liters_requested:   '',
    request_reason:     '',
    urgency:            'medium',
    current_fuel_level: '',
    tank_capacity:      '',
    assigned_to:        '',   // pre-assign technician (optional)
    scheduled_datetime: '',   // ISO datetime for when refueling should happen
    notes:              '',   // free-text notes shown on card
  });
  const [creating, setCreating]     = useState(false);
  const [siteBudgetInfo,  setSiteBudgetInfo]  = useState<any>(null);
  const [siteReqHistory,  setSiteReqHistory]  = useState<any[]>([]);
  const [siteInfoLoading, setSiteInfoLoading] = useState(false);

  // ── Assign modal ──────────────────────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState<FuelRequestDoc | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDate, setAssignDate]     = useState('');
  const [assigning, setAssigning]       = useState(false);

  // ── Approve modal ─────────────────────────────────────────────────────────────
  const [approveId, setApproveId]       = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [approveOverride, setApproveOverride] = useState('');
  const [approving, setApproving]       = useState(false);

  // ── Reject modal ──────────────────────────────────────────────────────────────
  const [rejectId, setRejectId]         = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting]       = useState(false);

  // ── View modal ────────────────────────────────────────────────────────────────
  const [viewReq, setViewReq]           = useState<FuelRequestDoc | null>(null);

  // ── Emergency override — mirrors FuelRequestsPage.tsx's implementation.
  // Bypasses the entire approval chain; backend restricts this to
  // admin/head_of_business/ceo (see PATCH /:id/emergency-approve).
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyLiters, setEmergencyLiters] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const canEmergencyOverride = ['admin', 'head_of_business', 'ceo'].includes(user?.role || '');

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fuelRequestApi.list({ cycle_key: cycleKey, limit: 300 });
      setRequests(res.data || []);
    } catch { showError('Failed to load requests'); }
    finally { setLoading(false); }
  }, [cycleKey]);

  const loadMaintenance = useCallback(async () => {
    setMaintLoading(true);
    try {
      const res = await dieselManagerAPI.getScheduledMaintenance();
      setMaintenance(res.data || []);
    } catch { /* no-op */ }
    finally { setMaintLoading(false); }
  }, []);

  const loadSites = useCallback(async () => {
    try {
      const res = await dieselManagerAPI.getSites();
      // getSites may return { data: Site[] } or { data: { data: Site[] } } depending on wrapper
      const raw  = res.data || res;
      const list: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw.data) ? raw.data : []);
      list.sort((a: any, b: any) => (a.Site_Name || '').localeCompare(b.Site_Name || ''));
      setSites(list);
    } catch { /* no-op — site dropdown stays empty */ }
  }, []);

  const loadTechnicians = useCallback(async () => {
    try {
      const res = await dieselManagerAPI.getTechnicians();
      setTechnicians((res.data || []).filter((t: any) => ['technician','fuel'].includes(t.role)));
    } catch { /* no-op */ }
  }, []);

  useEffect(() => { loadRequests(); loadMaintenance(); loadTechnicians(); loadSites(); }, [loadRequests, loadMaintenance, loadTechnicians, loadSites]);

  // ── Derived sets ──────────────────────────────────────────────────────────────
  const activeRequests   = requests.filter(r => !['denied','completed','refueled','cancelled'].includes(r.status));
  const awaitingApproval = activeRequests.filter(r => r.status.startsWith('pending_'));
  // Fully approved and NOT yet assigned to a refueler → diesel manager needs to assign
  const readyToSchedule  = activeRequests.filter(r =>
    r.status === 'approved' ||
    (r.status === 'scheduled' && !r.assigned_to)
  );
  // Assigned to a refueler and actively in execution
  const inExecution      = activeRequests.filter(r =>
    (r.status === 'scheduled' && !!r.assigned_to) ||
    r.status === 'purchase_made'
  );
  // My assigned requests — for non-manager users who raised requests that are now scheduled to them
  const myAssigned = user && !['diesel_manager', 'admin'].includes(user.role || '')
    ? activeRequests.filter(r =>
        (r.assigned_to as any)?._id === user.id ||
        (r.assigned_to as any) === user.id ||
        r.requested_by === user.id
      ).filter(r => ['scheduled', 'approved', 'purchase_made'].includes(r.status))
    : [];

  // KPIs
  const totalApprovedLiters = readyToSchedule.reduce((s,r) => s + (r.liters_approved ?? r.liters_requested), 0)
    + inExecution.reduce((s,r) => s + (r.liters_approved ?? r.liters_requested), 0);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.site_id) { showError('Please select a site'); return; }
    if (!createForm.liters_requested || parseFloat(createForm.liters_requested) <= 0) { showError('Enter a valid quantity'); return; }
    if (!createForm.request_reason.trim()) { showError('Reason is required'); return; }
    setCreating(true);
    try {
      await fuelRequestApi.create({
        site_id:            createForm.site_id,
        liters_requested:   parseFloat(createForm.liters_requested),
        request_reason:     createForm.request_reason.trim(),
        urgency:            createForm.urgency,
        current_fuel_level: createForm.current_fuel_level ? parseFloat(createForm.current_fuel_level) : undefined,
        tank_capacity:      createForm.tank_capacity      ? parseFloat(createForm.tank_capacity)       : undefined,
        assigned_to:        createForm.assigned_to        || undefined,
        scheduled_date:     createForm.scheduled_datetime || undefined,
        request_source:     'web',
      });
      success('Request submitted — Minka Kevin has been notified for approval');
      setShowCreate(false);
      setCreateForm({
        site_id:'', site_name:'', liters_requested:'', request_reason:'', urgency:'medium',
        current_fuel_level:'', tank_capacity:'', assigned_to:'', scheduled_datetime:'', notes:'',
      });
      loadRequests();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to create request');
    } finally { setCreating(false); }
  };

  // When a site is selected, auto-fill fuel level + capacity from site data
  const handleSiteSelect = async (siteId: string) => {
    const site = sites.find((s: any) => s.IHS_ID_SITE === siteId);
    if (!site) {
      setCreateForm(f => ({ ...f, site_id: '', site_name: '' }));
      setSiteBudgetInfo(null);
      setSiteReqHistory([]);
      return;
    }
    setCreateForm(f => ({
      ...f,
      site_id:            site.IHS_ID_SITE,
      site_name:          site.Site_Name || site.IHS_ID_SITE,
      current_fuel_level: String(site.Fuel_Quantity_Found ?? site.Previous_Fuel_Quantity ?? ''),
      tank_capacity:      String(site.Tank_Capacity ?? ''),
    }));

    // Load budget utilisation + request history for this site in parallel
    setSiteInfoLoading(true);
    setSiteBudgetInfo(null);
    setSiteReqHistory([]);
    try {
      const [budgetRes, histRes] = await Promise.allSettled([
        apiClient.get('/site-budget/' + cycleKey + '/utilisation', { params: { cluster: site.GRATO_Cluster } })
          .then(r => (r.data?.data || []).find((b: any) => b.site_id === site.IHS_ID_SITE)),
        fuelRequestApi.siteCycle(site.IHS_ID_SITE, cycleKey).then(r => r?.data || []),
      ]);
      if (budgetRes.status === 'fulfilled') setSiteBudgetInfo(budgetRes.value || null);
      if (histRes.status === 'fulfilled')   setSiteReqHistory(histRes.value || []);
    } catch { /* non-fatal */ }
    finally { setSiteInfoLoading(false); }
  };

  // Auto-open the create-request modal, pre-selected to a specific site,
  // when arriving via ?create_for_site= (the Live Site Map's "Create Fuel
  // Request" quick action for critical/high urgency sites). Only fires
  // once sites have actually loaded, and only once per param value, so it
  // doesn't reopen if the manager closes the modal and keeps working.
  const [searchParams] = useSearchParams();
  const createForSiteParam = searchParams.get('create_for_site');
  const [autoOpenedForSite, setAutoOpenedForSite] = useState<string | null>(null);
  useEffect(() => {
    if (!createForSiteParam || autoOpenedForSite === createForSiteParam || sites.length === 0) return;
    const match = sites.find((s: any) => s.IHS_ID_SITE === createForSiteParam);
    if (match) {
      setShowCreate(true);
      handleSiteSelect(createForSiteParam);
      setAutoOpenedForSite(createForSiteParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForSiteParam, sites, autoOpenedForSite]);

  const handleAssign = async () => {
    if (!assignTarget || !assignUserId) { showError('Select a refueler'); return; }
    setAssigning(true);
    try {
      await fuelRequestApi.assign(assignTarget._id, { assigned_to: assignUserId, scheduled_date: assignDate || undefined });
      success('Refueler assigned — site appears on their mobile dashboard');
      setAssignTarget(null); setAssignUserId(''); setAssignDate('');
      loadRequests();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Assignment failed');
    } finally { setAssigning(false); }
  };

  const handleApprove = async () => {
    if (!approveId) return;
    setApproving(true);
    try {
      await fuelRequestApi.approve(approveId, {
        comments: approveComment,
        liters_approved: approveOverride ? parseFloat(approveOverride) : undefined,
      });
      success('Approved');
      setApproveId(null); setApproveComment(''); setApproveOverride('');
      loadRequests();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Approval failed');
    } finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) { showError('Reason required'); return; }
    setRejecting(true);
    try {
      await fuelRequestApi.reject(rejectId, rejectReason);
      success('Rejected');
      setRejectId(null); setRejectReason('');
      loadRequests();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Rejection failed');
    } finally { setRejecting(false); }
  };

  const handleEmergencyOverride = async () => {
    if (!emergencyId || !emergencyReason.trim()) { showError('An override reason is required'); return; }
    setEmergencyLoading(true);
    try {
      const res: any = await fuelRequestApi.emergencyApprove(emergencyId, {
        override_reason: emergencyReason.trim(),
        liters_approved: emergencyLiters ? parseFloat(emergencyLiters) : undefined,
      });
      const skipped = res?.skipped_steps?.length ?? 0;
      success(`Emergency approval granted — ${skipped} approval level(s) bypassed. All approvers and the requester have been notified.`);
      setEmergencyId(null); setEmergencyReason(''); setEmergencyLiters('');
      loadRequests();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Emergency override failed');
    } finally { setEmergencyLoading(false); }
  };

  // ── Form preview calc ─────────────────────────────────────────────────────────
  const litresNum  = parseFloat(createForm.liters_requested) || 0;
  const xafPreview = Math.round(litresNum * LITER_TO_XAF);
  const needsCEO   = litresNum >= 100;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#111827', margin:0 }}>Scheduled Refueling</h1>
          <p style={{ fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>
            Create and track refueling requests — from approval through to execution
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={cycleKey} onChange={e => setCycleKey(e.target.value)}
            aria-label="Select billing cycle"
            style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', fontSize:13 }}>
            {cycles.map(c => (
              <option key={c.cycle_key} value={c.cycle_key}>
                {c.label || c.cycle_key}{c.status && c.status !== 'open' ? ` (${c.status})` : ''}
              </option>
            ))}
          </select>
          <Button onClick={() => { loadRequests(); loadMaintenance(); }} variant="ghost" size="sm">
            <FiRefreshCw size={13} />
          </Button>
          {isManager && (
            <Button onClick={() => setShowCreate(true)} variant="primary">
              <FiPlus style={{ marginRight:6 }} /> New Fuel Request
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isNarrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label:'Awaiting Approval', value:awaitingApproval.length, color:'#f59e0b', icon:<FiClock size={20}/> },
          { label:'Ready to Schedule', value:readyToSchedule.length,  color:'#16a34a', icon:<FiCheckCircle size={20}/> },
          { label:'In Execution',      value:inExecution.length,      color:'#2563eb', icon:<FiZap size={20}/> },
          { label:'Approved Litres',   value:`${totalApprovedLiters} L`, color:'#7c3aed', icon:<FiDroplet size={20}/> },
        ].map(k => (
          <Card key={k.label} style={{ borderTop: `3px solid ${k.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:11, color:'#9ca3af', margin:'0 0 4px' }}>{k.label}</p>
                <p style={{ fontSize:24, fontWeight:800, color:k.color, margin:0 }}>{k.value}</p>
              </div>
              <div style={{ color:k.color, opacity:0.25 }}>{k.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid #e5e7eb', paddingBottom:0 }}>
        {[
          { key:'fuel',        label:`Fuel Requests (${activeRequests.length})` },
          { key:'maintenance', label:`Maintenance Tasks (${maintenance.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding:'8px 16px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background:'none', borderBottom: tab===t.key ? '2px solid #1e3a5f' : '2px solid transparent',
            color: tab===t.key ? '#1e3a5f' : '#6b7280', marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── FUEL TAB ── */}
      {tab === 'fuel' && (
        loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}><Spinner size="lg" /></div>
        ) : activeRequests.length === 0 ? (
          <EmptyState
            icon={<FiDroplet size={48} color="#d1d5db" />}
            title={`No fuel requests for ${cycleKey}`}
            description={isManager ? 'Click "New Fuel Request" to create one' : 'Requests will appear here once created'}
            actionLabel={isManager ? 'Create Request' : undefined}
            onAction={isManager ? () => setShowCreate(true) : undefined}
          />
        ) : (
          <>
            {/* My Scheduled Refueling — for technicians whose requests were approved */}
            {myAssigned.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'10px 14px', background:'#dbeafe', borderRadius:10, border:'1px solid #93c5fd' }}>
                  <span style={{ fontSize:18 }}>⛽</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1e40af' }}>
                      Your Scheduled Refueling Tasks ({myAssigned.length})
                    </div>
                    <div style={{ fontSize:12, color:'#3b82f6', marginTop:2 }}>
                      These requests have been approved and assigned to you
                    </div>
                  </div>
                </div>
                {myAssigned.map(r => (
                  <RequestCard
                    key={r._id}
                    req={r}
                    onView={setViewReq}
                    onAssign={isManager ? setAssignTarget : undefined}
                    onApprove={setApproveId}
                    onReject={setRejectId}
                    userEmail={user?.email || ''}
                    isManager={false}
                  />
                ))}
              </div>
            )}

            {/* Stage 2: Ready to Schedule */}
            {readyToSchedule.length > 0 && (
              <div style={{ marginBottom:8 }}>
                <StageHeader number={2} label="✅ Approved & Scheduled — Assign a Refueler" count={readyToSchedule.length} color="#16a34a" icon={<FiCheckCircle size={16} color="#16a34a" />} />
                {readyToSchedule.map(r => (
                  <RequestCard key={r._id} req={r} onAssign={setAssignTarget} onView={setViewReq}
                    onApprove={setApproveId} onReject={setRejectId}
                    userEmail={user?.email || ''} isManager={isManager} />
                ))}
              </div>
            )}

            {/* Stage 3: In Execution */}
            {inExecution.length > 0 && (
              <div style={{ marginBottom:8 }}>
                <StageHeader number={3} label="In Execution" count={inExecution.length} color="#2563eb" icon={<FiZap size={16} color="#2563eb" />} />
                {inExecution.map(r => (
                  <RequestCard key={r._id} req={r} onAssign={setAssignTarget} onView={setViewReq}
                    onApprove={setApproveId} onReject={setRejectId}
                    userEmail={user?.email || ''} isManager={isManager} />
                ))}
              </div>
            )}

            {/* Stage 1: Awaiting Approval */}
            {awaitingApproval.length > 0 && (
              <div>
                <StageHeader number={1} label="Awaiting Approval" count={awaitingApproval.length} color="#f59e0b" icon={<FiClock size={16} color="#f59e0b" />} />
                {awaitingApproval.map(r => (
                  <RequestCard key={r._id} req={r} onAssign={setAssignTarget} onView={setViewReq}
                    onApprove={setApproveId} onReject={setRejectId}
                    userEmail={user?.email || ''} isManager={isManager} />
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* ── MAINTENANCE TAB ── */}
      {tab === 'maintenance' && (
        maintLoading ? <Spinner /> :
        maintenance.length === 0 ? (
          <EmptyState icon={<FiList size={48} color="#d1d5db" />} title="No maintenance tasks scheduled" />
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
            {maintenance.map((m: any) => (
              <Card key={m._id}>
                <div style={{ fontWeight:700, fontSize:14 }}>{m.site_details?.Site_Name || m.site_id}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>{m.site_id}</div>
                <div style={{ ...detailGrid }}>
                  <span style={detailKey}>Technician</span>
                  <span style={detailVal}>{m.technician?.fullName || m.technician_name || '—'}</span>
                  <span style={detailKey}>Type</span>
                  <span style={detailVal}>{m.visit_type || 'RF'}</span>
                  <span style={detailKey}>Date</span>
                  <span style={detailVal}>{fmtDate(m.visit_date || m.scheduled_date)}</span>
                  <span style={detailKey}>Status</span>
                  <span style={detailVal}>{m.status}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ══ SCHEDULE FUEL TASK MODAL ══ */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Fuel Task" size="lg">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Row 1: Site + Technician */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={fieldLabel} htmlFor="sched-site">Site *</label>
              <select
                id="sched-site"
                value={createForm.site_id}
                onChange={e => handleSiteSelect(e.target.value)}
                style={{ ...selectStyle, borderColor: !createForm.site_id ? '#fca5a5' : '#e5e7eb' }}
              >
                <option value="">Select Site</option>
                {sites.map((s: any) => (
                  <option key={s.IHS_ID_SITE} value={s.IHS_ID_SITE}>
                    {s.Site_Name || s.IHS_ID_SITE}
                  </option>
                ))}
              </select>
              {createForm.site_id && (
                <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                  {createForm.site_id}
                  {createForm.current_fuel_level && ` · Current: ${createForm.current_fuel_level} L`}
                  {createForm.tank_capacity      && ` / ${createForm.tank_capacity} L`}
                </div>
              )}

              {/* ── Budget exhaustion banner ── */}
              {siteInfoLoading && <div style={{ fontSize:11, color:'#9ca3af', padding:'4px 0' }}>Loading budget…</div>}
              {!siteInfoLoading && siteBudgetInfo && (() => {
                const rem  = Math.round(siteBudgetInfo.liters_remaining || 0);
                const tot  = Math.round(siteBudgetInfo.budget_liters    || 0);
                const pct  = siteBudgetInfo.utilisation_pct || 0;
                const al   = siteBudgetInfo.alert_level;
                const isEx = al === 'exhausted', isCr = al === 'critical' || al === 'high';
                return (
                  <div style={{
                    margin:'8px 0', padding:'9px 12px', borderRadius:8,
                    border:`1px solid ${isEx ? '#fca5a5' : isCr ? '#fde68a' : '#bbf7d0'}`,
                    background: isEx ? '#fff5f5' : isCr ? '#fffbeb' : '#f0fdf4',
                    fontSize: 12,
                  }}>
                    <div style={{ fontWeight:700, color: isEx ? '#dc2626' : isCr ? '#d97706' : '#16a34a', marginBottom:3 }}>
                      {isEx ? '🚫 Budget Exhausted' : isCr ? '⚠️ Budget Running Low' : '✅ Budget Available'}
                    </div>
                    <div style={{ color:'#374151' }}>
                      <strong>{rem.toLocaleString()} L</strong> remaining of <strong>{tot.toLocaleString()} L</strong>
                      {' · '}{pct}% used
                      {siteBudgetInfo.in_deficit && (
                        <span style={{ color:'#dc2626', marginLeft:6 }}>
                          ({Math.round(siteBudgetInfo.deficit_liters||0)} L deficit)
                        </span>
                      )}
                    </div>
                    {isEx && <div style={{ color:'#dc2626', fontSize:11, marginTop:4 }}>
                      Transfer fuel from another cluster or request budget extension before scheduling.
                    </div>}
                  </div>
                );
              })()}

              {/* ── Request history this cycle ── */}
              {!siteInfoLoading && siteReqHistory.length > 0 && (
                <div style={{ margin:'6px 0', padding:'9px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:12 }}>
                  <div style={{ fontWeight:700, color:'#374151', marginBottom:5 }}>
                    {siteReqHistory.length} request{siteReqHistory.length !== 1 ? 's' : ''} this cycle
                  </div>
                  {siteReqHistory.slice(0, 5).map((r: any) => (
                    <div key={r._id} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid #e5e7eb' }}>
                      <span style={{ color:'#6b7280' }}>{(r.liters_approved ?? r.liters_requested)} L · {(r.urgency||'').toUpperCase()}</span>
                      <span style={{
                        padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700,
                        background: r.status==='refueled'||r.status==='completed' ? '#dcfce7'
                          : r.status?.startsWith('pending_') ? '#fef9c3'
                          : ['approved','scheduled'].includes(r.status) ? '#dbeafe' : '#fee2e2',
                        color: r.status==='refueled'||r.status==='completed' ? '#16a34a'
                          : r.status?.startsWith('pending_') ? '#a16207'
                          : ['approved','scheduled'].includes(r.status) ? '#1d4ed8' : '#dc2626',
                      }}>
                        {(r.status||'').replace('pending_','').replace(/_/g,' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {siteReqHistory.length > 5 && <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>+{siteReqHistory.length-5} more</div>}
                </div>
              )}
            </div>
            <div>
              <label style={fieldLabel} htmlFor="sched-technician">Technician</label>
              <select
                id="sched-technician"
                value={createForm.assigned_to}
                onChange={e => setCreateForm(f => ({ ...f, assigned_to: e.target.value }))}
                style={selectStyle}
              >
                <option value="">Select Technician</option>
                {technicians.map((t: any) => (
                  <option key={t._id} value={t._id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Maintenance type (fixed RF) + Scheduled Date & Time */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={fieldLabel} htmlFor="sched-maint-type">Maintenance Type</label>
              <select id="sched-maint-type" disabled style={{ ...selectStyle, background:'#f9fafb', color:'#6b7280' }}>
                <option>Refueling</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel} htmlFor="sched-datetime">Scheduled Date & Time</label>
              <input
                id="sched-datetime"
                type="datetime-local"
                value={createForm.scheduled_datetime}
                onChange={e => setCreateForm(f => ({ ...f, scheduled_datetime: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 3: Priority + Litres Requested */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={fieldLabel} htmlFor="sched-priority">Priority</label>
              <select
                id="sched-priority"
                value={createForm.urgency}
                onChange={e => setCreateForm(f => ({ ...f, urgency: e.target.value }))}
                style={selectStyle}
              >
                <option value="">Select Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel} htmlFor="sched-liters">Litres Requested *</label>
              <input
                id="sched-liters"
                type="number" min={1}
                value={createForm.liters_requested}
                onChange={e => setCreateForm(f => ({ ...f, liters_requested: e.target.value }))}
                placeholder="e.g. 300"
                style={inputStyle}
              />
              {litresNum > 0 && (
                <div style={{ fontSize:11, marginTop:3, display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ color:'#374151', fontWeight:600 }}>≈ XAF {xafPreview.toLocaleString()}</span>
                  {needsCEO && <span style={{ background:'#fef3c7', color:'#92400e', fontWeight:700, borderRadius:5, padding:'1px 7px', fontSize:10 }}>👑 CEO required</span>}
                </div>
              )}
            </div>
          </div>

          {/* Fuel level preview bar — auto-filled from site data */}
          {createForm.current_fuel_level && createForm.tank_capacity && litresNum > 0 && (
            <FuelLevelPreview
              current={parseFloat(createForm.current_fuel_level) || 0}
              capacity={parseFloat(createForm.tank_capacity) || 0}
              requested={litresNum}
            />
          )}

          {/* Notes */}
          <div>
            <label style={fieldLabel} htmlFor="sched-notes">Notes</label>
            <textarea
              id="sched-notes"
              value={createForm.notes}
              onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Any additional notes..."
              style={{ ...inputStyle, resize:'vertical', minHeight:64 }}
            />
          </div>

          {/* Reason */}
          <div>
            <label style={fieldLabel} htmlFor="sched-reason">Reason for Request *</label>
            <textarea
              id="sched-reason"
              value={createForm.request_reason}
              onChange={e => setCreateForm(f => ({ ...f, request_reason: e.target.value }))}
              rows={2}
              placeholder="Why is this refuel needed?"
              style={{ ...inputStyle, resize:'vertical', minHeight:64 }}
            />
          </div>

          {/* Approval chain preview — shown when litres > 0 */}
          {litresNum > 0 && (
            <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', border:'1px solid #e2e8f0' }}>
              <p style={{ ...sectionLabel, marginBottom:8 }}>Approval Chain</p>
              <div style={{ display:'flex', gap:0, alignItems:'center', flexWrap:'wrap' }}>
                {['Minka', 'Pascal', 'Didier', 'Finance', 'HOB', ...(needsCEO ? ['👑 CEO'] : [])].map((name, i, arr) => (
                  <React.Fragment key={name}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <div style={{
                        width:30, height:30, borderRadius:'50%',
                        background: needsCEO && i===5 ? '#86198f' : '#1e3a5f',
                        color:'#fff', fontSize:10, fontWeight:800,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>{i+1}</div>
                      <span style={{ fontSize:10, color:'#6b7280', whiteSpace:'nowrap' }}>{name}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ flex:1, minWidth:12, height:2, background:'#e5e7eb', margin:'0 4px', marginBottom:14 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:4 }}>
            <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleCreate} variant="primary" loading={creating}>
              Schedule Refueling
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══ ASSIGN REFUELER MODAL ══ */}
      <Modal isOpen={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Refueler" size="sm">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#166534' }}>
            <strong>{assignTarget?.site_name}</strong> — {assignTarget?.liters_approved ?? assignTarget?.liters_requested} L approved
            <span style={{ marginLeft:6, fontSize:11, color:'#9ca3af' }}>
              (XAF {((assignTarget?.liters_approved ?? assignTarget?.liters_requested ?? 0) * LITER_TO_XAF).toLocaleString()})
            </span>
            <br />
            <span style={{ fontSize:12, color:'#166534', marginTop:4, display:'block' }}>
              Once assigned, this site will appear on the refueler's mobile dashboard immediately.
            </span>
          </div>

          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:4 }} htmlFor="sched-assign-to">Assign to *</label>
            <select id="sched-assign-to" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}
              style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:14 }}>
              <option value="">— Select refueler —</option>
              {technicians.map(t => (
                <option key={t._id} value={t._id}>
                  {t.fullName} ({t.role}){t.phone ? ` · ${t.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:4 }} htmlFor="sched-assign-date">Scheduled Date <span style={{ color:'#9ca3af', fontWeight:400 }}>(optional)</span></label>
            <input id="sched-assign-date" type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)}
              style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:14 }} />
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Button onClick={() => setAssignTarget(null)} variant="secondary">Cancel</Button>
            <Button onClick={handleAssign} variant="primary" loading={assigning}>
              <FiUser style={{ marginRight:4 }} /> Assign & Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══ APPROVE MODAL ══ */}
      <Modal isOpen={!!approveId} onClose={() => setApproveId(null)} title="Approve Fuel Request" size="sm">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:4 }}>
              Override Litres Approved <span style={{ fontWeight:400, color:'#9ca3af' }}>(blank = approve as-requested)</span>
            </label>
            <Input type="number" min={1} value={approveOverride} onChange={e => setApproveOverride(e.target.value)} placeholder="Optional override" fullWidth />
          </div>
          <Textarea label="Comments" value={approveComment} onChange={e => setApproveComment(e.target.value)} rows={3} fullWidth />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Button onClick={() => setApproveId(null)} variant="secondary">Cancel</Button>
            <Button onClick={handleApprove} variant="success" loading={approving}>
              <FiCheckCircle style={{ marginRight:4 }} /> Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══ REJECT MODAL ══ */}
      <Modal isOpen={!!rejectId} onClose={() => setRejectId(null)} title="Reject Fuel Request" size="sm">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Textarea label="Reason for rejection *" value={rejectReason}
            onChange={e => setRejectReason(e.target.value)} rows={4}
            placeholder="Explain why this request is being rejected..." fullWidth />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Button onClick={() => setRejectId(null)} variant="secondary">Cancel</Button>
            <Button onClick={handleReject} variant="danger" loading={rejecting}>
              <FiXCircle style={{ marginRight:4 }} /> Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══ VIEW DETAIL MODAL ══ */}
      <Modal isOpen={!!viewReq} onClose={() => setViewReq(null)}
        title={viewReq ? `FUEL-${viewReq._id.slice(-6).toUpperCase()} · ${viewReq.site_name}` : ''} size="xl">
        {viewReq && (
          <div style={{ maxHeight:'75vh', overflowY:'auto', paddingRight:4 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <StatusPill status={viewReq.status} />
              <span style={{ fontSize:11, fontWeight:700, background:({low:'#f3f4f6',medium:'#dbeafe',high:'#fef3c7',critical:'#fee2e2'} as any)[viewReq.urgency]||'#f3f4f6', color:({low:'#374151',medium:'#1e40af',high:'#92400e',critical:'#991b1b'} as any)[viewReq.urgency]||'#374151', borderRadius:6, padding:'2px 8px' }}>
                {viewReq.urgency.toUpperCase()}
              </span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div>
                <p style={sectionLabel}>Request Info</p>
                <div style={detailGrid}>
                  {[
                    ['Site', viewReq.site_name], ['Site ID', viewReq.site_id], ['Cluster', viewReq.cluster||'—'],
                    ['Cycle', viewReq.cycle_key],
                    ['Litres Requested', `${viewReq.liters_requested} L`],
                    ['Litres Approved', viewReq.liters_approved != null ? `${viewReq.liters_approved} L` : 'Pending'],
                    ['XAF Requested', `XAF ${(viewReq.xaf_requested||0).toLocaleString()}`],
                    ['Requested by', (typeof viewReq.requested_by === 'string' ? viewReq.requested_by : viewReq.requested_by?.fullName) || '—'],
                    ['Created', fmtDate(viewReq.createdAt)],
                    ...(viewReq.assigned_to ? [['Assigned to', typeof viewReq.assigned_to === 'string' ? viewReq.assigned_to : viewReq.assigned_to.fullName]] as const : []),
                    ...(viewReq.scheduled_date ? [['Scheduled', fmtDate(viewReq.scheduled_date)]] as const : []),
                  ].map(([k,v]) => (
                    <React.Fragment key={k as string}>
                      <span style={detailKey}>{k}</span>
                      <span style={detailVal}>{v}</span>
                    </React.Fragment>
                  ))}
                </div>
                {viewReq.budget_snapshot && (
                  <div style={{ marginTop:12, padding:'10px 12px', background:'#f8fafc', borderRadius:8 }}>
                    <p style={{ ...sectionLabel, marginBottom:6 }}>Budget Snapshot</p>
                    <div style={detailGrid}>
                      <span style={detailKey}>Cycle total</span>
                      <span style={detailVal}>{viewReq.budget_snapshot.budget_liters_total} L</span>
                      <span style={detailKey}>Remaining</span>
                      <span style={{ ...detailVal, color: viewReq.budget_snapshot.budget_liters_remaining < 50 ? '#dc2626' : '#059669', fontWeight:700 }}>
                        {viewReq.budget_snapshot.budget_liters_remaining} L
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ marginTop:12, padding:'10px 12px', background:'#f9fafb', borderRadius:8 }}>
                  <p style={{ ...sectionLabel, marginBottom:4 }}>Reason</p>
                  <p style={{ fontSize:13, color:'#374151', margin:0 }}>{viewReq.request_reason}</p>
                </div>
              </div>

              <div>
                <p style={sectionLabel}>Approval Trail</p>
                <ApprovalTrail chain={viewReq.approvalChain || []} />
              </div>
            </div>

            {/* Action buttons in detail modal */}
            <div style={{ display:'flex', gap:8, borderTop:'1px solid #e5e7eb', paddingTop:14 }}>
              {viewReq.status === 'approved' && isManager && (
                <Button onClick={() => { setViewReq(null); setAssignTarget(viewReq); }} variant="primary">
                  <FiUser style={{ marginRight:4 }} /> Assign Refueler
                </Button>
              )}
              <Button onClick={() => setViewReq(null)} variant="secondary">Close</Button>
            </div>

            {/* ── Emergency override ── (mirrors FuelRequestsPage.tsx) */}
            {canEmergencyOverride && !['approved','denied','refueled','completed'].includes(viewReq.status) && (
              <div style={{
                marginTop: 16, padding: 16, borderRadius: 10,
                border: '1px dashed #dc2626', background: '#fef2f2',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
                  ⚠️ Emergency Override
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#7f1d1d' }}>
                  Bypasses every remaining approval level immediately and marks this request
                  fully approved. Every approver and the requester will be notified, and a
                  permanent audit record is created with your name and the reason below.
                  Use only for genuine emergencies.
                </p>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { setEmergencyId(viewReq._id); setEmergencyReason(''); setEmergencyLiters(''); }}
                >
                  Emergency Override…
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Emergency override modal ── */}
      <Modal isOpen={!!emergencyId} onClose={() => setEmergencyId(null)} title="⚠️ Emergency Approval Override" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7f1d1d' }}>
            This immediately approves the request and skips every pending approval level.
            This action is logged and broadcast to the full approval chain — it cannot be undone.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Reason for override <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={emergencyReason}
              onChange={e => setEmergencyReason(e.target.value)}
              rows={4}
              placeholder="Explain the emergency — this is included in the audit trail and the notification sent to every approver."
              aria-label="Reason for emergency override"
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
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
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setEmergencyId(null)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleEmergencyOverride} variant="danger" loading={emergencyLoading} disabled={!emergencyReason.trim()}>
              Confirm Emergency Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduledPage;