/**
 * SupervisorFuelApprovalsTab.tsx
 * src/pages/supervisor/SupervisorFuelApprovalsTab.tsx
 *
 * PURPOSE:
 *   A self-contained tab panel for the existing SupervisorApprovalsPage (ApprovalsPage.tsx).
 *   Shows FuelRequests that are pending the authenticated user's approval, following
 *   the same visual language as the existing maintenance approvals tab.
 *
 * HOW TO ADD IT TO ApprovalsPage.tsx:
 *   1. Import this component at the top of ApprovalsPage.tsx:
 *        import SupervisorFuelApprovalsTab from './SupervisorFuelApprovalsTab';
 *
 *   2. Add a state toggle and render the tab header:
 *        const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
 *
 *   3. In the JSX, add a tab bar above the existing content and render conditionally:
 *        {activeTab === 'fuel' && <SupervisorFuelApprovalsTab />}
 *        {activeTab === 'maintenance' && <existing content...> }
 *
 *   See the bottom of this file for the complete ApprovalsPage integration snippet.
 *
 * APPROVAL CHAIN (for reference):
 *   L1: Minka Kevin (Diesel Coordinator)
 *   L2: Pascal Assam (Operations Manager)
 *   L3: Didier Oyong (Technical Director)   ← supervisors will often be here
 *   L4: Ranibell Mambo (Finance Officer)
 *   L5: Kelvin E.T (Head of Business)
 *   L6: Tom (CEO — only when ≥ 100 L)
 */

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { fuelRequestApi } from '@/api/dieselApi';
import { useAuthContext }   from '@/contexts/AuthContext';
import { useNotification }  from '@/contexts/NotificationContext';
import { Card }    from '@/components/common/Card';
import { Badge }   from '@/components/common/Badge';
import { Button }  from '@/components/common/Button';
import { Modal }   from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FiCheckCircle, FiXCircle, FiEye, FiClock, FiDroplet,
  FiAlertTriangle, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiMapPin, FiUser, FiBarChart2,
} from 'react-icons/fi';

// ── Inline API ─────────────────────────────────────────────────────────────────
const fuelApi = {
  pendingForMe: () => apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),
  approve: (id: string, data: { comments?: string; liters_approved?: number }) =>
    apiClient.patch(`/fuel-requests/${id}/approve`, data).then(r => r.data),
  reject: (id: string, comments: string) =>
    apiClient.patch(`/fuel-requests/${id}/reject`, { comments }).then(r => r.data),
  get: (id: string) => apiClient.get(`/fuel-requests/${id}`).then(r => r.data),
};

// ── Types ──────────────────────────────────────────────────────────────────────
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
  region?: string;
  cycle_key: string;
  liters_requested: number;
  liters_approved?: number;
  xaf_requested: number;
  current_fuel_level?: number;
  fuel_percentage_at_request?: number;
  tank_capacity?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  request_reason: string;
  approvalChain: ApprovalStep[];
  requested_by?: { fullName: string; email: string };
  budget_snapshot?: {
    budget_liters_total: number;
    budget_liters_remaining: number;
    budget_liters_used: number;
  };
  cycle_refuel_count?: number;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const LITER_TO_XAF = 828;

const URGENCY_COLORS: Record<string, { bg: string; fg: string }> = {
  critical: { bg: '#fee2e2', fg: '#991b1b' },
  high:     { bg: '#fef3c7', fg: '#92400e' },
  medium:   { bg: '#dbeafe', fg: '#1e40af' },
  low:      { bg: '#f3f4f6', fg: '#374151' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_diesel_coordinator: { label: 'Awaiting Minka',   color: '#f59e0b' },
  pending_operations_manager: { label: 'Awaiting Pascal',  color: '#f59e0b' },
  pending_technical_director: { label: 'Awaiting Didier',  color: '#f59e0b' },
  pending_finance:            { label: 'Awaiting Finance',  color: '#8b5cf6' },
  pending_head_of_business:   { label: 'Awaiting HOB',     color: '#6366f1' },
  pending_ceo:                { label: 'Awaiting CEO',      color: '#db2777' },
};

const fmtDate = (d?: string) =>
  !d ? '—' : new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtXAF = (n: number) => `XAF ${Math.round(n).toLocaleString()}`;

// ── Sub-components ─────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }: { urgency: string }) {
  const c = URGENCY_COLORS[urgency] || URGENCY_COLORS.medium;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: c.bg, color: c.fg,
    }}>{urgency.toUpperCase()}</span>
  );
}

