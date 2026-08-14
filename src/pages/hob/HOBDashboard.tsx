/**
 * HOBDashboard.tsx
 * src/pages/hob/HOBDashboard.tsx
 *
 * ROLE: head_of_business (Kelvin E.T — Head of Business, L5)
 *
 * HOB sees everything at an executive operational level:
 *  TAB 1 — Approvals       Pending L5 approvals with full cost + history
 *  TAB 2 — Operations      Live view of all active requests across clusters
 *  TAB 3 — Spend Control   Budget vs spend by cluster, over-refuel alerts,
 *                          anomaly flags, cost efficiency metrics
 *  TAB 4 — Team Oversight  Who approved what, response time per approver,
 *                          Finance override patterns
 *  TAB 5 — Executive Report Monthly summary ready to share with CEO
 *
 * Route: /hob  (allowedRoles=['head_of_business','admin'])
 */

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { fuelRequestApi } from '@/api/dieselApi';
import { cyclesApi } from '@/api/dieselApi';
import { useAuthContext }  from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card }    from '@/components/common/Card';
import { Button }  from '@/components/common/Button';
import { Modal }   from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import * as XLSX from 'xlsx';
import {
  FiCheckCircle, FiXCircle, FiClock, FiDroplet, FiBarChart2,
  FiAlertTriangle, FiDownload, FiRefreshCw, FiUsers, FiActivity,
  FiTrendingUp, FiEye, FiZap, FiMapPin, FiShield,
} from 'react-icons/fi';

const api = {
  pendingForMe: ()           => apiClient.get('/fuel-requests/pending-for-me').then(r => r.data),
  list:         (p: any)     => apiClient.get('/fuel-requests', { params: p }).then(r => r.data),
  approve:      (id: string, d: any) => apiClient.patch(`/fuel-requests/${id}/approve`, d).then(r => r.data),
  reject:       (id: string, c: string) => apiClient.patch(`/fuel-requests/${id}/reject`, { comments: c }).then(r => r.data),
  budgetAlerts: ()           => apiClient.get('/fuel-requests/budget-alerts', { params: { threshold_liters: 50 } }).then(r => r.data),
  budgetUtil:   (cycle: string) => apiClient.get(`/site-budget/${cycle}/utilisation`, { params: { alert_threshold_pct: 70 } }).then(r => r.data),
};

const XAF     = 828;
const fmtXAF  = (n: number) => `XAF ${Math.round(n).toLocaleString()}`;
const fmtM    = (n: number) => `${(n/1_000_000).toFixed(2)}M`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });



const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 22px' };
const inputSt: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' as const };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };

function KPI({ label, value, sub, color = '#111827', icon }: any) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
        </div>
        <div style={{ color, opacity: 0.2, fontSize: 26 }}>{icon}</div>
      </div>
    </div>
  );
}

const HOBDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();
  const [cycles,   setCycles]   = useState<{cycle_key:string; label:string; status:string}[]>([]);
  const [cycle,    setCycle]    = useState('');
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [tab, setTab]     = useState<'approvals' | 'operations' | 'spend' | 'team' | 'report'>('approvals');

  const [pending,     setPending]     = useState<any[]>([]);
  const [all,         setAll]         = useState<any[]>([]);
  const [budget,      setBudget]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);

  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [approveComment,setApproveComment]= useState('');
  const [emergencyTarget, setEmergencyTarget] = useState<{id:string;site:string;liters:number}|null>(null);
  const [approving,    setApproving]     = useState(false);
  const [rejectTarget, setRejectTarget]  = useState<any>(null);
  const [rejectReason, setRejectReason]  = useState('');
  const [rejecting,    setRejecting]     = useState(false);
  const [viewTarget,   setViewTarget]    = useState<any>(null);

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
        api.pendingForMe(),
        api.list({ cycle_key: cycle, limit: 500 }),
        api.budgetAlerts(),
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
      await api.approve(approveTarget._id, { comments: approveComment });
      success(approveTarget.liters_requested >= 100 ? 'Approved → forwarded to CEO for final sign-off' : '✅ Fully approved — diesel manager notified');
      setApproveTarget(null); setApproveComment(''); loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Failed'); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { showError('Reason required'); return; }
    setRejecting(true);
    try {
      await api.reject(rejectTarget._id, rejectReason);
      success('Rejected'); setRejectTarget(null); setRejectReason(''); loadAll();
    } catch (e: any) { showError(e?.response?.data?.error || 'Failed'); }
    finally { setRejecting(false); }
  };

  // Analytics
  const totalL    = all.reduce((s,r) => s + (r.liters_approved||r.liters_requested), 0);
  const totalXAF  = totalL * XAF;
  const refueled  = all.filter(r => ['refueled','completed'].includes(r.status));
  const overRefuel = all.filter(r => (r.cycle_refuel_count||0) > 3);
  const critical  = all.filter(r => r.urgency === 'critical');
  const denied    = all.filter(r => r.status === 'denied');

  // Cluster breakdown
  const clusterMap: Record<string, { count: number; liters: number; xaf: number; refueled: number }> = {};
  all.forEach(r => {
    const c = r.cluster || 'Unknown';
    if (!clusterMap[c]) clusterMap[c] = { count: 0, liters: 0, xaf: 0, refueled: 0 };
    clusterMap[c].count++;
    clusterMap[c].liters += r.liters_approved || r.liters_requested;
    clusterMap[c].xaf    += (r.liters_approved || r.liters_requested) * XAF;
    if (['refueled','completed'].includes(r.status)) clusterMap[c].refueled++;
  });

  // Approver response stats (from chain data)
  const approverStats: Record<string, { count: number; avgDays: number }> = {};
  all.forEach(r => {
    (r.approvalChain || []).forEach((s: any) => {
      if (s.status === 'approved' && s.actionDate) {
        const name = s.approver.name;
        if (!approverStats[name]) approverStats[name] = { count: 0, avgDays: 0 };
        approverStats[name].count++;
      }
    });
  });

  const handleExportReport = () => {
    const rows = all.map(r => ({
      'ID':           `FUEL-${r._id?.slice(-6).toUpperCase()}`,
      'Date':         fmtDate(r.createdAt),
      'Site':         r.site_name, 'Cluster': r.cluster,
      'Requested (L)':r.liters_requested, 'Approved (L)': r.liters_approved ?? '—',
      'XAF':          fmtXAF((r.liters_approved||r.liters_requested)*XAF),
      'Status':       r.status, 'Urgency': r.urgency,
      'Refuel Count': r.cycle_refuel_count || 0,
      'Requested By': r.requested_by?.fullName || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `HOB_Report_${cycle}`);

    // Summary sheet
    const summary = [
      ['GRATO Fuel Summary Report', '', cycle],
      ['Generated by', user?.fullName, new Date().toLocaleDateString()],
      ['', '', ''],
      ['Total Requests', all.length, ''],
      ['Total Approved (L)', totalL, ''],
      ['Total Committed (XAF)', fmtXAF(totalXAF), ''],
      ['Total Actually Refueled (L)', refueled.reduce((s,r) => s + (r.liters_actually_added||0), 0), ''],
      ['Denied Requests', denied.length, ''],
      ['Over-Refuel Alerts', overRefuel.length, ''],
      ['Critical Urgency', critical.length, ''],
      ['', '', ''],
      ['Cluster', 'Requests', 'Litres', 'XAF'],
      ...Object.entries(clusterMap).map(([c,v]) => [c, v.count, v.liters, fmtXAF(v.xaf)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    XLSX.writeFile(wb, `HOB_Executive_Report_${cycle}.xlsx`);
    success('Executive report exported');
  };

  // ── Approval card ─────────────────────────────────────────────────────────
  const ApprovalCard = ({ r }: { r: any }) => {
    const needsCEO = r.liters_requested >= 100;
    return (
      <div style={{ ...card, marginBottom: 12, border: '2px solid #6366f1', borderLeft: '6px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{r.site_name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#eeeeee', color: '#222222', borderRadius: 6, padding: '2px 8px' }}>
                L5 HOB — YOUR TURN
              </span>
              {needsCEO && <span style={{ fontSize: 11, fontWeight: 700, background: '#fce7f3', color: '#9d174d', borderRadius: 6, padding: '2px 8px' }}>👑 Will go to CEO</span>}
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                background: r.urgency === 'critical' ? '#fee2e2' : '#fef3c7',
                color:      r.urgency === 'critical' ? '#991b1b' : '#92400e',
              }}>{r.urgency.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
              {r.site_id} · {r.cluster} · FUEL-{r._id?.slice(-6).toUpperCase()} · {fmtDate(r.createdAt)}
            </div>
            {/* Finance already approved — show their decision */}
            {(() => {
              const financeStep = r.approvalChain?.find((s: any) => s.level === 4 && s.status === 'approved');
              return financeStep ? (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f3ff', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
                  <FiCheckCircle size={11} color="#7c3aed" style={{ marginRight: 4 }} />
                  Finance approved: <strong>{r.liters_approved || r.liters_requested} L</strong>
                  {' = '}{fmtXAF((r.liters_approved||r.liters_requested)*XAF)}
                  {financeStep.comments && ` · "${financeStep.comments}"`}
                </div>
              ) : null;
            })()}
            <div style={{ marginTop: 8, fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
              "{r.request_reason}"
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#4f46e5' }}>{r.liters_approved || r.liters_requested} L</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtXAF((r.liters_approved||r.liters_requested)*XAF)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button onClick={() => setApproveTarget(r)} variant="success" size="sm">
            <FiCheckCircle style={{ marginRight: 4 }} /> {needsCEO ? 'Approve → CEO' : 'Approve → Complete'}
          </Button>
          <Button onClick={() => setRejectTarget(r)} variant="danger" size="sm">
            <FiXCircle style={{ marginRight: 4 }} /> Reject
          </Button>
          <Button onClick={() => setViewTarget(r)} variant="ghost" size="sm">
            <FiEye style={{ marginRight: 4 }} /> Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #111111, #222222)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Head of Business</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px' }}>Operations Command</h1>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
              {user?.fullName} · Fuel Approvals, Spend Control & Team Oversight
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
            <button onClick={handleExportReport} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiDownload size={13} /> Executive Report
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
        <KPI label="My Pending (L5)"    value={pending.length}          color="#4f46e5"  icon={<FiClock />} />
        <KPI label="Active Requests"    value={all.filter(r => !['denied','completed'].includes(r.status)).length} color="#2563eb" icon={<FiActivity />} />
        <KPI label="Total Committed"    value={fmtM(totalXAF)}          color="#16a34a"  icon={<FiBarChart2 />} />
        <KPI label="Over-Refuel Alerts" value={overRefuel.length}       color={overRefuel.length > 0 ? '#dc2626' : '#374151'} icon={<FiAlertTriangle />} />
        <KPI label="Critical Urgency"   value={critical.length}         color={critical.length > 0 ? '#f59e0b' : '#374151'} icon={<FiZap />} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
        {([
          { key: 'approvals',  label: `Approvals`,       badge: pending.length, icon: <FiCheckCircle size={14}/> },
          { key: 'operations', label: 'Live Operations', badge: 0,              icon: <FiActivity size={14}/> },
          { key: 'spend',      label: 'Spend Control',   badge: overRefuel.length, icon: <FiBarChart2 size={14}/> },
          { key: 'team',       label: 'Team Oversight',  badge: 0,              icon: <FiUsers size={14}/> },
          { key: 'report',     label: 'Executive Report',badge: 0,              icon: <FiFileText size={14}/> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'none', marginBottom: -2, borderBottom: tab === t.key ? '3px solid #222222' : '3px solid transparent', color: tab === t.key ? '#222222' : '#6b7280' }}>
            {t.icon} {t.label}
            {t.badge > 0 && <span style={{ background: '#222222', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner size="lg" /></div> : (
        <>
          {/* ══ APPROVALS ══ */}
          {tab === 'approvals' && (
            pending.length === 0
              ? <EmptyState icon={<FiShield size={56} color="#d1d5db" />} title="No pending approvals" description="You'll be notified by email when a request reaches L5" />
              : pending.map(r => <ApprovalCard key={r._id} r={r} />)
          )}

          {/* ══ LIVE OPERATIONS ══ */}
          {tab === 'operations' && (
            <div>
              {/* Cluster map */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {Object.entries(clusterMap).sort((a,b) => b[1].xaf - a[1].xaf).map(([cluster, data]) => (
                  <div key={cluster} style={{ ...card, borderTop: '3px solid #222222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>{cluster}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{data.count} requests</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, color: '#222222', margin: 0 }}>{data.liters.toLocaleString()} L</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{fmtM(data.xaf)} XAF</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#059669' }}>✓ {data.refueled} refueled</span>
                      <span style={{ color: '#f59e0b' }}>⏳ {data.count - data.refueled} pending</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Recent requests */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>Recent Requests — {cycle}</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Site','Cluster','Litres','XAF','Status','Urgency','Date'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {all.slice(0, 30).map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.site_name}</td>
                          <td style={{ padding: '8px 10px', color: '#6b7280' }}>{r.cluster}</td>
                          <td style={{ padding: '8px 10px' }}>{(r.liters_approved||r.liters_requested).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', color: '#6b7280' }}>{fmtM((r.liters_approved||r.liters_requested)*XAF)}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: r.status === 'refueled' ? '#dcfce7' : r.status === 'denied' ? '#fee2e2' : '#eeeeee', color: r.status === 'refueled' ? '#166534' : r.status === 'denied' ? '#991b1b' : '#222222', borderRadius: 4, padding: '2px 6px' }}>
                              {r.status.replace(/_/g,' ')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: r.urgency === 'critical' ? '#fee2e2' : '#fef3c7', color: r.urgency === 'critical' ? '#991b1b' : '#92400e', borderRadius: 4, padding: '2px 6px' }}>
                              {r.urgency.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ SPEND CONTROL ══ */}
          {tab === 'spend' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Over-refuel alerts */}
              <div style={{ ...card, borderTop: '3px solid #dc2626' }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px', color: '#dc2626' }}>
                  ⚠️ Over-Refuel Alerts ({overRefuel.length})
                </p>
                {overRefuel.length === 0
                  ? <p style={{ fontSize: 13, color: '#9ca3af' }}>No sites refueled more than 3× this cycle</p>
                  : overRefuel.map(r => (
                      <div key={r._id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{r.site_name}</span>
                        <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 8 }}>{r.cycle_refuel_count}× refueled</span>
                        <span style={{ color: '#9ca3af', marginLeft: 8 }}>{r.cluster}</span>
                      </div>
                    ))
                }
              </div>
              {/* Budget alerts */}
              <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px', color: '#f59e0b' }}>
                  💰 Budget Near-Exhaustion ({budget.filter((b: any) => b.liters_remaining < 50).length})
                </p>
                {budget.filter((b: any) => b.liters_remaining < 50).slice(0, 10).map((b: any) => (
                  <div key={b.site_id} style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{b.site_name || b.site_id}</span>
                      <span style={{ color: b.liters_remaining <= 0 ? '#dc2626' : '#f59e0b', fontWeight: 700 }}>
                        {b.liters_remaining <= 0 ? 'EXHAUSTED' : `${b.liters_remaining.toFixed(0)} L left`}
                      </span>
                    </div>
                    <span style={{ color: '#9ca3af' }}>{b.cluster}</span>
                  </div>
                ))}
              </div>
              {/* Urgency breakdown */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>🚦 Requests by Urgency</p>
                {['critical','high','medium','low'].map(u => {
                  const count = all.filter(r => r.urgency === u).length;
                  const pct   = all.length > 0 ? Math.round((count/all.length)*100) : 0;
                  const color = u === 'critical' ? '#dc2626' : u === 'high' ? '#f59e0b' : u === 'medium' ? '#2563eb' : '#6b7280';
                  return (
                    <div key={u} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{u}</span>
                        <span style={{ color: '#6b7280' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Denial analysis */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>❌ Denied Requests ({denied.length})</p>
                {denied.length === 0
                  ? <p style={{ fontSize: 13, color: '#9ca3af' }}>No denials this cycle</p>
                  : denied.slice(0, 8).map(r => (
                      <div key={r._id} style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{r.site_name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>· {r.liters_requested} L</span></div>
                        <div style={{ color: '#9ca3af' }}>{r.cluster} · {fmtDate(r.createdAt)}</div>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ══ TEAM OVERSIGHT ══ */}
          {tab === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Approver activity */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>👥 Approver Activity — {cycle}</p>
                {Object.entries(approverStats).length === 0
                  ? <p style={{ fontSize: 13, color: '#9ca3af' }}>No approval activity yet</p>
                  : Object.entries(approverStats).map(([name, stats]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12, alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0 }}>{name}</p>
                        </div>
                        <span style={{ background: '#eeeeee', color: '#222222', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {stats.count} approved
                        </span>
                      </div>
                    ))
                }
              </div>
              {/* Chain completion rate */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>📈 Chain Completion Rate</p>
                {[
                  { label: 'Fully Approved',  count: all.filter(r => ['approved','scheduled','purchase_made','refueled','completed'].includes(r.status)).length, color: '#16a34a' },
                  { label: 'In Progress',     count: all.filter(r => r.status.startsWith('pending_')).length, color: '#f59e0b' },
                  { label: 'Denied',          count: denied.length, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                      <span style={{ fontSize: 13 }}>{s.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: s.color, fontSize: 18 }}>{s.count}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
                        ({all.length > 0 ? Math.round((s.count/all.length)*100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ EXECUTIVE REPORT ══ */}
          {tab === 'report' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Summary card */}
              <div style={{ ...card, gridColumn: '1 / -1', borderTop: '4px solid #222222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Fuel Operations Summary</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{cycle} · Prepared by {user?.fullName}</p>
                  </div>
                  <button onClick={handleExportReport} style={{ background: '#222222', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiDownload size={14} /> Export to Excel
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {[
                    { label: 'Total Requests',       value: all.length,                    color: '#222222' },
                    { label: 'Total Litres Approved',value: `${totalL.toLocaleString()} L`, color: '#16a34a' },
                    { label: 'Total Committed',      value: fmtM(totalXAF) + ' XAF',       color: '#2563eb' },
                    { label: 'Actually Refueled',    value: `${refueled.reduce((s,r) => s+(r.liters_actually_added||0),0).toLocaleString()} L`, color: '#059669' },
                    { label: 'Denied Requests',      value: denied.length,                  color: '#dc2626' },
                    { label: 'Over-Refuel Alerts',   value: overRefuel.length,              color: '#f59e0b' },
                    { label: 'Critical Urgency',     value: critical.length,                color: '#f97316' },
                    { label: 'Active Clusters',      value: Object.keys(clusterMap).length, color: '#7c3aed' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${s.color}` }}>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Cluster summary */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>Cluster Breakdown</p>
                {Object.entries(clusterMap).sort((a,b) => b[1].xaf - a[1].xaf).map(([cluster, data]) => (
                  <div key={cluster} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{cluster}</span>
                      <span style={{ color: '#6b7280' }}>{data.liters.toLocaleString()} L · {fmtM(data.xaf)} XAF</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: 10 }}>
                      <span>{data.count} requests</span>
                      <span>{data.refueled} completed</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Key risks */}
              <div style={card}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>🎯 Key Risks & Flags</p>
                {[
                  overRefuel.length > 0 && { label: `${overRefuel.length} sites over-refueled (>3×)`, color: '#dc2626', icon: '⚠️' },
                  budget.filter((b: any) => b.liters_remaining < 50).length > 0 && { label: `${budget.filter((b: any) => b.liters_remaining < 50).length} sites near budget exhaustion`, color: '#f59e0b', icon: '💰' },
                  critical.length > 0 && { label: `${critical.length} critical urgency requests`, color: '#f97316', icon: '🚨' },
                  denied.length > 0 && { label: `${denied.length} requests denied this cycle`, color: '#6b7280', icon: 'ℹ️' },
                  all.length === 0 && { label: 'No requests submitted this cycle', color: '#9ca3af', icon: '📋' },
                ].filter(Boolean).map((r: any, i: number) => (
                  <div key={i} style={{ padding: '8px 10px', background: `${r.color}10`, border: `1px solid ${r.color}30`, borderRadius: 8, marginBottom: 8, fontSize: 12, color: r.color, fontWeight: 600 }}>
                    {r.icon} {r.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ APPROVE MODAL ══ */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="HOB Approval" size="sm">
        {approveTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f5f5f5', border: '1px solid #cccccc', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{approveTarget.site_name}</p>
              <p style={{ fontSize: 12, color: '#4338ca', margin: 0 }}>
                {approveTarget.liters_approved || approveTarget.liters_requested} L
                · {fmtXAF((approveTarget.liters_approved||approveTarget.liters_requested)*XAF)}
                {approveTarget.liters_requested >= 100 && ' · Will proceed to CEO'}
              </p>
            </div>
            <div>
              <label style={fieldLabel}>HOB Comments (forwarded to CEO if applicable)</label>
              <textarea value={approveComment} onChange={e => setApproveComment(e.target.value)} rows={3}
                placeholder="Operational justification for CEO..." style={{ ...inputSt, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setApproveTarget(null)} variant="secondary">Cancel</Button>
              <Button onClick={handleApprove} variant="success" loading={approving}>
                <FiCheckCircle style={{ marginRight: 4 }} />
                {approveTarget.liters_requested >= 100 ? 'Approve → CEO' : 'Approve & Complete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ REJECT MODAL ══ */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Request" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={fieldLabel}>Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
              placeholder="Business reason for rejection..." style={{ ...inputSt, resize: 'vertical' }} />
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

// Missing import
const FiFileText = (props: any) => <FiBarChart2 {...props} />;


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

export default HOBDashboard;
