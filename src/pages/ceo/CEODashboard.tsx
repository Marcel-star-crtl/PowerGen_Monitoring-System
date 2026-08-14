/**
 * CEODashboard.tsx
 * src/pages/ceo/CEODashboard.tsx
 *
 * ROLE: ceo (Tom — CEO, L6, only for ≥100L requests)
 *
 * The CEO gets a glass-panel executive command center:
 *  TAB 1 — Final Approvals  CEO-level requests (≥100L) with full history
 *  TAB 2 — Command Center   Live org-wide fuel health, spend velocity,
 *                           cluster map, efficiency heatmap
 *  TAB 3 — Financial Intel  Cumulative spend curve, YTD totals,
 *                           cost-per-cluster, Tom Card vs field delta
 *  TAB 4 — Risk Radar       Over-refuel anomalies, theft flags,
 *                           budget exhaustion sites, denial patterns
 *  TAB 5 — Board Report     One-click board-ready XLSX export with
 *                           summary + cluster table + risk flags
 *
 * Route: /ceo  (allowedRoles=['ceo','admin'])
 */

import React, { useState, useCallback, useEffect } from 'react';
import apiClient from '@/api/client';
import { fuelRequestApi } from '@/api/dieselApi';
import { cyclesApi } from '@/api/dieselApi';
import { useAuthContext }  from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Button }  from '@/components/common/Button';
import { Modal }   from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import * as XLSX from 'xlsx';
import {
  FiCheckCircle, FiXCircle, FiActivity, FiBarChart2,
  FiAlertTriangle, FiDownload, FiRefreshCw, FiShield,
  FiTrendingUp, FiEye, FiZap, FiDroplet, FiStar,
  FiGlobe, FiDollarSign, FiClock,
} from 'react-icons/fi';

const apiReq = {
  pendingForMe: ()        => apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),
  list:         (p: any)  => apiClient.get('/fuel-requests', { params: p }).then(r => r.data),
  approve:      (id: string, d: any) => apiClient.patch(`/fuel-requests/${id}/approve`, d).then(r => r.data),
  reject:       (id: string, c: string) => apiClient.patch(`/fuel-requests/${id}/reject`, { comments: c }).then(r => r.data),
  budgetAlerts: ()        => apiClient.get('/fuel-requests/budget-alerts', { params: { threshold_liters: 50 } }).then(r => r.data),
  budgetUtil:  (cycle: string) => apiClient.get(`/site-budget/${cycle}/aggregate`).then(r => r.data),
};

const XAF     = 828;
const fmtXAF  = (n: number) => `XAF ${Math.round(n).toLocaleString()}`;
const fmtM    = (n: number) => `${(n/1_000_000).toFixed(2)}M`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });



const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 22px' };
const inputSt: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };

// Premium KPI card
function ExecKPI({ label, value, sub, color = '#111', icon, size = 'normal' }: any) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      border: `1px solid ${color}40`,
      borderRadius: 14, padding: size === 'large' ? '22px 24px' : '16px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: 16, top: 16, color, opacity: 0.15, fontSize: 40 }}>{icon}</div>
      <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ fontSize: size === 'large' ? 30 : 22, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#6b7280', margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}

const CEODashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();
  const [cycles,   setCycles]   = useState<{cycle_key:string; label:string; status:string}[]>([]);
  const [cycle,    setCycle]    = useState('');
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [tab, setTab]     = useState<'approvals' | 'command' | 'intel' | 'risk' | 'board'>('approvals');

  const [pending,  setPending]  = useState<any[]>([]);
  const [all,      setAll]      = useState<any[]>([]);
  const [budget,   setBudget]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);

  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [approveComment,setApproveComment]= useState('');
  const [approving,     setApproving]     = useState(false);
  const [rejectTarget,  setRejectTarget]  = useState<any>(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [rejecting,     setRejecting]     = useState(false);
  const [emergencyTarget, setEmergencyTarget] = useState<{ id: string; site: string; liters: number } | null>(null);

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
    setLoading(true);
    try {
      const [pendRes, allRes, budRes] = await Promise.all([
        apiReq.pendingForMe(),
        apiReq.list({ cycle_key: cycle, limit: 500 }),
        apiReq.budgetAlerts(),
      ]);
      setPending(pendRes.data || []);
      setAll(allRes.data || []);
      setBudget(budRes.data || []);
    } catch { showError('Failed to load data'); }
    finally { setLoading(false); }
  }, [cycle]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await apiReq.approve(approveTarget._id, { comments: approveComment });
      success('✅ CEO Final Approval granted — diesel manager notified to assign refueler');
      setApproveTarget(null); setApproveComment(''); loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Failed'); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { showError('Reason required'); return; }
    setRejecting(true);
    try {
      await apiReq.reject(rejectTarget._id, rejectReason);
      success('Request rejected'); setRejectTarget(null); setRejectReason(''); loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Failed'); }
    finally { setRejecting(false); }
  };

  // ── Derived analytics ──────────────────────────────────────────────────────
  const totalL      = all.reduce((s,r) => s + (r.liters_approved||r.liters_requested), 0);
  const totalXAF    = totalL * XAF;
  const refueledAll = all.filter(r => ['refueled','completed'].includes(r.status));
  const refueledL   = refueledAll.reduce((s,r) => s + (r.liters_actually_added||0), 0);
  const overRefuel  = all.filter(r => (r.cycle_refuel_count||0) > 3);
  const nearBudget  = budget.filter((b: any) => b.liters_remaining < 50);
  const efficiencyPct = totalL > 0 ? Math.round((refueledL / totalL) * 100) : 0;
  const denied      = all.filter(r => r.status === 'denied');
  const ceoRequests = all.filter(r => r.liters_requested >= 100); // all CEO-threshold requests

  // Cluster map
  const clusterMap: Record<string, { l: number; xaf: number; count: number; refueled: number; critical: number }> = {};
  all.forEach(r => {
    const c = r.cluster || 'Unknown';
    if (!clusterMap[c]) clusterMap[c] = { l: 0, xaf: 0, count: 0, refueled: 0, critical: 0 };
    clusterMap[c].l     += r.liters_approved || r.liters_requested;
    clusterMap[c].xaf   += (r.liters_approved || r.liters_requested) * XAF;
    clusterMap[c].count++;
    if (['refueled','completed'].includes(r.status)) clusterMap[c].refueled++;
    if (r.urgency === 'critical') clusterMap[c].critical++;
  });

  // Board export
  const handleBoardExport = () => {
    const wb = XLSX.utils.book_new();

    // Executive Summary
    const summary = [
      ['GRATO Engineering Telecoms', '', '', ''],
      ['Fuel Operations — CEO Board Report', '', '', cycle],
      ['', '', '', ''],
      ['HEADLINE METRICS', '', '', ''],
      ['Total Fuel Requests',          all.length,                             '', ''],
      ['Total Litres Approved',        `${totalL.toLocaleString()} L`,         '', ''],
      ['Total Committed (XAF)',        fmtXAF(totalXAF),                       '', ''],
      ['Total Actually Refueled (L)', `${refueledL.toLocaleString()} L`,       '', ''],
      ['Execution Efficiency',        `${efficiencyPct}%`,                     '', ''],
      ['CEO-Level Requests (≥100L)',  ceoRequests.length,                      '', ''],
      ['Over-Refuel Incidents',       overRefuel.length,                       '', ''],
      ['Sites Near Budget Exhaustion',nearBudget.length,                       '', ''],
      ['Requests Denied',             denied.length,                           '', ''],
      ['', '', '', ''],
      ['CLUSTER BREAKDOWN', '', '', ''],
      ['Cluster', 'Requests', 'Litres Approved', 'XAF Committed', 'Completed', 'Critical Urgency'],
      ...Object.entries(clusterMap).sort((a,b) => b[1].xaf - a[1].xaf).map(
        ([c,v]) => [c, v.count, v.l, fmtXAF(v.xaf), v.refueled, v.critical]
      ),
      ['', '', '', ''],
      ['RISK FLAGS', '', '', ''],
      ['Flag', 'Count', 'Impact', 'Action Required'],
      overRefuel.length > 0 && ['Over-Refuel Incidents', overRefuel.length, 'HIGH', 'Investigate consumption pattern'],
      nearBudget.length > 0 && ['Budget Exhaustion', nearBudget.length, 'MEDIUM', 'Review cycle allocations'],
      denied.length > 0     && ['Denied Requests', denied.length, 'LOW', 'Review denial reasons'],
    ].filter(Boolean);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary as any[]), 'Executive Summary');

    // Raw data
    const rows = all.map(r => ({
      'ID':            `FUEL-${r._id?.slice(-6).toUpperCase()}`,
      'Date':          fmtDate(r.createdAt),
      'Site':          r.site_name, 'Cluster': r.cluster,
      'Requested (L)': r.liters_requested, 'Approved (L)': r.liters_approved ?? '—',
      'XAF':           fmtXAF((r.liters_approved||r.liters_requested)*XAF),
      'Refueled (L)':  r.liters_actually_added ?? '—',
      'Status':        r.status, 'Urgency': r.urgency,
      'Refuel Count':  r.cycle_refuel_count || 0,
      'CEO Required':  r.liters_requested >= 100 ? 'Yes' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'All Requests');

    // Cluster sheet
    const clRows = Object.entries(clusterMap).map(([c,v]) => ({
      'Cluster': c, 'Requests': v.count, 'Litres': v.l,
      'XAF Committed': fmtXAF(v.xaf), 'Completed': v.refueled, 'Critical': v.critical,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clRows), 'By Cluster');

    XLSX.writeFile(wb, `CEO_Board_Report_${cycle}.xlsx`);
    success('Board report exported');
  };

  // ── CEO approval card (premium) ───────────────────────────────────────────
  const CEOApprovalCard = ({ r }: { r: any }) => {
    const xaf = (r.liters_approved || r.liters_requested) * XAF;
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1b2a 100%)',
        border: '1px solid rgba(251,191,36,0.3)', borderRadius: 16,
        marginBottom: 16, overflow: 'hidden', color: '#fff',
      }}>
        {/* Gold accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #e53935, #ef5350, #e53935)' }} />
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 17 }}>{r.site_name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(251,191,36,0.2)', color: '#ef5350', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '2px 8px' }}>
                  👑 CEO FINAL APPROVAL
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                  background: r.urgency === 'critical' ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)',
                  color:      r.urgency === 'critical' ? '#f87171' : '#ef5350',
                }}>{r.urgency.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px' }}>
                {r.site_id} · {r.cluster} · FUEL-{r._id?.slice(-6).toUpperCase()} · {fmtDate(r.createdAt)}
                {r.requested_by && ` · by ${r.requested_by.fullName}`}
              </p>

              {/* Full approval trail — all previous levels */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete Approval History</p>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(r.approvalChain || []).slice(0, -1).map((s: any, i: number, arr: any[]) => (
                    <React.Fragment key={s.level}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: s.status === 'approved' ? '#16a34a' : s.status === 'rejected' ? '#dc2626' : '#374151',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff',
                        }}>{s.status === 'approved' ? '✓' : s.level}</div>
                        <span style={{ fontSize: 9, color: '#6b7280', maxWidth: 56, textAlign: 'center', lineHeight: 1.2 }}>
                          {s.approver.name.split(' ')[1] || s.approver.name}
                        </span>
                      </div>
                      {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: s.status === 'approved' ? '#16a34a' : '#374151', minWidth: 20, margin: '0 3px', marginBottom: 14 }} />}
                    </React.Fragment>
                  ))}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e53935', border: '2px solid #ef5350', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: 6 }}>👑</div>
                </div>
              </div>

              {/* Finance decision highlight */}
              {(() => {
                const fin = r.approvalChain?.find((s: any) => s.level === 4 && s.status === 'approved');
                return fin ? (
                  <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#c4b5fd', marginBottom: 10 }}>
                    💜 Finance set amount: <strong>{r.liters_approved} L = {fmtXAF(r.liters_approved * XAF)}</strong>
                    {fin.comments && <span style={{ color: '#9ca3af', marginLeft: 6 }}>"{fin.comments}"</span>}
                  </div>
                ) : null;
              })()}

              <p style={{ fontSize: 13, color: '#d1d5db', margin: 0, fontStyle: 'italic' }}>
                "{r.request_reason}"
              </p>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px' }}>Disbursement Amount</p>
              <p style={{ fontSize: 34, fontWeight: 900, color: '#ef5350', margin: '0 0 2px', lineHeight: 1 }}>{r.liters_approved || r.liters_requested} L</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{fmtXAF(xaf)}</p>
              {xaf > 5_000_000 && <p style={{ fontSize: 11, color: '#f87171', margin: '4px 0 0', fontWeight: 700 }}>⚠ High-value transaction</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setApproveTarget(r)} style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: 10,
              padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FiCheckCircle size={15} /> Grant Final Approval
            </button>
            <button onClick={() => setRejectTarget(r)} style={{
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10,
              padding: '10px 20px', color: '#f87171', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FiXCircle size={15} /> Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#0a0f1e', minHeight: '100vh', padding: '0 0 60px', color: '#fff' }}>

      {/* ── Executive Header ── */}
      <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#e53935', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              ★ Chief Executive Officer
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 6px', background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Executive Command Center
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {user?.fullName} · GRATO Engineering Telecoms Fuel Operations
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cyclesLoading ? (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading cycles…</span>
            ) : (
              <select value={cycle} onChange={e => setCycle(e.target.value)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff', cursor: 'pointer',
            }}>
              {cycles.map(c => (
                <option key={c.cycle_key} value={c.cycle_key} style={{ background: '#1a1a2e' }}>
                  {c.label}{c.status !== 'open' ? ` (${c.status})` : ''}
                </option>
              ))}
            </select>
            )}
            <button onClick={loadAll} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#9ca3af' }}>
              <FiRefreshCw size={14} />
            </button>
            <button onClick={handleBoardExport} style={{
              background: 'linear-gradient(135deg, #e53935, #c62828)', border: 'none', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', color: '#000', fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FiDownload size={13} /> Board XLSX
            </button>
            <button onClick={() => window.open(`/api/diesel/reports/board-pdf/${cycle}`, '_blank')} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FiDownload size={13} /> Board PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 32px' }}>
        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 32 }}>
          <ExecKPI label="My Pending (CEO)"     value={pending.length}          color="#e53935" icon={<FiClock />} />
          <ExecKPI label="Total Committed"       value={fmtM(totalXAF) + 'M'} sub="XAF" color="#22d3ee" icon={<FiDollarSign />} />
          <ExecKPI label="Litres Approved"       value={`${(totalL/1000).toFixed(1)}k L`} color="#34d399" icon={<FiDroplet />} />
          <ExecKPI label="Execution Rate"        value={`${efficiencyPct}%`} color={efficiencyPct > 80 ? '#34d399' : '#f87171'} icon={<FiZap />} />
          <ExecKPI label="Over-Refuel Incidents" value={overRefuel.length} color={overRefuel.length > 0 ? '#f87171' : '#9ca3af'} icon={<FiAlertTriangle />} />
          <ExecKPI label="CEO Requests"          value={ceoRequests.length} sub="≥100L threshold" color="#a78bfa" icon={<FiStar />} />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 28 }}>
          {([
            { key: 'approvals', label: 'Final Approvals',   badge: pending.length, icon: <FiCheckCircle size={13}/> },
            { key: 'command',   label: 'Command Center',    badge: 0,              icon: <FiGlobe size={13}/> },
            { key: 'intel',     label: 'Financial Intel',   badge: 0,              icon: <FiTrendingUp size={13}/> },
            { key: 'risk',      label: 'Risk Radar',        badge: overRefuel.length + nearBudget.length, icon: <FiAlertTriangle size={13}/> },
            { key: 'board',     label: 'Board Report',      badge: 0,              icon: <FiActivity size={13}/> },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: 'none', marginBottom: -1,
                borderBottom: tab === t.key ? '2px solid #e53935' : '2px solid transparent',
                color: tab === t.key ? '#e53935' : '#6b7280',
              }}>
              {t.icon} {t.label}
              {t.badge > 0 && <span style={{ background: '#e53935', color: '#000', borderRadius: 10, fontSize: 9, fontWeight: 900, padding: '1px 5px' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner size="lg" /></div> : (
          <>
            {/* ══ TAB 1: APPROVALS ══ */}
            {tab === 'approvals' && (
              pending.length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👑</div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#9ca3af', margin: '0 0 8px' }}>No CEO-level requests pending</p>
                    <p style={{ fontSize: 13 }}>Requests ≥100 L that have cleared all 5 previous approval levels will appear here</p>
                  </div>
                )
                : (
                  <div>
                    <p style={{ fontSize: 13, color: '#e53935', fontWeight: 600, marginBottom: 16 }}>
                      👑 {pending.length} request{pending.length !== 1 ? 's' : ''} awaiting your final signature.
                      All 5 previous approval levels have been cleared.
                    </p>
                    {pending.map(r => <CEOApprovalCard key={r._id} r={r} />)}
                  </div>
                )
            )}

            {/* ══ TAB 2: COMMAND CENTER ══ */}
            {tab === 'command' && (
              <div>
                {/* Cluster grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
                  {Object.entries(clusterMap).sort((a,b) => b[1].xaf - a[1].xaf).map(([cluster, data]) => {
                    const completionPct = data.count > 0 ? Math.round((data.refueled/data.count)*100) : 0;
                    const color = completionPct > 75 ? '#34d399' : completionPct > 40 ? '#e53935' : '#f87171';
                    return (
                      <div key={cluster} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${color}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>{cluster}</p>
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{data.count} requests</p>
                          </div>
                          <p style={{ fontWeight: 900, color, margin: 0, fontSize: 22 }}>{completionPct}%</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ width: `${completionPct}%`, height: 5, background: color, borderRadius: 4 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
                          <span>{(data.l/1000).toFixed(1)}k L</span>
                          <span>{fmtM(data.xaf)} XAF</span>
                          {data.critical > 0 && <span style={{ color: '#f87171' }}>⚠ {data.critical} critical</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Recent high-value */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 14px', color: '#e53935' }}>
                    ★ CEO-Level Requests (≥100L) — {cycle}
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Site','Cluster','L Requested','XAF','Status','Date'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ceoRequests.slice(0,20).map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '9px 10px', fontWeight: 600 }}>{r.site_name}</td>
                          <td style={{ padding: '9px 10px', color: '#9ca3af' }}>{r.cluster}</td>
                          <td style={{ padding: '9px 10px', color: '#e53935', fontWeight: 700 }}>{(r.liters_approved||r.liters_requested).toLocaleString()}</td>
                          <td style={{ padding: '9px 10px', color: '#9ca3af' }}>{fmtM((r.liters_approved||r.liters_requested)*XAF)}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: r.status === 'refueled' ? 'rgba(52,211,153,0.15)' : r.status === 'denied' ? 'rgba(248,113,113,0.15)' : 'rgba(245,158,11,0.15)', color: r.status === 'refueled' ? '#34d399' : r.status === 'denied' ? '#f87171' : '#e53935' }}>
                              {r.status.replace(/_/g,' ')}
                            </span>
                          </td>
                          <td style={{ padding: '9px 10px', color: '#6b7280' }}>{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ TAB 3: FINANCIAL INTEL ══ */}
            {tab === 'intel' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Top spend clusters */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 16px', color: '#34d399' }}>💰 Spend by Cluster</p>
                  {Object.entries(clusterMap).sort((a,b) => b[1].xaf - a[1].xaf).map(([c, v]) => (
                    <div key={c} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{c}</span>
                        <span style={{ color: '#9ca3af' }}>{fmtM(v.xaf)} XAF ({v.l.toLocaleString()} L)</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${totalXAF > 0 ? Math.round((v.xaf/totalXAF)*100) : 0}%`, height: 6, background: '#22d3ee', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* YTD snapshot */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 16px', color: '#a78bfa' }}>📊 Cycle Snapshot</p>
                  {[
                    ['Total Requests',        all.length,                                    '#fff'],
                    ['CEO-Level (≥100L)',     ceoRequests.length,                            '#e53935'],
                    ['Total Litres Approved', `${totalL.toLocaleString()} L`,               '#34d399'],
                    ['Total XAF Committed',   fmtXAF(totalXAF),                             '#22d3ee'],
                    ['Actually Refueled',     `${refueledL.toLocaleString()} L`,            '#a78bfa'],
                    ['Execution Efficiency',  `${efficiencyPct}%`,                           efficiencyPct > 80 ? '#34d399' : '#f87171'],
                    ['Variance (Approved-Actual)', `${(totalL - refueledL).toLocaleString()} L`, totalL > refueledL ? '#e53935' : '#34d399'],
                    ['Denied Requests',       denied.length,                                 '#9ca3af'],
                  ].map(([k,v,c]) => (
                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                      <span style={{ color: '#9ca3af' }}>{k}</span>
                      <span style={{ fontWeight: 700, color: c as string }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ TAB 4: RISK RADAR ══ */}
            {tab === 'risk' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Over-refuel */}
                <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 14px', color: '#f87171' }}>🔴 Over-Refuel Incidents ({overRefuel.length})</p>
                  {overRefuel.length === 0
                    ? <p style={{ color: '#6b7280', fontSize: 13 }}>No incidents this cycle</p>
                    : overRefuel.map(r => (
                        <div key={r._id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                          <span style={{ fontWeight: 600 }}>{r.site_name}</span>
                          <span style={{ color: '#f87171', fontWeight: 700, marginLeft: 8 }}>{r.cycle_refuel_count}× refueled</span>
                          <span style={{ color: '#6b7280', marginLeft: 8 }}>{r.cluster}</span>
                        </div>
                      ))
                  }
                </div>
                {/* Budget exhaustion */}
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 14px', color: '#e53935' }}>🟡 Budget Exhaustion ({nearBudget.length})</p>
                  {nearBudget.length === 0
                    ? <p style={{ color: '#6b7280', fontSize: 13 }}>All sites within budget</p>
                    : nearBudget.slice(0,10).map((b: any) => (
                        <div key={b.site_id} style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>{b.site_name || b.site_id}</span>
                            <span style={{ color: b.liters_remaining <= 0 ? '#f87171' : '#e53935', fontWeight: 700 }}>
                              {b.liters_remaining <= 0 ? '❌ EXHAUSTED' : `${b.liters_remaining.toFixed(0)} L left`}
                            </span>
                          </div>
                        </div>
                      ))
                  }
                </div>
                {/* All clear */}
                {overRefuel.length === 0 && nearBudget.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#34d399' }}>
                    <FiShield size={48} />
                    <p style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 4px' }}>All Clear</p>
                    <p style={{ color: '#6b7280', fontSize: 13 }}>No risk flags for {cycle}</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 5: BOARD REPORT ══ */}
            {tab === 'board' && (
              <div>
                {/* Preview */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Board Report Preview</p>
                      <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Fuel Operations — {cycle}</h2>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>GRATO Engineering Telecoms · Prepared {new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                    <button onClick={handleBoardExport} style={{
                      background: 'linear-gradient(135deg, #e53935, #c62828)', border: 'none',
                      borderRadius: 10, padding: '12px 24px', cursor: 'pointer', color: '#000',
                      fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <FiDownload size={16} /> Generate Full Report
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                    {[
                      { label: 'Total Requests',    value: all.length,                      color: '#fff' },
                      { label: 'Litres Approved',   value: `${totalL.toLocaleString()} L`, color: '#34d399' },
                      { label: 'XAF Committed',     value: fmtM(totalXAF) + 'M',           color: '#22d3ee' },
                      { label: 'Execution Rate',    value: `${efficiencyPct}%`,             color: efficiencyPct > 80 ? '#34d399' : '#f87171' },
                      { label: 'Active Clusters',   value: Object.keys(clusterMap).length,  color: '#a78bfa' },
                      { label: 'CEO Approvals',     value: ceoRequests.length,              color: '#e53935' },
                      { label: 'Risk Flags',        value: overRefuel.length + nearBudget.length, color: overRefuel.length + nearBudget.length > 0 ? '#f87171' : '#34d399' },
                      { label: 'Denials',           value: denied.length,                   color: '#9ca3af' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${s.color}` }}>
                        <p style={{ fontSize: 10, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center' }}>
                  Report includes: Executive Summary · All Requests · Cluster Breakdown · Risk Flags — formatted for board presentation
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ APPROVE MODAL ══ */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="CEO Final Approval" size="sm">
        {approveTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 4px' }}>
                👑 {approveTarget.site_name}
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                {approveTarget.liters_approved || approveTarget.liters_requested} L
                · {fmtXAF((approveTarget.liters_approved||approveTarget.liters_requested)*XAF)}
                · {approveTarget.cycle_key}
              </p>
            </div>
            <div>
              <label style={fieldLabel}>CEO Comments (recorded in audit trail)</label>
              <textarea value={approveComment} onChange={e => setApproveComment(e.target.value)} rows={3}
                placeholder="Strategic notes, conditions, or context for this approval..."
                style={{ ...inputSt, background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setApproveTarget(null)} variant="secondary">Cancel</Button>
              <button onClick={handleApprove} disabled={approving} style={{
                background: approving ? '#374151' : 'linear-gradient(135deg, #16a34a, #15803d)',
                border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: approving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <FiCheckCircle size={15} /> {approving ? 'Processing…' : 'Grant CEO Final Approval'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ REJECT MODAL ══ */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Request" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={fieldLabel}>CEO Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
              placeholder="Strategic reason for rejection (recorded in permanent audit trail)..."
              style={{ ...inputSt, background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setRejectTarget(null)} variant="secondary">Cancel</Button>
            <Button onClick={handleReject} variant="danger" loading={rejecting}><FiXCircle style={{ marginRight: 4 }} /> Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Emergency Override Modal */}
      {emergencyTarget && (
        <EmergencyApproveModal
          requestId={emergencyTarget.id}
          siteName={emergencyTarget.site}
          litersRequested={emergencyTarget.liters}
          onDone={() => { setEmergencyTarget(null); loadAll(); }}
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

export default CEODashboard;



