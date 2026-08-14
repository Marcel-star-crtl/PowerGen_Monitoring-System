/**
 * FinanceDashboard.tsx
 * src/pages/finance/FinanceDashboard.tsx
 *
 * ROLE: finance (Ranibell Mambo — Finance Officer, L4)
 *
 * What Finance sees and does here:
 *  TAB 1 — Approvals      Pending L4 approvals. Finance is the ONLY level
 *                         that can override liters_approved. Full cost
 *                         breakdown shown before acting.
 *  TAB 2 — Disbursement   Fully-approved requests. Finance marks actual
 *                         payment/disbursement, attaches reference number,
 *                         sets actual XAF disbursed.
 *  TAB 3 — Analytics      Monthly spend vs budget, cluster breakdowns,
 *                         cost-per-litre trend, consumption variance.
 *  TAB 4 — Budget Tracker  Per-cluster budget allocation vs committed vs
 *                         actual spend. Tom Card vs field reconciliation.
 *  TAB 5 — Reports        Generate and export XLSX/PDF finance reports.
 *
 * Route: /finance  (add to App.tsx under ProtectedRoute allowedRoles=['finance','admin'])
 */

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { cyclesApi } from '@/api/dieselApi';
import { useAuthContext }  from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card }    from '@/components/common/Card';
import { Badge }   from '@/components/common/Badge';
import { Button }  from '@/components/common/Button';
import { Modal }   from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import * as XLSX from 'xlsx';
import {
  FiCheckCircle, FiXCircle, FiClock, FiDroplet, FiBarChart2,
  FiDollarSign, FiAlertTriangle, FiDownload, FiRefreshCw,
  FiTrendingUp, FiTrendingDown, FiFilter, FiEye, FiFileText,
  FiPieChart, FiActivity, FiCreditCard, FiZap,
} from 'react-icons/fi';

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  pendingForMe:   ()           => apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),
  list:           (p: any)     => apiClient.get('/fuel-requests', { params: p }).then(r => r.data),
  approve:        (id: string, d: any) => apiClient.patch(`/fuel-requests/${id}/approve`, d).then(r => r.data),
  reject:         (id: string, c: string) => apiClient.patch(`/fuel-requests/${id}/reject`, { comments: c }).then(r => r.data),
  disburse:       (id: string, d: any) => apiClient.patch(`/fuel-requests/${id}/disburse`, d).then(r => r.data),
  budgetAlerts:   ()           => apiClient.get('/fuel-requests/budget-alerts', { params: { threshold_liters: 100 } }).then(r => r.data),
  budgetUtil:     (cycle: string) => apiClient.get(`/site-budget/${cycle}/utilisation`, { params: { alert_threshold_pct: 70 } }).then(r => r.data),
  financeReport:  (cycle: string) => apiClient.get(`/fuel-requests/finance-report/${cycle}`).then(r => r.data),
  clusterBudget:  (cycle: string) => apiClient.get(`/site-budget/${cycle}/aggregate`).then(r => r.data),
  tomCard:        (cycle: string) => apiClient.get('/tomcard/summary/' + cycle).then(r => r.data),
};

