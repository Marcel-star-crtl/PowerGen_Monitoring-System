/**
 * NotificationBell.tsx
 * Bell icon with unread count badge + dropdown panel.
 * Drop this into your existing Layout/Header component:
 *   import { NotificationBell } from '@/components/diesel/NotificationBell';
 *   ... <NotificationBell />
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount, useAlerts } from '../../hooks/useDiesel';
import { alertsApi } from '../../api/dieselApi';
import { AlertCard, Spinner, EmptyState, Btn } from './DieselComponents';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { count, refresh } = useUnreadCount();
  const { data, loading, refetch } = useAlerts({ status: 'open', limit: 10 });
  const alerts = (data as any)?.data || data || [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleOpen() {
    setOpen(v => !v);
    if (!open) refetch();
  }

  async function handleAck(id: string)     { await alertsApi.acknowledge(id); refetch(); refresh(); }
  async function handleResolve(id: string) { await alertsApi.resolve(id, 'Resolved from notification bell'); refetch(); refresh(); }
  async function handleReadAll()            { await alertsApi.readAll(); refresh(); refetch(); }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{
        position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 20, padding: 6, borderRadius: 8,
      }}>
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, background: '#dc2626', color: '#fff',
            fontSize: 10, fontWeight: 700, borderRadius: '50%', minWidth: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 36, width: 380, maxHeight: 500, overflowY: 'auto',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 300, padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Notifications</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReadAll} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer' }}>Mark all read</button>
              <button onClick={() => { setOpen(false); nav('/diesel/alerts'); }} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View All →</button>
            </div>
          </div>

          {loading ? <Spinner size={24} /> : alerts.length === 0 ? (
            <EmptyState icon="✅" title="All clear" desc="No open alerts" />
          ) : (
            alerts.map((a: any) => <AlertCard key={a._id} alert={a} compact onAcknowledge={handleAck} onResolve={handleResolve} />)
          )}
        </div>
      )}
    </div>
  );
}
