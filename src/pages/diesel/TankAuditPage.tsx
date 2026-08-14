/**
 * TankAuditPage.tsx
 *
 * Dashboard view for tank audits captured on the mobile app — see
 * SITE TANK AUDIT PLAN. Read-only: the mobile app is the only place
 * audits are created or edited, including fully offline; this page
 * just surfaces what's already landed on the server.
 */
import React, { useEffect, useState } from 'react';
import { tankAuditApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn, KpiCard } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency } from '../../styles/dieselTokens';

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: urgency.critical.fg,
  major: urgency.high.fg,
  minor: '#CA8A04',
};

const CHECK_AREAS: { key: string; label: string }[] = [
  { key: 'check_tank_capacity_verification', label: 'Tank Capacity Verification' },
  { key: 'check_fuel_level', label: 'Fuel Level (Dip vs. CMS vs. Theoretical)' },
  { key: 'check_structural_condition', label: 'Structural Condition' },
  { key: 'check_leakage', label: 'Leakage Checks' },
  { key: 'check_caps_locking_security', label: 'Caps, Locking and Security' },
  { key: 'check_pipe_passage_earthing', label: 'Pipe Passage / Earthing' },
  { key: 'check_sensor_hardware', label: 'Sensor Hardware' },
  { key: 'check_gen_cards_faulty', label: 'Gen Cards Faulty (replace with mechanical counter meter)' },
];

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span style={{ color: neutral[400] }}>—</span>;
  const colors: Record<string, { bg: string; fg: string }> = {
    ok: { bg: '#DCFCE7', fg: '#15803D' },
    issue: { bg: '#FEE2E2', fg: '#B91C1C' },
    na: { bg: neutral[100], fg: neutral[500] },
  };
  const c = colors[status] || colors.na;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
      {status === 'na' ? 'N/A' : status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return <span style={{ color: neutral[400], fontSize: 12 }}>No issues flagged</span>;
  return (
    <span style={{ color: SEVERITY_COLOR[severity] || neutral[500], fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
      {severity}
    </span>
  );
}

export default function TankAuditPage() {
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  const [severityFilter, setSeverityFilter] = useState('');
  const [logsFilter, setLogsFilter] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  // Blank = show both drafts and submitted audits — drafts need to be
  // immediately visible to a diesel admin per the user's explicit
  // request, not hidden until an audit is fully completed.
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  useEffect(() => {
    tankAuditApi.summary()
      .then((res: any) => setSummary((res as any)?.data || res))
      .catch((err: any) => setError(err?.response?.data?.error || 'Failed to load tank audit summary'))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setAuditsLoading(true);
    tankAuditApi.list({
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      logsCollected: logsFilter || undefined,
      siteId: siteQuery.trim() || undefined,
      page,
      limit: 20,
    })
      .then((res: any) => {
        setAudits((res as any)?.data || []);
        setPagination((res as any)?.pagination || null);
      })
      .catch(() => { setAudits([]); setPagination(null); })
      .finally(() => setAuditsLoading(false));
  }, [statusFilter, severityFilter, logsFilter, siteQuery, page]);

  async function openAudit(id: string) {
    setSelectedLoading(true);
    try {
      const res: any = await tankAuditApi.get(id);
      setSelectedAudit(res?.data || res);
    } catch {
      setSelectedAudit(null);
    } finally {
      setSelectedLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="🛢️ Tank Audits"
        subtitle="Site tank audits captured on the mobile app — tank capacity, fuel-level cross-checks, structural and leakage findings, and whether generator logs were collected on each visit."
      />

      {error && <ErrorBox message={error} />}

      {/* ── Summary KPIs ── */}
      {summaryLoading ? <Spinner /> : summary && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="Total Audits" value={summary.total_audits ?? 0} icon="📋" />
            <KpiCard label="Drafts In Progress" value={summary.draft_count ?? 0} icon="✏️" color="#D97706" />
            <KpiCard label="Critical Findings" value={summary.by_severity?.critical ?? 0} icon="🚨" color={urgency.critical.fg} />
            <KpiCard label="Major Findings" value={summary.by_severity?.major ?? 0} icon="⚠️" color={urgency.high.fg} />
            <KpiCard label="Minor Findings" value={summary.by_severity?.minor ?? 0} icon="🔎" color="#CA8A04" />
            <KpiCard label="No Issues Flagged" value={summary.by_severity?.none ?? 0} icon="✅" color={urgency.ok.fg} />
          </div>

          {/* ── Logs collected ── */}
          <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📄 Generator Logs Collected</div>
            <div style={{ fontSize: 11, color: neutral[500], marginBottom: 10 }}>
              Whether generator run-hour/consumption logs were collected during each audit visit — supports the plan's run-hour vs. fuel consumption correlation objective.
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Collected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: urgency.ok.fg }}>{summary.logs_collected?.collected ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Not Collected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: urgency.critical.fg }}>{summary.logs_collected?.notCollected ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Unspecified</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: neutral[400] }}>{summary.logs_collected?.unspecified ?? 0}</div>
              </div>
            </div>
          </div>

          {/* ── Recently flagged sites ── */}
          {summary.recent_flagged_sites?.length > 0 && (
            <div style={{ border: `1px solid ${urgency.critical.fg}33`, background: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🚨 Recently Flagged Sites (Critical / Major)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.recent_flagged_sites.map((s: any) => (
                  <div key={s._id} onClick={() => openAudit(s._id)} style={{ cursor: 'pointer', background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{s.site_name || s.site_id_ihs}</div>
                    <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id_ihs}</div>
                    <SeverityBadge severity={s.overall_severity} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Full audit list ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>All Audits — Including Drafts In Progress</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={siteQuery} onChange={e => { setSiteQuery(e.target.value); setPage(1); }} placeholder="Site ID…"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 140 }}
            />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">All (Drafts + Submitted)</option>
              <option value="submitted">Submitted Only</option>
              <option value="draft">Drafts Only</option>
            </select>
            <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
            <select value={logsFilter} onChange={e => { setLogsFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">Logs — Any</option>
              <option value="true">Logs Collected</option>
              <option value="false">Logs Not Collected</option>
            </select>
          </div>
        </div>

        {auditsLoading ? <Spinner /> : !audits.length ? (
          <EmptyState icon="🛢️" title="No tank audits yet" desc="Audits submitted from the mobile app — including offline, synced automatically when back online — will show up here." />
        ) : (
          <>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Site', 'Status', 'Audit Date', 'Auditor', 'Fuel Variance', 'Logs Collected', 'Severity', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a: any) => (
                    <tr key={a._id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '6px 9px' }}>
                        <div style={{ fontWeight: 600 }}>{a.site_name || a.site_id_ihs}</div>
                        <div style={{ color: neutral[400], fontSize: 10 }}>{a.site_id_ihs}</div>
                      </td>
                      <td style={{ padding: '6px 9px' }}>
                        {a.status === 'draft'
                          ? <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>DRAFT</span>
                          : <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>SUBMITTED</span>}
                      </td>
                      <td style={{ padding: '6px 9px' }}>{a.audit_date ? new Date(a.audit_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '6px 9px' }}>{a.auditor_name || '—'}</td>
                      <td style={{ padding: '6px 9px', color: a.variance_pct != null && Math.abs(a.variance_pct) > 5 ? urgency.high.fg : ink }}>
                        {a.variance_pct != null ? `${a.variance_pct > 0 ? '+' : ''}${a.variance_pct}%` : '—'}
                      </td>
                      <td style={{ padding: '6px 9px' }}>
                        {a.logs_collected === true ? <span style={{ color: urgency.ok.fg, fontWeight: 700 }}>Yes</span>
                          : a.logs_collected === false ? <span style={{ color: urgency.critical.fg, fontWeight: 700 }}>No</span>
                          : <span style={{ color: neutral[400] }}>—</span>}
                      </td>
                      <td style={{ padding: '6px 9px' }}><SeverityBadge severity={a.overall_severity} /></td>
                      <td style={{ padding: '6px 9px' }}>
                        <button onClick={() => openAudit(a._id)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <Btn variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Btn>
                <span style={{ fontSize: 12, color: neutral[500], alignSelf: 'center' }}>Page {pagination.current} of {pagination.pages}</span>
                <Btn variant="secondary" size="sm" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}>Next</Btn>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Audit detail modal ── */}
      {(selectedLoading || selectedAudit) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelectedAudit(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700, width: '90%', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {selectedLoading ? <Spinner /> : selectedAudit && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedAudit.site_name || selectedAudit.site_id_ihs}</div>
                    <div style={{ fontSize: 12, color: neutral[400] }}>{selectedAudit.site_id_ihs} · {selectedAudit.audit_date ? new Date(selectedAudit.audit_date).toLocaleDateString() : '—'} · {selectedAudit.auditor_name || 'Unknown auditor'}</div>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => setSelectedAudit(null)}>Close</Btn>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Dip Reading</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.dip_reading_l)} L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>CMS Reading</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.cms_reading_l)} L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Theoretical Stock</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.theoretical_stock_l)} L</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  Logs collected: {selectedAudit.logs_collected === true ? <strong style={{ color: urgency.ok.fg }}>Yes</strong>
                    : selectedAudit.logs_collected === false ? <strong style={{ color: urgency.critical.fg }}>No</strong>
                    : <span style={{ color: neutral[400] }}>Not specified</span>}
                </div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>
                  Gen Card faulty: {selectedAudit.gen_card_faulty === true ? <strong style={{ color: urgency.critical.fg }}>Yes</strong>
                    : selectedAudit.gen_card_faulty === false ? <strong style={{ color: urgency.ok.fg }}>No</strong>
                    : <span style={{ color: neutral[400] }}>Not specified</span>}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Physical Checks</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      {['Area', 'Status', 'Severity', 'Notes', 'Photos'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHECK_AREAS.map(area => {
                      const item = selectedAudit[area.key] || {};
                      return (
                        <tr key={area.key} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                          <td style={{ padding: '5px 8px' }}>{area.label}</td>
                          <td style={{ padding: '5px 8px' }}><StatusBadge status={item.status} /></td>
                          <td style={{ padding: '5px 8px' }}>{item.status === 'issue' ? <SeverityBadge severity={item.severity} /> : '—'}</td>
                          <td style={{ padding: '5px 8px', color: neutral[600] }}>{item.notes || '—'}</td>
                          <td style={{ padding: '5px 8px' }}>
                            {item.photos?.length > 0 ? (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {item.photos.map((p: any, i: number) => (
                                  <a key={i} href={p.uri} target="_blank" rel="noopener noreferrer">
                                    <img src={p.uri} alt={area.label} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: `1px solid ${neutral[200]}` }} />
                                  </a>
                                ))}
                              </div>
                            ) : <span style={{ color: neutral[400] }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {selectedAudit.general_photos?.length > 0 && (
                  <div style={{ fontSize: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>General Photos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedAudit.general_photos.map((p: any, i: number) => (
                        <a key={i} href={p.uri} target="_blank" rel="noopener noreferrer">
                          <img src={p.uri} alt="General" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${neutral[200]}` }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAudit.log_files?.length > 0 && (
                  <div style={{ fontSize: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Equipment Log Files</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedAudit.log_files.map((f: any, i: number) => (
                        <a key={i} href={f.uri} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>
                          {f.equipment === 'power_cabinet' ? '🔌 Power Cabinet' : f.equipment === 'generator' ? '⚙️ Generator' : '📄 Other'} — View
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAudit.general_notes && (
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>General Notes</div>
                    <div style={{ color: neutral[600] }}>{selectedAudit.general_notes}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