// ── Constants ─────────────────────────────────────────────────────────────────
const XAF = 828;
const fmtXAF  = (n: number) => `XAF ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string)  => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fmtM    = (n: number)  => `${(n / 1_000_000).toFixed(2)}M`;



// ── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
  padding: '20px 22px',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px',
};
const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4,
};
const inputSt: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const,
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = '#111827', icon, trend }: any) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 900, color, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
        </div>
        <div style={{ color, opacity: 0.2, fontSize: 28 }}>{icon}</div>
      </div>
      {trend != null && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          {trend >= 0
            ? <FiTrendingUp size={12} color="#dc2626" />
            : <FiTrendingDown size={12} color="#16a34a" />}
          <span style={{ color: trend >= 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
            {Math.abs(trend)}% vs last cycle
          </span>
        </div>
      )}
    </div>
  );
}

// ── Spend Bar ─────────────────────────────────────────────────────────────────
function SpendBar({ label, spent, budget, color = '#2563eb' }: any) {
  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const rag  = pct > 90 ? '#dc2626' : pct > 75 ? '#f59e0b' : color;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#6b7280' }}>{fmtXAF(spent)} / {fmtXAF(budget)} ({pct}%)</span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: 8, background: rag, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const FinanceDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();

  const [cycles,   setCycles]   = useState<{cycle_key:string; label:string; status:string}[]>([]);
  const [cycle,    setCycle]    = useState('');
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [tab, setTab]     = useState<'approvals' | 'disbursement' | 'analytics' | 'budget' | 'reports'>('approvals');

  // Data
  const [pending,    setPending]    = useState<any[]>([]);
  const [allRequests,setAll]        = useState<any[]>([]);
  const [budgetData, setBudget]     = useState<any[]>([]);
  const [tomCard,    setTomCard]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);

  // Approve modal
  const [approveTarget, setApproveTarget]     = useState<any>(null);
  const [approveComment, setApproveComment]   = useState('');
  const [litresOverride, setLitresOverride]   = useState('');
  const [approving, setApproving]             = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget]       = useState<any>(null);
  const [rejectReason, setRejectReason]       = useState('');
  const [rejecting, setRejecting]             = useState(false);

  // Disburse modal
  const [disburseTarget, setDisburseTarget]   = useState<any>(null);
  const [refNum,         setRefNum]           = useState('');
  const [actualXAF,      setActualXAF]        = useState('');
  const [paymentMethod,  setPaymentMethod]    = useState('bank_transfer');
  const [disbursing,     setDisbursing]       = useState(false);

  // Detail modal
  const [viewTarget, setViewTarget]           = useState<any>(null);

  // ── Load all data ──────────────────────────────────────────────────────────
  // Load real cycles from DB (same source as TomCardPage)
  useEffect(() => {
    cyclesApi.list()
      .then(res => {
        const list = res.data || [];
        setCycles(list);
        if (list.length > 0 && !cycle) setCycle(list[0].cycle_key);
      })
      .catch(() => {
        // Fallback: generate last 6 months locally if DB unavailable
        const fallback = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          return { cycle_key: key, label: d.toLocaleDateString('en-GB', { year:'numeric', month:'long' }), status: 'open' };
        });
        setCycles(fallback);
        if (!cycle) setCycle(fallback[0].cycle_key);
      })
      .finally(() => setCyclesLoading(false));
  }, []);

  const loadAll = useCallback(async () => {
    if (!cycle) return; 
    setLoading(true);
    try {
      const [pendRes, allRes, budRes] = await Promise.all([
        api.pendingForMe(),
        api.list({ cycle_key: cycle, limit: 500 }),
        api.clusterBudget(cycle),
      ]);
      setPending(pendRes.data || []);
      setAll(allRes.data || []);
      setBudget(budRes.data?.by_cluster || []);
      // TomCard
      api.tomCard(cycle).then(r => setTomCard(r.data || r)).catch(() => {});
    } catch { showError('Failed to load finance data'); }
    finally { setLoading(false); }
  }, [cycle]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Analytics derived ──────────────────────────────────────────────────────
  const approved       = allRequests.filter(r => !['denied','pending_diesel_coordinator','pending_operations_manager','pending_technical_director','pending_finance','pending_head_of_business','pending_ceo'].includes(r.status));
  const totalApprovedL = approved.reduce((s,r) => s + (r.liters_approved || r.liters_requested), 0);
  const totalApprovedXAF = totalApprovedL * XAF;
  const totalRefueledL  = allRequests.filter(r => r.status === 'refueled' || r.status === 'completed')
                                     .reduce((s,r) => s + (r.liters_actually_added || 0), 0);
  const deniedCount    = allRequests.filter(r => r.status === 'denied').length;
  const pendingMyCount = pending.length;
  const awaitingDisb   = allRequests.filter(r => r.status === 'approved' && !r.disbursed_at);

  // Cluster spend grouping
  const clusterSpend: Record<string, { requested: number; approved: number; xaf: number }> = {};
  allRequests.forEach(r => {
    const c = r.cluster || 'Unknown';
    if (!clusterSpend[c]) clusterSpend[c] = { requested: 0, approved: 0, xaf: 0 };
    clusterSpend[c].requested += r.liters_requested;
    clusterSpend[c].approved  += r.liters_approved || 0;
    clusterSpend[c].xaf       += (r.liters_approved || 0) * XAF;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const litres = litresOverride ? parseFloat(litresOverride) : undefined;
      await api.approve(approveTarget._id, { comments: approveComment, liters_approved: litres });
      success(`✅ Approved — ${litres ? `${litres} L disbursement authorised` : 'as requested'}`);
      setApproveTarget(null); setApproveComment(''); setLitresOverride('');
      loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Approval failed'); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { showError('Reason required'); return; }
    setRejecting(true);
    try {
      await api.reject(rejectTarget._id, rejectReason);
      success('Request rejected — requester notified');
      setRejectTarget(null); setRejectReason(''); loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Rejection failed'); }
    finally { setRejecting(false); }
  };

  const handleDisburse = async () => {
    if (!disburseTarget || !refNum.trim()) { showError('Reference number required'); return; }
    setDisbursing(true);
    try {
      await api.disburse(disburseTarget._id, {
        reference_number: refNum,
        actual_xaf:       actualXAF ? parseFloat(actualXAF) : (disburseTarget.liters_approved || disburseTarget.liters_requested) * XAF,
        payment_method:   paymentMethod,
        disbursed_by:     user?.email,
      });
      success('💰 Disbursement recorded');
      setDisburseTarget(null); setRefNum(''); setActualXAF('');
      loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Disbursement failed'); }
    finally { setDisbursing(false); }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = allRequests.map(r => ({
      'Request ID':         `FUEL-${r._id?.slice(-6).toUpperCase()}`,
      'Date':               fmtDate(r.createdAt),
      'Site':               r.site_name,
      'Site ID':            r.site_id,
      'Cluster':            r.cluster || '—',
      'Litres Requested':   r.liters_requested,
      'Litres Approved':    r.liters_approved ?? '—',
      'XAF Requested':      r.xaf_requested || r.liters_requested * XAF,
      'XAF Approved':       r.xaf_approved || (r.liters_approved || 0) * XAF,
      'Urgency':            r.urgency,
      'Status':             r.status,
      'Requested By':       r.requested_by?.fullName || '—',
      'Assigned To':        r.assigned_to?.fullName  || '—',
      'Litres Actually Added': r.liters_actually_added ?? '—',
      'Disbursed':          r.disbursed_at ? fmtDate(r.disbursed_at) : 'No',
      'Ref #':              r.disbursement?.reference_number || '—',
      'Cycle':              r.cycle_key,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Finance_${cycle}`);
    XLSX.writeFile(wb, `GRATO_Finance_Report_${cycle}.xlsx`);
    success(`Exported ${rows.length} records`);
  };

  // ── Pending approval card ─────────────────────────────────────────────────
  const PendingCard = ({ r }: { r: any }) => (
    <div style={{
      ...card, marginBottom: 12,
      border: '2px solid #8b5cf6',
      borderLeft: '6px solid #8b5cf6',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{r.site_name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#ffebee', color: '#e53935', borderRadius: 6, padding: '2px 8px' }}>
              L4 Finance — YOUR TURN
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
              background: r.urgency === 'critical' ? '#fee2e2' : r.urgency === 'high' ? '#fef3c7' : '#dbeafe',
              color:      r.urgency === 'critical' ? '#991b1b' : r.urgency === 'high' ? '#92400e' : '#1e40af',
            }}>{r.urgency.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
            {r.site_id} · {r.cluster} · FUEL-{r._id?.slice(-6).toUpperCase()} · {fmtDate(r.createdAt)}
            {r.requested_by && ` · by ${r.requested_by.fullName}`}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
            "{r.request_reason}"
          </div>
          {/* Cost breakdown */}
          <div style={{
            marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10, background: '#fff5f5', borderRadius: 8, padding: '10px 12px',
          }}>
            {[
              ['Requested (L)', r.liters_requested],
              ['XAF Requested', fmtXAF(r.liters_requested * XAF)],
              ['Budget Remaining', `${r.budget_snapshot?.budget_liters_remaining ?? '—'} L`],
              ['Refuel Count', `${r.cycle_refuel_count || 0}× this cycle`],
            ].map(([k,v]) => (
              <div key={k as string}>
                <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px' }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Quantity */}
        <div style={{ textAlign: 'right', minWidth: 110, flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e53935' }}>{r.liters_requested} L</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{fmtXAF(r.liters_requested * XAF)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button onClick={() => { setApproveTarget(r); setLitresOverride(String(r.liters_requested)); }} variant="success" size="sm">
          <FiCheckCircle style={{ marginRight: 4 }} /> Approve & Set Amount
        </Button>
        <Button onClick={() => setRejectTarget(r)} variant="danger" size="sm">
          <FiXCircle style={{ marginRight: 4 }} /> Reject
        </Button>
        <Button onClick={() => setViewTarget(r)} variant="ghost" size="sm">
          <FiEye style={{ marginRight: 4 }} /> Full Details
        </Button>
      </div>
    </div>
  );

  // ── Disburse card ─────────────────────────────────────────────────────────
  const DisburseCard = ({ r }: { r: any }) => (
    <div style={{ ...card, marginBottom: 12, borderLeft: '6px solid #16a34a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{r.site_name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '2px 8px' }}>
              ✅ Fully Approved
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
            {r.site_id} · {r.cluster} · Approved {fmtDate(r.createdAt)}
          </div>
          <div style={{
            marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10, background: '#f0fdf4', borderRadius: 8, padding: '10px 12px',
          }}>
            {[
              ['Approved Litres', `${r.liters_approved || r.liters_requested} L`],
              ['Amount to Disburse', fmtXAF((r.liters_approved || r.liters_requested) * XAF)],
              ['Requested By', r.requested_by?.fullName || '—'],
            ].map(([k,v]) => (
              <div key={k as string}>
                <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px' }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>
            {fmtM((r.liters_approved || r.liters_requested) * XAF)}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>XAF</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button onClick={() => { setDisburseTarget(r); setActualXAF(String((r.liters_approved || r.liters_requested) * XAF)); }} variant="primary" size="sm">
          <FiDollarSign style={{ marginRight: 4 }} /> Record Disbursement
        </Button>
        <Button onClick={() => setViewTarget(r)} variant="ghost" size="sm">
          <FiEye style={{ marginRight: 4 }} /> Details
        </Button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 60px' }}>

      {/* ── Page Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #b71c1c, #e53935)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Finance Office
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px' }}>Finance Dashboard</h1>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
              {user?.fullName} · Fuel Request Approval, Disbursement & Financial Analysis
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cyclesLoading ? (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Loading cycles…</span>
            ) : (
              <select value={cycle} onChange={e => setCycle(e.target.value)}
                style={{ border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>
                {cycles.map(c => (
                  <option key={c.cycle_key} value={c.cycle_key} style={{ color: '#111' }}>
                    {c.label} {c.status !== 'open' ? `(${c.status})` : ''}
                  </option>
                ))}
              </select>
            )}
            <button onClick={loadAll} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#fff' }}>
              <FiRefreshCw size={14} />
            </button>
            <button onClick={handleExport} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiDownload size={13} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
        <KPI label="My Pending Approvals"  value={pendingMyCount}     color="#e53935" icon={<FiClock />} />
        <KPI label="Awaiting Disbursement" value={awaitingDisb.length} color="#f59e0b" icon={<FiDollarSign />} />
        <KPI label="Total Approved (L)"    value={`${totalApprovedL.toLocaleString()} L`} color="#16a34a" icon={<FiDroplet />} />
        <KPI label="Total Committed (XAF)" value={fmtM(totalApprovedXAF)} color="#2563eb" icon={<FiBarChart2 />} />
        <KPI label="Actually Refueled (L)" value={`${totalRefueledL.toLocaleString()} L`} color="#059669" icon={<FiZap />} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
        {([
          { key: 'approvals',    label: `Pending Approvals`,              badge: pendingMyCount,    icon: <FiCheckCircle size={14}/> },
          { key: 'disbursement', label: `Disbursement`,                   badge: awaitingDisb.length, icon: <FiDollarSign size={14}/> },
          { key: 'analytics',   label: 'Financial Analytics',            badge: 0,                 icon: <FiBarChart2 size={14}/> },
          { key: 'budget',      label: 'Budget Tracker',                 badge: 0,                 icon: <FiPieChart size={14}/> },
          { key: 'reports',     label: 'Reports & Export',               badge: 0,                 icon: <FiFileText size={14}/> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'none', marginBottom: -2,
              borderBottom: tab === t.key ? '3px solid #e53935' : '3px solid transparent',
              color: tab === t.key ? '#e53935' : '#6b7280',
            }}>
            {t.icon} {t.label}
            {t.badge > 0 && (
              <span style={{ background: '#e53935', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner size="lg" /></div>
      ) : (
        <>
          {/* ══ TAB 1: APPROVALS ══ */}
          {tab === 'approvals' && (
            <div>
              {pending.length === 0 ? (
                <EmptyState icon={<FiCheckCircle size={56} color="#d1d5db" />}
                  title="No pending approvals for you"
                  description="You will receive an email when a request reaches the Finance level" />
              ) : (
                <>
                  <div style={{ marginBottom: 16, fontSize: 13, color: '#e53935', fontWeight: 600 }}>
                    💜 {pending.length} request{pending.length !== 1 ? 's' : ''} waiting — you are the Finance Officer (L4).
                    You may approve as-requested or reduce the approved litres.
                  </div>
                  {pending.map(r => <PendingCard key={r._id} r={r} />)}
                </>
              )}
            </div>
          )}

          {/* ══ TAB 2: DISBURSEMENT ══ */}
          {tab === 'disbursement' && (
            <div>
              {awaitingDisb.length === 0 ? (
                <EmptyState icon={<FiDollarSign size={56} color="#d1d5db" />}
                  title="No disbursements pending"
                  description="Fully-approved requests that need payment recording will appear here" />
              ) : (
                <>
                  <div style={{ marginBottom: 16, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                    💚 {awaitingDisb.length} fully-approved request{awaitingDisb.length !== 1 ? 's' : ''} ready for disbursement.
                    Total: {fmtXAF(awaitingDisb.reduce((s,r) => s + (r.liters_approved||r.liters_requested)*XAF, 0))}
                  </div>
                  {awaitingDisb.map(r => <DisburseCard key={r._id} r={r} />)}
                </>
              )}
            </div>
          )}

          {/* ══ TAB 3: ANALYTICS ══ */}
          {tab === 'analytics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Spend by cluster */}
              <div style={card}>
                <p style={sectionTitle}>💰 Spend by Cluster — {cycle}</p>
                {Object.entries(clusterSpend).length === 0
                  ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No data for this cycle</p>
                  : Object.entries(clusterSpend)
                      .sort((a,b) => b[1].xaf - a[1].xaf)
                      .map(([cluster, data]) => (
                        <div key={cluster} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span style={{ fontWeight: 600 }}>{cluster}</span>
                            <span style={{ color: '#6b7280' }}>
                              {data.approved.toLocaleString()} L · {fmtXAF(data.xaf)}
                            </span>
                          </div>
                          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min((data.xaf / (totalApprovedXAF || 1)) * 100, 100)}%`,
                              height: 7, background: '#e53935', borderRadius: 4,
                            }} />
                          </div>
                        </div>
                      ))
                }
              </div>

              {/* Status breakdown */}
              <div style={card}>
                <p style={sectionTitle}>📊 Request Status Breakdown</p>
                {[
                  { label: 'Pending Approval',  count: allRequests.filter(r => r.status.startsWith('pending_')).length, color: '#f59e0b' },
                  { label: 'Fully Approved',    count: allRequests.filter(r => r.status === 'approved').length,  color: '#16a34a' },
                  { label: 'Scheduled',         count: allRequests.filter(r => r.status === 'scheduled').length,  color: '#2563eb' },
                  { label: 'Refueled',          count: allRequests.filter(r => r.status === 'refueled').length,   color: '#059669' },
                  { label: 'Denied',            count: allRequests.filter(r => r.status === 'denied').length,     color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                      <span style={{ fontSize: 13 }}>{s.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>

              {/* Finance override impact */}
              <div style={card}>
                <p style={sectionTitle}>✂️ Finance Override Impact</p>
                {(() => {
                  const overridden = allRequests.filter(r => r.liters_approved != null && r.liters_approved !== r.liters_requested);
                  const savedL = overridden.reduce((s,r) => s + (r.liters_requested - (r.liters_approved||0)), 0);
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {[
                          ['Requests Overridden', overridden.length],
                          ['Litres Saved', `${savedL.toLocaleString()} L`],
                          ['XAF Saved', fmtXAF(savedL * XAF)],
                        ].map(([k,v]) => (
                          <div key={k as string} style={{ background: '#fff5f5', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                            <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px' }}>{k}</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: '#e53935', margin: 0 }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      {overridden.length === 0
                        ? <p style={{ fontSize: 12, color: '#9ca3af' }}>No overrides this cycle</p>
                        : overridden.slice(0, 5).map(r => (
                            <div key={r._id} style={{ fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <span style={{ fontWeight: 600 }}>{r.site_name}</span>
                              <span style={{ color: '#9ca3af', marginLeft: 8 }}>
                                {r.liters_requested} L → {r.liters_approved} L
                                (saved {((r.liters_requested - r.liters_approved) * XAF).toLocaleString()} XAF)
                              </span>
                            </div>
                          ))
                      }
                    </>
                  );
                })()}
              </div>

              {/* Tom Card vs field */}
              <div style={card}>
                <p style={sectionTitle}>💳 Tom Card vs Field Refuels</p>
                {tomCard ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {[
                        ['Card Purchased (L)',  (tomCard.total_liters || 0).toLocaleString()],
                        ['Card Spent (XAF)',    fmtM(tomCard.total_amount_cfa || 0)],
                        ['Field Added (L)',     totalRefueledL.toLocaleString()],
                        ['Variance (L)',        ((tomCard.total_liters || 0) - totalRefueledL).toLocaleString()],
                      ].map(([k,v]) => (
                        <div key={k as string} style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px' }}>{k}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#2563eb', margin: 0 }}>{v}</p>
                        </div>
                      ))}
                    </div>
                    {Math.abs((tomCard.total_liters || 0) - totalRefueledL) > 200 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#991b1b' }}>
                        ⚠️ Significant variance detected between card purchases and field records. Investigate discrepancy.
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: 13 }}>Upload Tom Card statement to see reconciliation</p>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB 4: BUDGET TRACKER ══ */}
          {tab === 'budget' && (
            <div>
              {budgetData.length === 0 ? (
                <EmptyState icon={<FiPieChart size={56} color="#d1d5db" />}
                  title="No budget data" description="Upload Book11 file for this cycle to see budget tracking" />
              ) : (
                <div>
                  <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                    {budgetData.length} sites with budget data for {cycle}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {budgetData.slice(0, 50).map((b: any) => {
                      const pct = b.budget_liters > 0 ? Math.round((b.liters_used / b.budget_liters) * 100) : 0;
                      const rag = pct > 90 ? '#dc2626' : pct > 70 ? '#f59e0b' : '#16a34a';
                      return (
                        <div key={b.site_id} style={{ ...card, borderLeft: `4px solid ${rag}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{b.site_name || b.site_id}</p>
                              <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{b.cluster}</p>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: rag, background: `${rag}18`, borderRadius: 6, padding: '2px 8px' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ width: `${Math.min(pct,100)}%`, height: 6, background: rag, borderRadius: 4 }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
                            <span>Used: {b.liters_used?.toFixed(0)} L</span>
                            <span style={{ color: b.liters_remaining < 50 ? '#dc2626' : '#374151', fontWeight: 600 }}>
                              {b.liters_remaining?.toFixed(0)} L left
                            </span>
                            <span>Total: {b.budget_liters} L</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB 5: REPORTS ══ */}
          {tab === 'reports' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                {
                  title: '📊 Full Cycle Finance Report',
                  desc:  `All fuel requests for ${cycle} with approval history, approved amounts, disbursement status, and variance analysis.`,
                  action: 'Export Full Report',
                  fn: handleExport,
                  color: '#e53935',
                },
                {
                  title: '💰 Disbursement Register',
                  desc:  'All recorded disbursements with reference numbers, payment methods, and actual XAF paid.',
                  action: 'Export Disbursements',
                  fn: () => {
                    const rows = allRequests.filter(r => r.disbursed_at).map(r => ({
                      'Request ID':   `FUEL-${r._id?.slice(-6).toUpperCase()}`,
                      'Site':         r.site_name,
                      'Cluster':      r.cluster,
                      'Approved (L)': r.liters_approved || r.liters_requested,
                      'XAF Disbursed': r.disbursement?.actual_xaf || (r.liters_approved||r.liters_requested)*XAF,
                      'Reference #':  r.disbursement?.reference_number || '—',
                      'Method':       r.disbursement?.payment_method || '—',
                      'Disbursed By': r.disbursement?.disbursed_by || '—',
                      'Date':         r.disbursed_at ? fmtDate(r.disbursed_at) : '—',
                    }));
                    if (!rows.length) { showError('No disbursements yet'); return; }
                    const ws = XLSX.utils.json_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Disbursements');
                    XLSX.writeFile(wb, `Disbursements_${cycle}.xlsx`);
                    success(`Exported ${rows.length} disbursements`);
                  },
                  color: '#16a34a',
                },
                {
                  title: '✂️ Override Analysis',
                  desc:  'Cases where Finance reduced approved litres from requested, showing savings achieved.',
                  action: 'Export Overrides',
                  fn: () => {
                    const rows = allRequests.filter(r => r.liters_approved != null && r.liters_approved !== r.liters_requested).map(r => ({
                      'Request ID':    `FUEL-${r._id?.slice(-6).toUpperCase()}`,
                      'Site':          r.site_name,
                      'Cluster':       r.cluster,
                      'Requested (L)': r.liters_requested,
                      'Approved (L)':  r.liters_approved,
                      'Reduced By (L)':r.liters_requested - r.liters_approved,
                      'XAF Saved':     (r.liters_requested - r.liters_approved) * XAF,
                      'Date':          fmtDate(r.createdAt),
                    }));
                    if (!rows.length) { showError('No overrides this cycle'); return; }
                    const ws = XLSX.utils.json_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Overrides');
                    XLSX.writeFile(wb, `Finance_Overrides_${cycle}.xlsx`);
                    success('Exported');
                  },
                  color: '#f59e0b',
                },
                {
                  title: '🚨 Budget Alert Summary',
                  desc:  'Sites nearing or exceeding their cycle budget allocation.',
                  action: 'Export Budget Alerts',
                  fn: () => {
                    if (!budgetData.length) { showError('No budget data'); return; }
                    const ws = XLSX.utils.json_to_sheet(budgetData.map((b: any) => ({
                      'Site ID':    b.site_id,
                      'Site Name':  b.site_name,
                      'Cluster':    b.cluster,
                      'Budget (L)': b.budget_liters,
                      'Used (L)':   b.liters_used,
                      'Remaining':  b.liters_remaining,
                      'Used %':     b.budget_liters > 0 ? `${Math.round((b.liters_used/b.budget_liters)*100)}%` : '—',
                      'Alert':      b.alert_level,
                    })));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Budget Alerts');
                    XLSX.writeFile(wb, `Budget_Alerts_${cycle}.xlsx`);
                    success('Exported');
                  },
                  color: '#dc2626',
                },
              ].map(r => (
                <div key={r.title} style={{ ...card, borderTop: `3px solid ${r.color}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>{r.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>{r.desc}</p>
                  <button onClick={r.fn} style={{
                    background: r.color, color: '#fff', border: 'none', borderRadius: 8,
                    padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiDownload size={13} /> {r.action}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ APPROVE MODAL ══ */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Finance Approval — Set Disbursement Amount" size="sm">
        {approveTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff5f5', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{approveTarget.site_name}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Requested: {approveTarget.liters_requested} L · {fmtXAF(approveTarget.liters_requested * XAF)}
              </p>
            </div>
            <div>
              <label style={fieldLabel}>Litres Approved * <span style={{ color: '#e53935', fontWeight: 700 }}>(Finance sets the disbursement amount)</span></label>
              <input type="number" min={1} value={litresOverride}
                onChange={e => setLitresOverride(e.target.value)} style={inputSt} />
              {litresOverride && (
                <p style={{ fontSize: 11, color: '#e53935', margin: '4px 0 0' }}>
                  Disbursement: {fmtXAF(parseFloat(litresOverride || '0') * XAF)}
                  {parseFloat(litresOverride) < approveTarget.liters_requested && (
                    <span style={{ color: '#16a34a', marginLeft: 8 }}>
                      (saving {fmtXAF((approveTarget.liters_requested - parseFloat(litresOverride)) * XAF)})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label style={fieldLabel}>Finance Comments</label>
              <textarea value={approveComment} onChange={e => setApproveComment(e.target.value)} rows={3}
                placeholder="Budget justification, notes for HOB..." style={{ ...inputSt, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setApproveTarget(null)} variant="secondary">Cancel</Button>
              <Button onClick={handleApprove} variant="success" loading={approving}>
                <FiCheckCircle style={{ marginRight: 4 }} /> Approve & Forward to HOB
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
              <p style={{ fontWeight: 700, color: '#991b1b', margin: 0 }}>{rejectTarget.site_name}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                {rejectTarget.liters_requested} L · {rejectTarget.urgency.toUpperCase()}
              </p>
            </div>
            <div>
              <label style={fieldLabel}>Reason for rejection *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
                placeholder="Budget exhausted / insufficient justification / duplicate request..." style={{ ...inputSt, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setRejectTarget(null)} variant="secondary">Cancel</Button>
              <Button onClick={handleReject} variant="danger" loading={rejecting}>
                <FiXCircle style={{ marginRight: 4 }} /> Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ DISBURSE MODAL ══ */}
      <Modal isOpen={!!disburseTarget} onClose={() => setDisburseTarget(null)} title="Record Fuel Disbursement" size="sm">
        {disburseTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{disburseTarget.site_name}</p>
              <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
                Approved: {disburseTarget.liters_approved || disburseTarget.liters_requested} L
                · {fmtXAF((disburseTarget.liters_approved || disburseTarget.liters_requested) * XAF)}
              </p>
            </div>
            <div>
              <label style={fieldLabel}>Payment Reference Number *</label>
              <input value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="e.g. TRF-2026-07-00123" style={inputSt} />
            </div>
            <div>
              <label style={fieldLabel}>Actual XAF Disbursed</label>
              <input type="number" value={actualXAF} onChange={e => setActualXAF(e.target.value)}
                placeholder={String((disburseTarget.liters_approved||disburseTarget.liters_requested)*XAF)} style={inputSt} />
            </div>
            <div>
              <label style={fieldLabel}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...inputSt, background: '#fff' }}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="tom_card">Tom Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setDisburseTarget(null)} variant="secondary">Cancel</Button>
              <Button onClick={handleDisburse} variant="primary" loading={disbursing}>
                <FiDollarSign style={{ marginRight: 4 }} /> Record Disbursement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinanceDashboard;