function ApprovalProgress({ chain }: { chain: ApprovalStep[] }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginTop: 6 }}>
      {chain.map(s => (
        <React.Fragment key={s.level}>
          <div
            title={`L${s.level}: ${s.approver.name} — ${s.status}`}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: s.status === 'approved' ? '#16a34a'
                        : s.status === 'rejected' ? '#dc2626' : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: s.status === 'pending' ? '#9ca3af' : '#fff',
              flexShrink: 0,
            }}
          >{s.level}</div>
          {s.level < chain.length && (
            <div style={{ flex: 1, height: 2, background: s.status === 'approved' ? '#16a34a' : '#e5e7eb', minWidth: 8 }} />
          )}
        </React.Fragment>
      ))}
      <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
        {chain.filter(s => s.status === 'approved').length}/{chain.length} approved
      </span>
    </div>
  );
}

function BudgetBar({ budget }: { budget: NonNullable<FuelRequestDoc['budget_snapshot']> }) {
  const usedPct = budget.budget_liters_total > 0
    ? Math.round((budget.budget_liters_used / budget.budget_liters_total) * 100) : 0;
  const critical = budget.budget_liters_remaining < 50;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
        <span>Budget used: {usedPct}%</span>
        <span style={{ color: critical ? '#dc2626' : '#059669', fontWeight: 700 }}>
          {budget.budget_liters_remaining} L remaining
          {critical && ' ⚠'}
        </span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 3, height: 5, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(usedPct, 100)}%`, height: '100%', borderRadius: 3,
          background: usedPct > 90 ? '#dc2626' : usedPct > 70 ? '#f59e0b' : '#2563eb',
        }} />
      </div>
    </div>
  );
}

// ── Approval Card ──────────────────────────────────────────────────────────────
function FuelApprovalCard({
  req,
  onApprove,
  onReject,
  onView,
  myStep,
}: {
  req: FuelRequestDoc;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
  myStep: ApprovalStep;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_LABELS[req.status];
  const daysSince  = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 86400000);

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #fde68a',
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(245,158,11,0.08)',
    }}>
      {/* ── Highlight strip ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />

      <div style={{ padding: '14px 16px' }}>
        {/* ── Row 1: site + badges + YOUR TURN ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>
                {req.site_name || req.site_id}
              </span>
              <UrgencyBadge urgency={req.urgency} />
              <span style={{
                fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#92400e',
                borderRadius: 6, padding: '2px 8px', border: '1px solid #fde68a',
              }}>
                ↑ Level {myStep.level} — Your Turn
              </span>
              {(req.cycle_refuel_count || 0) > 3 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, background: '#fee2e2', color: '#991b1b',
                  borderRadius: 4, padding: '1px 6px',
                }}>⚠ {req.cycle_refuel_count}× refueled this cycle</span>
              )}
              {daysSince > 1 && (
                <span style={{
                  fontSize: 10, color: '#9ca3af',
                  background: '#f9fafb', borderRadius: 4, padding: '1px 6px',
                }}>{daysSince}d old</span>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
              <FiMapPin size={10} style={{ marginRight: 3 }} />
              {req.site_id}{req.cluster ? ` · ${req.cluster}` : ''}{req.region ? `, ${req.region}` : ''}
              {' · '}FUEL-{req._id.slice(-6).toUpperCase()}
              {' · '}Requested {fmtDate(req.createdAt)}
              {req.requested_by ? ` by ${req.requested_by.fullName}` : ''}
              {' · '}{req.cycle_key}
            </div>
          </div>

          {/* ── Quantity + XAF ── */}
          <div style={{ textAlign: 'right', minWidth: 110, flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
              {req.liters_requested} L
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtXAF(req.xaf_requested || req.liters_requested * LITER_TO_XAF)}</div>
            {req.liters_requested >= 100 && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#db2777', marginTop: 2 }}>
                👑 CEO required
              </div>
            )}
          </div>
        </div>

        {/* ── Approval chain pipeline ── */}
        <ApprovalProgress chain={req.approvalChain} />

        {/* ── Budget bar ── */}
        {req.budget_snapshot && (
          <div style={{ marginTop: 10 }}>
            <BudgetBar budget={req.budget_snapshot} />
          </div>
        )}

        {/* ── Reason preview ── */}
        <div style={{
          marginTop: 10, padding: '8px 10px', background: '#f8fafc',
          borderRadius: 6, fontSize: 12, color: '#374151',
          borderLeft: '3px solid #e2e8f0',
        }}>
          <span style={{ fontWeight: 600 }}>Reason: </span>{req.request_reason}
        </div>

        {/* ── My level context ── */}
        <div style={{
          marginTop: 8, padding: '6px 10px', background: '#fffbeb',
          borderRadius: 6, fontSize: 11, color: '#92400e',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <FiUser size={11} />
          <span>You are approving as <strong>L{myStep.level}: {myStep.approver.role}</strong></span>
          {myStep.level === 4 && (
            <span style={{ marginLeft: 4, fontStyle: 'italic' }}>
              — Finance step: you may override the litres amount
            </span>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <Button onClick={onApprove} variant="success" size="sm">
            <FiCheckCircle style={{ marginRight: 4 }} /> Approve
          </Button>
          <Button onClick={onReject} variant="danger" size="sm">
            <FiXCircle style={{ marginRight: 4 }} /> Reject
          </Button>
          <Button onClick={onView} variant="ghost" size="sm">
            <FiEye style={{ marginRight: 4 }} /> Full Details
          </Button>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              marginLeft: 'auto', border: 'none', background: '#f3f4f6',
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#6b7280',
              display: 'flex', alignItems: 'center',
            }}
          >
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        </div>

        {/* ── Expanded detail ── */}
        {expanded && (
          <div style={{
            marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12,
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Site Info
              </p>
              {[
                ['Site ID',         req.site_id],
                ['Cycle',           req.cycle_key],
                ['Fuel at request', req.current_fuel_level != null ? `${req.current_fuel_level} L (${req.fuel_percentage_at_request ?? '—'}%)` : '—'],
                ['Tank capacity',   req.tank_capacity ? `${req.tank_capacity} L` : '—'],
                ['Urgency',         req.urgency.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                  <span style={{ color: '#9ca3af', minWidth: 100 }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#374151' }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Full Approval Trail
              </p>
              {req.approvalChain.map(s => (
                <div key={s.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    {s.status === 'approved' ? <FiCheckCircle size={13} color="#16a34a" /> :
                     s.status === 'rejected' ? <FiXCircle     size={13} color="#dc2626" /> :
                                              <FiClock        size={13} color="#9ca3af" />}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: s.status === 'pending' ? '#9ca3af' : '#374151' }}>
                      L{s.level}: {s.approver.name}
                    </span>
                    {s.actionDate && <span style={{ color: '#9ca3af', marginLeft: 6, fontSize: 10 }}>{fmtDate(s.actionDate)}</span>}
                    {s.comments && <p style={{ fontSize: 11, color: '#6b7280', margin: '1px 0 0', fontStyle: 'italic' }}>"{s.comments}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const SupervisorFuelApprovalsTab: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();

  const [pending, setPending]   = useState<FuelRequestDoc[]>([]);
  const [emergencyTarget, setEmergencyTarget] = React.useState<any>(null);
  const [loading, setLoading]   = useState(false);

  // Approve modal
  const [approveTarget, setApproveTarget]     = useState<FuelRequestDoc | null>(null);
  const [approveComment, setApproveComment]   = useState('');
  const [approveOverride, setApproveOverride] = useState('');
  const [approving, setApproving]             = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget]       = useState<FuelRequestDoc | null>(null);
  const [rejectReason, setRejectReason]       = useState('');
  const [rejecting, setRejecting]             = useState(false);

  // View modal
  const [viewTarget, setViewTarget]           = useState<FuelRequestDoc | null>(null);

  // ── Loader ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fuelApi.pendingForMe();
      setPending(res.data || []);
    } catch {
      showError('Failed to load fuel approval requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Get my step for a given request ────────────────────────────────────────
  const getMyStep = (req: FuelRequestDoc): ApprovalStep | null => {
    if (!user?.email) return null;
    const step = req.approvalChain?.find(
      s => s.approver.email?.toLowerCase() === user.email.toLowerCase() && s.status === 'pending'
    );
    if (!step) return null;
    const prevOk = req.approvalChain
      .filter(s => s.level < step.level)
      .every(s => s.status === 'approved');
    return prevOk ? step : null;
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const myStep = getMyStep(approveTarget);
      await fuelApi.approve(approveTarget._id, {
        comments:       approveComment.trim() || undefined,
        liters_approved: approveOverride ? parseFloat(approveOverride) : undefined,
      });
      success(
        `Approved — ${
          approveTarget.approvalChain.filter(s => s.status === 'approved').length + 1 >=
          approveTarget.approvalChain.length
            ? 'Request is fully approved ✅'
            : 'Next approver has been notified'
        }`
      );
      setApproveTarget(null); setApproveComment(''); setApproveOverride('');
      load();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Approval failed');
    } finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      showError('A reason is required when rejecting'); return;
    }
    setRejecting(true);
    try {
      await fuelApi.reject(rejectTarget._id, rejectReason.trim());
      success('Request rejected — the requester has been notified');
      setRejectTarget(null); setRejectReason('');
      load();
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Rejection failed');
    } finally { setRejecting(false); }
  };

  // ── Group by urgency for display ────────────────────────────────────────────
  const actionable = pending.filter(r => getMyStep(r) !== null);
  const urgent   = actionable.filter(r => ['critical','high'].includes(r.urgency));
  const normal   = actionable.filter(r => !['critical','high'].includes(r.urgency));

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (actionable.length === 0) {
    return (
      <EmptyState
        icon={<FiCheckCircle size={56} color="#d1d5db" />}
        title="No fuel requests waiting for your approval"
        description="You will receive an email notification when a request reaches your level in the approval chain"
        actionLabel="Refresh"
        onAction={load}
      />
    );
  }

  return (
    <div>
      {/* ── Stats strip ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Awaiting Your Approval', value: actionable.length, color: '#f59e0b', icon: <FiClock size={18}/> },
          { label: 'Critical / High',        value: urgent.length,     color: '#dc2626', icon: <FiAlertTriangle size={18}/> },
          { label: 'Total Litres',           value: `${actionable.reduce((s,r) => s + r.liters_requested, 0)} L`, color: '#2563eb', icon: <FiDroplet size={18}/> },
          { label: 'Total XAF',             value: `XAF ${actionable.reduce((s,r) => s + (r.xaf_requested || r.liters_requested * LITER_TO_XAF), 0).toLocaleString()}`, color: '#7c3aed', icon: <FiBarChart2 size={18}/> },
        ].map(k => (
          <div key={k.label} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderTop: `3px solid ${k.color}`,
            borderRadius: 10, padding: '12px 18px', minWidth: 160, flex: '1 1 160px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px' }}>{k.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: k.color, margin: 0 }}>{k.value}</p>
              </div>
              <div style={{ color: k.color, opacity: 0.25 }}>{k.icon}</div>
            </div>
          </div>
        ))}
        <button onClick={load} style={{
          border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px',
          background: '#fff', cursor: 'pointer', color: '#6b7280', display: 'flex',
          alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Urgent first ── */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FiAlertTriangle color="#dc2626" size={16} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', margin: 0 }}>
              Critical / High Priority ({urgent.length})
            </h3>
          </div>
          {urgent.map(r => {
            const myStep = getMyStep(r)!;
            return (
              <FuelApprovalCard
                key={r._id}
                req={r}
                myStep={myStep}
                onApprove={() => setApproveTarget(r)}
                onReject={() => setRejectTarget(r)}
                onView={() => setViewTarget(r)}
              />
            );
          })}
        </div>
      )}

      {/* ── Medium / Low ── */}
      {normal.length > 0 && (
        <div>
          {urgent.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FiClock color="#6b7280" size={16} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0 }}>
                Medium / Low Priority ({normal.length})
              </h3>
            </div>
          )}
          {normal.map(r => {
            const myStep = getMyStep(r)!;
            return (
              <FuelApprovalCard
                key={r._id}
                req={r}
                myStep={myStep}
                onApprove={() => setApproveTarget(r)}
                onReject={() => setRejectTarget(r)}
                onView={() => setViewTarget(r)}
              />
            );
          })}
        </div>
      )}

      {/* ══ APPROVE MODAL ══ */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Fuel Request" size="sm">
        {approveTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Context */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{approveTarget.site_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {approveTarget.liters_requested} L requested
                {' · '}XAF {((approveTarget.xaf_requested || approveTarget.liters_requested * LITER_TO_XAF)).toLocaleString()}
                {' · '}<UrgencyBadge urgency={approveTarget.urgency} />
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                "{approveTarget.request_reason}"
              </div>
            </div>

            {/* Finance-only: litres override */}
            {getMyStep(approveTarget)?.level === 4 && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Litres Approved
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                    (leave blank to approve as-requested: {approveTarget.liters_requested} L)
                  </span>
                </label>
                <input
                  type="number" min={1}
                  value={approveOverride}
                  onChange={e => setApproveOverride(e.target.value)}
                  placeholder={`${approveTarget.liters_requested} L`}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const }}
                />
                {approveOverride && parseFloat(approveOverride) > 0 && (
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0' }}>
                    ≈ XAF {Math.round(parseFloat(approveOverride) * LITER_TO_XAF).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Comment */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Comments</label>
              <textarea
                value={approveComment}
                onChange={e => setApproveComment(e.target.value)}
                rows={3}
                placeholder="Optional — will be visible to the next approver"
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => { setApproveTarget(null); setApproveComment(''); setApproveOverride(''); }} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleApprove} variant="success" loading={approving}>
                <FiCheckCircle style={{ marginRight: 4 }} /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ REJECT MODAL ══ */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Fuel Request" size="sm">
        {rejectTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#991b1b' }}>{rejectTarget.site_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {rejectTarget.liters_requested} L · {rejectTarget.urgency.toUpperCase()}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Explain why this request is being rejected. The requester and their manager will see this."
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' as const }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => { setRejectTarget(null); setRejectReason(''); }} variant="secondary">Cancel</Button>
              <Button onClick={handleReject} variant="danger" loading={rejecting}>
                <FiXCircle style={{ marginRight: 4 }} /> Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ FULL DETAILS MODAL ══ */}
      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `FUEL-${viewTarget._id.slice(-6).toUpperCase()} · ${viewTarget.site_name}` : ''}
        size="xl"
      >
        {viewTarget && (
          <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left col */}
              <div style={{ fontSize: 13 }}>
                <p style={{ fontWeight: 700, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Request Details</p>
                {[
                  ['Site',            viewTarget.site_name],
                  ['Site ID',         viewTarget.site_id],
                  ['Cluster',         viewTarget.cluster || '—'],
                  ['Region',          viewTarget.region  || '—'],
                  ['Cycle',           viewTarget.cycle_key],
                  ['Litres Requested',`${viewTarget.liters_requested} L`],
                  ['XAF Requested',   `XAF ${(viewTarget.xaf_requested || viewTarget.liters_requested * LITER_TO_XAF).toLocaleString()}`],
                  ['Urgency',         viewTarget.urgency.toUpperCase()],
                  ['Fuel at request', viewTarget.current_fuel_level != null ? `${viewTarget.current_fuel_level} L (${viewTarget.fuel_percentage_at_request ?? '—'}%)` : '—'],
                  ['Requested by',    viewTarget.requested_by?.fullName || '—'],
                  ['Requested at',    fmtDate(viewTarget.createdAt)],
                  ['Refuels this cycle', viewTarget.cycle_refuel_count ? `${viewTarget.cycle_refuel_count}×` : '—'],
                ].map(([k,v]) => (
                  <div key={k as string} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                    <span style={{ color: '#9ca3af', minWidth: 130 }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                {viewTarget.budget_snapshot && (
                  <div style={{ marginTop: 12 }}>
                    <BudgetBar budget={viewTarget.budget_snapshot} />
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      Budget: {viewTarget.budget_snapshot.budget_liters_total} L total
                      · {viewTarget.budget_snapshot.budget_liters_used} L used
                      · {viewTarget.budget_snapshot.budget_liters_remaining} L left
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Request Reason</p>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{viewTarget.request_reason}</p>
                </div>
              </div>
              {/* Right col: full trail */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Approval Trail</p>
                {viewTarget.approvalChain.map(s => (
                  <div key={s.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>
                      {s.status === 'approved' ? <FiCheckCircle size={15} color="#16a34a" /> :
                       s.status === 'rejected' ? <FiXCircle     size={15} color="#dc2626" /> :
                                                <FiClock        size={15} color="#9ca3af" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: s.status === 'pending' ? '#9ca3af' : '#111827' }}>
                          L{s.level}: {s.approver.name}
                        </span>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>({s.approver.role})</span>
                        {s.actionDate && <span style={{ fontSize: 10, color: '#9ca3af' }}>{fmtDate(s.actionDate)}</span>}
                      </div>
                      {s.comments && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', fontStyle: 'italic' }}>"{s.comments}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons at bottom of detail modal */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
              {getMyStep(viewTarget) && (
                <>
                  <Button onClick={() => { setViewTarget(null); setApproveTarget(viewTarget); }} variant="success">
                    <FiCheckCircle style={{ marginRight: 4 }} /> Approve
                  </Button>
                  <Button onClick={() => { setViewTarget(null); setRejectTarget(viewTarget); }} variant="danger">
                    <FiXCircle style={{ marginRight: 4 }} /> Reject
                  </Button>
                </>
              )}
              <Button onClick={() => setViewTarget(null)} variant="secondary">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Emergency Override Modal */}
      {emergencyTarget && (
        <EmergencyApproveModal
          requestId={emergencyTarget.id}
          siteName={emergencyTarget.site}
          litersRequested={emergencyTarget.liters}
          onDone={() => { setEmergencyTarget(null); load(); }}
          onClose={() => setEmergencyTarget(null)}
        />
      )}
    </div>
  );
};


// ── EmergencyApproveModal ─────────────────────────────────────────────────────
function EmergencyApproveModal({ requestId, siteName, litersRequested, onDone, onClose }: {
  requestId: string; siteName: string; litersRequested: number;
  onDone: () => void; onClose: () => void;
}) {
  const [reason, setReason]         = React.useState('');
  const [litersOver, setLitersOver] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError]           = React.useState('');

  const submit = async () => {
    if (reason.trim().length < 20) { setError('Reason must be at least 20 characters'); return; }
    setSubmitting(true); setError('');
    try {
      await fuelRequestApi.emergencyApprove(requestId, {
        override_reason: reason.trim(),
        liters_approved: litersOver ? Number(litersOver) : litersRequested,
      });
      onDone();
    } catch (e: any) { setError(e?.response?.data?.error || 'Emergency approval failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:480, border:'3px solid #e53935' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:24 }}>&#x1F6A8;</span>
          <div>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#e53935' }}>Emergency Override</h3>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#6b7280' }}>Bypasses all pending chain levels instantly</p>
          </div>
        </div>
        <div style={{ background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#b91c1c' }}>
          <strong>Warning — Irreversible:</strong> All pending steps approved on your behalf. Full chain notified by email.
        </div>
        <div style={{ background:'#f9fafb', borderRadius:8, padding:'8px 12px', marginBottom:14, fontSize:13 }}>
          <strong>{siteName}</strong> &middot; {litersRequested} L requested
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
            Override Litres <span style={{ color:'#9ca3af', fontWeight:400 }}>(blank = {litersRequested} L)</span>
          </label>
          <input type="number" value={litersOver} onChange={e=>setLitersOver(e.target.value)}
            placeholder={String(litersRequested)}
            style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:14, boxSizing:'border-box' as any }} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
            override_reason (Emergency Reason) <span style={{ color:'#e53935' }}>*</span>
          </label>
          <textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="Describe the emergency situation (min 20 characters)..."
            style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:13, resize:'vertical' as any, boxSizing:'border-box' as any }} />
          <div style={{ fontSize:10, color: reason.length<20 ? '#e53935':'#6b7280', marginTop:2 }}>
            {reason.length < 20 ? `${20-reason.length} more chars required` : `${reason.length} chars`}
          </div>
        </div>
        {error && <div style={{ color:'#e53935', fontSize:12, marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#f9fafb', borderRadius:8, padding:'9px 18px', fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={submitting || reason.length<20}
            style={{ background: reason.length>=20 && !submitting ? '#e53935':'#fca5a5', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:700, cursor: reason.length>=20 && !submitting ? 'pointer':'not-allowed' as any }}>
            {submitting ? 'Overriding...' : 'Confirm Emergency Override'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupervisorFuelApprovalsTab;

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION SNIPPET — paste into ApprovalsPage.tsx
// ══════════════════════════════════════════════════════════════════════════════
//
// 1. Add import at top of ApprovalsPage.tsx:
//      import SupervisorFuelApprovalsTab from './SupervisorFuelApprovalsTab';
//
// 2. Add state after existing state declarations:
//      const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
//      const [fuelPendingCount, setFuelPendingCount] = useState(0);
//
//    Load the count in a useEffect alongside loadVisits():
//      useEffect(() => {
//        apiClient.get('/fuel-requests/pending-for-me')
//          .then(r => setFuelPendingCount((r.data.data || []).length))
//          .catch(() => {});
//      }, [user]);
//
// 3. Replace the page header JSX with:
//
//   <div className="space-y-6">
//     <div className="flex items-center justify-between">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
//         <p className="text-sm text-gray-500 mt-1">Review and action maintenance visits and fuel refueling requests</p>
//       </div>
//     </div>
//
//     {/* Tab bar */}
//     <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e5e7eb', paddingBottom:0 }}>
//       {[
//         { key:'maintenance', label:`Maintenance Visits (${filteredList.length})` },
//         {
//           key:'fuel',
//           label:`Fuel Requests${fuelPendingCount > 0 ? ` (${fuelPendingCount})` : ''}`,
//           badge: fuelPendingCount,
//         },
//       ].map(t => (
//         <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
//           padding:'10px 18px', border:'none', cursor:'pointer', fontSize:14, fontWeight:600,
//           background:'none',
//           borderBottom: activeTab===t.key ? '3px solid #1e3a5f' : '3px solid transparent',
//           color: activeTab===t.key ? '#1e3a5f' : '#6b7280',
//           marginBottom:-2, display:'flex', alignItems:'center', gap:8,
//         }}>
//           {t.label}
//           {t.badge > 0 && (
//             <span style={{
//               background:'#f59e0b', color:'#fff', borderRadius:10,
//               fontSize:10, fontWeight:800, padding:'1px 6px', minWidth:16, textAlign:'center',
//             }}>{t.badge}</span>
//           )}
//         </button>
//       ))}
//     </div>
//
//     {/* Tab content */}
//     {activeTab === 'fuel' && <SupervisorFuelApprovalsTab />}
//     {activeTab === 'maintenance' && (
//       /* ... existing maintenance approval content ... */
//     )}
//   </div>