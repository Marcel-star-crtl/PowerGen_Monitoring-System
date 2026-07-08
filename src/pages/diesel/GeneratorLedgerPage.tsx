/**
 * GeneratorLedgerPage.tsx
 * View all generator assignments, log swaps, see per-site history timeline.
 */
import React, { useState } from 'react';
import { generatorLedgerApi } from '../../api/dieselApi';
import { useGeneratorLedger, useSiteGenHistory } from '../../hooks/useDiesel';
import { PageHeader, fmtDate, fmtNum, Spinner, ErrorBox, EmptyState, Btn, StatusPill } from '../../components/diesel/DieselComponents';

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
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="🔁 Generator Assignment Ledger"
        subtitle="Immutable history of every generator move. No data is ever lost on a swap."
        actions={<Btn onClick={() => setShowSwapForm(v => !v)}>{showSwapForm ? 'Cancel' : '+ Log Generator Swap'}</Btn>}
      />

      {showSwapForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Log a Generator Swap</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <input placeholder="Site ID *" value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} style={inputStyle} />
            <input placeholder="Site Name" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} style={inputStyle} />
            <input placeholder="Cluster" value={form.cluster} onChange={e => setForm({ ...form, cluster: e.target.value })} style={inputStyle} />
            <input placeholder="Old Generator ID" value={form.old_generator_id} onChange={e => setForm({ ...form, old_generator_id: e.target.value })} style={inputStyle} />
            <input placeholder="New Generator ID *" value={form.new_generator_id} onChange={e => setForm({ ...form, new_generator_id: e.target.value })} style={inputStyle} />
            <input placeholder="New Generator Brand" value={form.new_generator_brand} onChange={e => setForm({ ...form, new_generator_brand: e.target.value })} style={inputStyle} />
            <input placeholder="New KVA" type="number" value={form.new_dg_kva} onChange={e => setForm({ ...form, new_dg_kva: e.target.value })} style={inputStyle} />
            <input placeholder="Swap Reason" value={form.swap_reason} onChange={e => setForm({ ...form, swap_reason: e.target.value })} style={{ ...inputStyle, gridColumn: 'span 2' }} />
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '10px 0' }}>This will close the current assignment, open a new one, and trigger re-reconciliation for the affected cycle automatically.</p>
          <Btn onClick={handleSwap} disabled={saving || !form.site_id || !form.new_generator_id}>{saving ? 'Saving…' : 'Confirm Swap'}</Btn>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input placeholder="Filter by Site ID…" value={siteFilter} onChange={e => setSiteFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
          <input type="checkbox" checked={showActive} onChange={e => setShowActive(e.target.checked)} /> Active assignments only
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSite ? '1fr 380px' : '1fr', gap: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {error && <div style={{ padding: 16 }}><ErrorBox message={error} onRetry={refetch} /></div>}
          {loading ? <Spinner /> : entries.length === 0 ? (
            <EmptyState icon="🔌" title="No generator assignments found" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Site', 'Generator', 'Brand', 'KVA', 'CCPH', 'Assigned', 'Removed', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e._id} onClick={() => setSelectedSite(e.site_id)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = '')}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.site_id}<br /><span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 11 }}>{e.site_name}</span></td>
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
        </div>

        {selectedSite && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>History — {selectedSite}</h3>
              <button onClick={() => setSelectedSite(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            {histLoading ? <Spinner size={24} /> : (
              <div style={{ position: 'relative' }}>
                {((history as any)?.data || history || []).map((h: any, i: number) => (
                  <div key={h._id} style={{ paddingLeft: 20, position: 'relative', paddingBottom: 18, borderLeft: i === ((history as any)?.length - 1) ? 'none' : '2px solid #e5e7eb', marginLeft: 4 }}>
                    <div style={{ position: 'absolute', left: -5, top: 2, width: 10, height: 10, borderRadius: '50%', background: h.is_active ? '#16a34a' : '#9ca3af' }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{h.generator_id} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({h.generator_brand})</span></p>
                    <p style={{ margin: '2px 0', fontSize: 11, color: '#6b7280' }}>{fmtDate(h.assigned_at)} → {h.removed_at ? fmtDate(h.removed_at) : 'present'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{h.assigned_reason}</p>
                    {h.removed_reason && <p style={{ margin: 0, fontSize: 11, color: '#dc2626' }}>Removed: {h.removed_reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 12px', fontSize: 13, boxSizing: 'border-box' };
