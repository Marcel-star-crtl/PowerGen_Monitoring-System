/**
 * AlertsPage.tsx
 * Full alert management: filter, search, acknowledge, resolve.
 */
import React, { useState, useMemo } from 'react';
import { useAlerts, useCycles } from '../../hooks/useDiesel';
import { alertsApi } from '../../api/dieselApi';
import { PageHeader, CycleSelector, AlertCard, SeverityBadge, Spinner, ErrorBox, EmptyState, Btn } from '../../components/diesel/DieselComponents';
import type { AlertSeverity, AlertType } from '../../types/diesel.types';

const TYPES: { key: AlertType | ''; label: string }[] = [
  { key: '', label: 'All Types' },
  { key: 'LOW_FUEL', label: 'Low Fuel' },
  { key: 'ZERO_GRID_24H', label: 'Zero Grid 24h+' },
  { key: 'CONSUMPTION_OVER_CCPH', label: 'Over CCPH' },
  { key: 'REFUEL_MISMATCH_CMS', label: 'Refuel vs CMS' },
  { key: 'REFUEL_MISMATCH_TOMCARD', label: 'Refuel vs Tom Card' },
  { key: 'MISSING_GRATO', label: 'Missing GRATO' },
  { key: 'MISSING_CMS', label: 'Missing CMS' },
  { key: 'FAULTY_METER', label: 'Faulty Meter' },
  { key: 'THEFT_SUSPECTED', label: 'Theft Suspected' },
  { key: 'RH_MISMATCH', label: 'RH Mismatch' },
];

export default function AlertsPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const [status,   setStatus]   = useState('open');
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');
  const [type,     setType]     = useState<AlertType | ''>('');
  const [search,   setSearch]   = useState('');

  const queryParams = useMemo(() => ({
    cycle_key: selectedKey || undefined,
    status,
    severity: severity || undefined,
    type: type || undefined,
    limit: 200,
  }), [selectedKey, status, severity, type]);

  const { data, loading, error, refetch } = useAlerts(queryParams);
  const alerts = ((data as any)?.data || data || []).filter((a: any) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.site_id?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAck(id: string)     { await alertsApi.acknowledge(id); refetch(); }
  async function handleResolve(id: string) { await alertsApi.resolve(id, 'Resolved from alerts page'); refetch(); }
  async function handleReadAll()            { await alertsApi.readAll(); refetch(); }

  if (cyclesLoading) return <Spinner />;

  const bySeverity: Record<string, number> = {};
  alerts.forEach((a: any) => { bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1; });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader
        title="🔔 Alerts"
        subtitle={`${alerts.length} alert(s) matching current filters`}
        actions={
          <>
            <CycleSelector cycles={[{ cycle_key: '', label: 'All Cycles', status: 'open' }, ...cycles]} value={selectedKey} onChange={setSelectedKey} />
            <Btn variant="secondary" size="sm" onClick={handleReadAll}>✓ Mark All Read</Btn>
          </>
        }
      />

      {/* ── Severity summary ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['critical', 'high', 'medium', 'low'] as AlertSeverity[]).map(s => bySeverity[s] ? (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SeverityBadge severity={s} /><span style={{ fontSize: 13, fontWeight: 600 }}>{bySeverity[s]}</span>
          </div>
        ) : null)}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by site or title…"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, flex: 1, minWidth: 200 }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="all">All Statuses</option>
        </select>
        <select value={severity} onChange={e => setSeverity(e.target.value as AlertSeverity)} style={selectStyle}>
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low', 'info'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value as AlertType)} style={selectStyle}>
          {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {error && <ErrorBox message={error} onRetry={refetch} />}
      {loading ? <Spinner /> : alerts.length === 0 ? (
        <EmptyState icon="✅" title="No alerts found" desc="Nothing matches the current filters" />
      ) : (
        alerts.map((a: any) => <AlertCard key={a._id} alert={a} onAcknowledge={handleAck} onResolve={handleResolve} />)
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 12px', fontSize: 13, background: '#fff' };
