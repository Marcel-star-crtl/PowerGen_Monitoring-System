import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuel } from '@/hooks/useFuel';
import { useNotification } from '@/contexts/NotificationContext';
import {
  PageHeader, Card, KpiCard, Tag, Spinner, EmptyState, Btn,
} from '@/components/diesel/DieselComponents';
import { neutral, ink, urgency as urgencyTokens, font } from '@/styles/dieselTokens';
import { formatDate, formatNumber } from '@/utils/formatters';

type SortKey = 'urgency' | 'fuel_pct' | 'site_name';
const URGENCY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const URGENCY_TAG: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

const LowFuelAlertsPage: React.FC = () => {
  const nav = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState('25');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const { getLowFuelAlerts } = useFuel();
  const { error: showError } = useNotification();

  useEffect(() => {
    loadAlerts();
  }, [threshold]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await getLowFuelAlerts(parseInt(threshold));
      setAlerts(result.data);
    } catch (err) {
      showError('Failed to load fuel alerts');
    } finally {
      setLoading(false);
    }
  };

  // Group by urgency — purely for the summary KPI strip now; the table
  // itself is one sortable/filterable list (matching the redesign), not
  // one card grid per tier.
  const groupedAlerts = {
    critical: alerts.filter((a) => a.urgency === 'critical'),
    high: alerts.filter((a) => a.urgency === 'high'),
    medium: alerts.filter((a) => a.urgency === 'medium'),
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? alerts.filter((a) =>
          a.site_name?.toLowerCase().includes(q) ||
          a.site_id?.toLowerCase().includes(q) ||
          a.cluster?.toLowerCase().includes(q))
      : alerts;
    const sorted = [...filtered];
    if (sortKey === 'urgency') sorted.sort((a, b) => (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9) || a.fuel_percentage - b.fuel_percentage);
    else if (sortKey === 'fuel_pct') sorted.sort((a, b) => a.fuel_percentage - b.fuel_percentage);
    else sorted.sort((a, b) => (a.site_name || '').localeCompare(b.site_name || ''));
    return sorted;
  }, [alerts, search, sortKey]);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🪫 Low Fuel Alerts"
        subtitle={`${alerts.length} site(s) under the ${threshold}% threshold, ranked by urgency.`}
        actions={
          <>
            <span style={{ fontSize: 13, color: neutral[500] }}>Threshold:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              aria-label="Fuel level threshold"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
            >
              <option value="10">&lt;10%</option>
              <option value="25">&lt;25%</option>
              <option value="50">&lt;50%</option>
            </select>
          </>
        }
      />

      {/* ── Summary strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Critical" value={groupedAlerts.critical.length} tone={groupedAlerts.critical.length > 0 ? 'crit' : undefined} />
        <KpiCard label="High" value={groupedAlerts.high.length} tone={groupedAlerts.high.length > 0 ? 'warn' : undefined} />
        <KpiCard label="Medium" value={groupedAlerts.medium.length} />
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon="💧" title="No low fuel alerts" desc="All sites have sufficient fuel levels at this threshold." />
      ) : (
        <>
          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search site…"
              aria-label="Search site"
              style={{ flex: '1 1 220px', minWidth: 160, border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, boxSizing: 'border-box' }}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort order"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
            >
              <option value="urgency">Sort: urgency (high → low)</option>
              <option value="fuel_pct">Sort: fuel % (low → high)</option>
              <option value="site_name">Sort: site name</option>
            </select>
          </div>

          <Card padded={false} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: neutral[50] }}>
                    {['Site', 'Cluster', 'Technician', 'Urgency', 'Current Level', 'Last Reading', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: neutral[500], fontSize: 11, borderBottom: `1px solid ${neutral[200]}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((alert) => (
                    <tr key={alert.site_id}
                      style={{ borderBottom: `1px solid ${neutral[100]}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = neutral[50])}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: ink }}>{alert.site_name || alert.site_id}</p>
                        <p style={{ margin: 0, color: neutral[400], fontSize: 11 }}>{alert.site_id}{alert.region ? ` · ${alert.region}` : ''}</p>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{alert.cluster || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>{alert.technician || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Tag variant={URGENCY_TAG[alert.urgency] || 'neutral'} dot>{(alert.urgency || 'unknown').toUpperCase()}</Tag>
                      </td>
                      <td style={{ padding: '10px 14px', minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(alert.fuel_level)} / {formatNumber(alert.tank_capacity)} L</span>
                          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{alert.fuel_percentage}%</strong>
                        </div>
                        <div style={{ background: neutral[200], borderRadius: 3, height: 5, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(alert.fuel_percentage, 100)}%`, height: 5, borderRadius: 3,
                            background: alert.urgency === 'critical' ? urgencyTokens.critical.fg : alert.urgency === 'high' ? urgencyTokens.high.fg : urgencyTokens.medium.fg,
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: neutral[500], whiteSpace: 'nowrap' }}>{formatDate(alert.last_updated)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Btn size="sm" variant="secondary" onClick={() => nav('/diesel/fuel-requests')}>Fuel Requests →</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default LowFuelAlertsPage;