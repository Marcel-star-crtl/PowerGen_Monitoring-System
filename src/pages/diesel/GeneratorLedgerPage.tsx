/**
 * GeneratorLedgerPage.tsx
 * View all generator assignments, log swaps, see per-site history timeline.
 */
import React, { useState } from 'react';
import { generatorLedgerApi } from '../../api/dieselApi';
import { useGeneratorLedger, useSiteGenHistory } from '../../hooks/useDiesel';
import {
  PageHeader, fmtDate, fmtNum, Spinner, ErrorBox, EmptyState, Btn, StatusPill, Card, SectionLabel, Timeline,
} from '../../components/diesel/DieselComponents';
import type { TimelineEvent } from '../../components/diesel/DieselComponents';
import { neutral, font } from '../../styles/dieselTokens';

export default function GeneratorLedgerPage() {
  const [siteFilter, setSiteFilter] = useState('');
  const [showActive, setShowActive] = useState(true);
  const { data, loading, error, refetch } = useGeneratorLedger({ is_active: showActive ? 'true' : undefined, site_id: siteFilter || undefined });
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const { data: history, loading: histLoading } = useSiteGenHistory(selectedSite || '');
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [form, setForm] = useState({
    site_id: '', site_name: '', cluster: '', old_generator_id: '',
    new_generator_id: '', new_generator_brand: '', new_dg_kva: '', swap_reason: '',
  });
  const [saving, setSaving] = useState(false);

  const entries = (data as any)?.data || data || [];

  async function handleSwap() {
    setSaving(true);
    try {
      await generatorLedgerApi.swap({ ...form, new_dg_kva: parseFloat(form.new_dg_kva) || null, swap_date: new Date().toISOString() });
      setShowSwapForm(false);
      setForm({ site_id: '', site_name: '', cluster: '', old_generator_id: '', new_generator_id: '', new_generator_brand: '', new_dg_kva: '', swap_reason: '' });
      refetch();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🔁 Generator Assignment Ledger"
        subtitle="Immutable history of every generator move. No data is ever lost on a swap."
        actions={<Btn onClick={() => setShowSwapForm(v => !v)}>{showSwapForm ? 'Cancel' : '+ Log Generator Swap'}</Btn>}
      />

      {showSwapForm && (
        <Card style={{ marginBottom: 24 }}>
          <SectionLabel>Log a Generator Swap</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <input aria-label="Site ID" placeholder="Site ID *" value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} style={inputStyle} />
            <input aria-label="Site Name" placeholder="Site Name" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} style={inputStyle} />
            <input aria-label="Cluster" placeholder="Cluster" value={form.cluster} onChange={e => setForm({ ...form, cluster: e.target.value })} style={inputStyle} />
            <input aria-label="Old Generator ID" placeholder="Old Generator ID" value={form.old_generator_id} onChange={e => setForm({ ...form, old_generator_id: e.target.value })} style={inputStyle} />
            <input aria-label="New Generator ID" placeholder="New Generator ID *" value={form.new_generator_id} onChange={e => setForm({ ...form, new_generator_id: e.target.value })} style={inputStyle} />
            <input aria-label="New Generator Brand" placeholder="New Generator Brand" value={form.new_generator_brand} onChange={e => setForm({ ...form, new_generator_brand: e.target.value })} style={inputStyle} />
            <input aria-label="New Generator KVA" placeholder="New KVA" type="number" value={form.new_dg_kva} onChange={e => setForm({ ...form, new_dg_kva: e.target.value })} style={inputStyle} />
            <input aria-label="Swap Reason" placeholder="Swap Reason" value={form.swap_reason} onChange={e => setForm({ ...form, swap_reason: e.target.value })} style={{ ...inputStyle, gridColumn: 'span 2' }} />
          </div>
          <p style={{ fontSize: 11, color: neutral[400], margin: '10px 0' }}>This will close the current assignment, open a new one, and trigger re-reconciliation for the affected cycle automatically.</p>
          <Btn onClick={handleSwap} disabled={saving || !form.site_id || !form.new_generator_id}>{saving ? 'Saving…' : 'Confirm Swap'}</Btn>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input aria-label="Filter by site ID" placeholder="Filter by Site ID…" value={siteFilter} onChange={e => setSiteFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: neutral[700] }}>
          <input type="checkbox" checked={showActive} onChange={e => setShowActive(e.target.checked)} /> Active assignments only
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSite ? '1fr 380px' : '1fr', gap: 24 }}>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {error && <div style={{ padding: 16 }}><ErrorBox message={error} onRetry={refetch} /></div>}
          {loading ? <div style={{ padding: 20 }}><Spinner /></div> : entries.length === 0 ? (
            <div style={{ padding: 20 }}><EmptyState icon="🔌" title="No generator assignments found" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: neutral[50] }}>
                  {['Site', 'Generator', 'Brand', 'KVA', 'CCPH', 'Assigned', 'Removed', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: neutral[500], borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e._id} onClick={() => setSelectedSite(e.site_id)}
                    style={{ cursor: 'pointer', borderBottom: `1px solid ${neutral[100]}` }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = neutral[50])}
                    onMouseLeave={ev => (ev.currentTarget.style.background = '')}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.site_id}<br /><span style={{ color: neutral[400], fontWeight: 400, fontSize: 11 }}>{e.site_name}</span></td>
                    <td style={{ padding: '9px 12px' }}>{e.generator_id}</td>
                    <td style={{ padding: '9px 12px' }}>{e.generator_brand || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>{e.dg_kva || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>{fmtNum(e.ccph, 3)}</td>
                    <td style={{ padding: '9px 12px' }}>{fmtDate(e.assigned_at)}</td>
                    <td style={{ padding: '9px 12px' }}>{e.removed_at ? fmtDate(e.removed_at) : '—'}</td>
                    <td style={{ padding: '9px 12px' }}><StatusPill status={e.is_active ? 'open' : 'resolved'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {selectedSite && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionLabel style={{ marginBottom: 0 }}>History — {selectedSite}</SectionLabel>
              <button onClick={() => setSelectedSite(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: neutral[400] }}>✕</button>
            </div>
            {histLoading ? <Spinner size={24} /> : (
              <Timeline events={((history as any)?.data || history || []).map((h: any): TimelineEvent => ({
                title: `${h.generator_id}${h.generator_brand ? ` (${h.generator_brand})` : ''}`,
                sub: [
                  `${fmtDate(h.assigned_at)} → ${h.removed_at ? fmtDate(h.removed_at) : 'present'}`,
                  h.assigned_reason,
                  h.removed_reason ? `Removed: ${h.removed_reason}` : null,
                ].filter(Boolean).join(' · '),
                tone: h.is_active ? 'ok' : 'neutral',
              }))} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, boxSizing: 'border-box' };
