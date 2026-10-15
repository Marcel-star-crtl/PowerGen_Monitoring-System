/**
 * AIFleetInsightsPage.tsx
 *
 * Cross-cutting fleet intelligence — synthesizes real, already-computed
 * data from across the whole diesel system (alerts, reconciliation
 * completeness, budget planning variances, pending approvals, active
 * technicians) into one prioritized briefing, rather than requiring a
 * manager to check five separate pages to build the same picture
 * themselves. Works with or without a Gemini API key configured — the
 * underlying evidence is always shown; the AI narrative on top of it is
 * a bonus, not the whole value.
 */
import React, { useEffect, useState } from 'react';
import { useCycles } from '../../hooks/useDiesel';
import { aiInsightsApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, Btn, CycleSelector } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, font } from '../../styles/dieselTokens';

function renderNarrative(text: string) {
  // Gemini's response uses simple "## Heading" markdown — rendered here
  // directly rather than pulling in a full markdown library for three
  // section headers.
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <div key={i} style={{ fontSize: 14, fontWeight: 700, color: ink, marginTop: i === 0 ? 0 : 16, marginBottom: 6 }}>{line.replace('## ', '')}</div>;
    }
    if (!line.trim()) return null;
    return <div key={i} style={{ fontSize: 13, color: neutral[700], lineHeight: 1.6, marginBottom: 4 }}>{line}</div>;
  });
}

export default function AIFleetInsightsPage() {
  const { cycles, selectedKey, setSelectedKey } = useCycles();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBriefing(refresh = false) {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiInsightsApi.briefing(selectedKey, refresh);
      setBriefing((res as any)?.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load briefing');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (selectedKey) loadBriefing(); }, [selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const ev = briefing?.evidence;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🧠 Fleet Intelligence Briefing"
        subtitle="One prioritized picture of the whole fleet — alerts, budget variances, reconciliation gaps, and pending approvals — synthesized, not scattered across five pages."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />
            <Btn variant="secondary" size="sm" onClick={() => loadBriefing(true)} loading={loading}>↻ Refresh</Btn>
          </div>
        }
      />

      {error && <ErrorBox message={error} onRetry={() => loadBriefing()} />}

      {loading && !briefing && <Spinner />}

      {briefing && (
        <>
          {!briefing.ai_enabled && (
            <div style={{ background: neutral[50], border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: neutral[600] }}>
              Gemini isn't configured (set <code>GEMINI_API_KEY</code> in your backend's .env) — showing the raw evidence below without an AI-written narrative on top. Everything the narrative would summarize is still here.
            </div>
          )}

          {briefing.narrative && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 20, marginBottom: 20, background: '#fff' }}>
              {renderNarrative(briefing.narrative)}
              <div style={{ fontSize: 10, color: neutral[400], marginTop: 14 }}>
                Generated {new Date(briefing.generatedAt).toLocaleString()} {briefing.cached && '(cached — click Refresh for the latest)'}
              </div>
            </div>
          )}

          {ev && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Open Alerts', value: ev.alerts?.total_open ?? 0, color: urgency.high.fg },
                { label: 'Sites Missing Field Data', value: ev.reconciliation?.missing_field_data ?? 0, color: urgency.medium.fg },
                { label: 'Budget Plan Flags', value: ev.budget_planning?.total_flagged ?? 0, color: urgency.high.fg },
                { label: 'Technicians Active Now', value: ev.active_technicians_now ?? 0, color: urgency.ok.fg },
              ].map(box => (
                <div key={box.label} style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: neutral[400], textTransform: 'uppercase', marginBottom: 4 }}>{box.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: box.color }}>{box.value}</div>
                </div>
              ))}
            </div>
          )}

          {ev?.budget_planning?.top_flagged_sites?.length > 0 && (
            <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Sites With the Largest Formula-vs-Reality Gap</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Site', 'Variance', 'Confidence'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ev.budget_planning.top_flagged_sites.map((s: any) => (
                    <tr key={s.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '6px 8px' }}>{s.site_name || s.site_id}</td>
                      <td style={{ padding: '6px 8px', color: Math.abs(s.variance_pct) > 40 ? urgency.critical.fg : urgency.high.fg, fontWeight: 700 }}>
                        {s.variance_pct > 0 ? '+' : ''}{s.variance_pct}%
                      </td>
                      <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{s.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
