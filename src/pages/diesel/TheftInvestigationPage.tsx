/**
 * TheftInvestigationPage.tsx
 *
 * Fourth of the four requested features. A theft_suspected flag on its
 * own is just a number — this page turns it into something actually
 * investigable: every reading, refuel, and purchase for the site during
 * the flagged cycle, merged into one chronological timeline, next to the
 * reconciliation figures that triggered the flag in the first place.
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { theftInvestigationApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn, Card, SectionLabel } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency as urgencyTokens, font } from '../../styles/dieselTokens';

const TIMELINE_ICONS: Record<string, string> = {
  tank_reading: '📡',
  field_visit: '🧑‍🔧',
  mobile_refuel: '⛽',
  tomcard_purchase: '💳',
  generator_swap: '🔧',
};
const TIMELINE_LABELS: Record<string, string> = {
  tank_reading: 'Tank Telemetry',
  field_visit: 'Field Visit',
  mobile_refuel: 'Mobile Refuel',
  tomcard_purchase: 'TomCard Purchase',
  generator_swap: 'Generator Change',
};

function StatRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${neutral[100]}` }}>
      <span style={{ fontSize: 13, color: neutral[500] }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? urgencyTokens.critical.fg : ink }}>{value}</span>
    </div>
  );
}

export default function TheftInvestigationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const site_id = params.get('site_id') || '';
  const cycle_key = params.get('cycle_key') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!site_id || !cycle_key) {
      setError('This page needs both a site and a cycle — arrive here via a theft-suspected alert\'s "Investigate" button.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    theftInvestigationApi.get(site_id, cycle_key)
      .then((res: any) => setData(res?.data || res))
      .catch((err: any) => setError(err?.response?.data?.error || 'Failed to load investigation data'))
      .finally(() => setLoading(false));
  }, [site_id, cycle_key]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🔍 Theft / Anomaly Investigation"
        subtitle="Every reading, refuel, and purchase for this site and cycle, in one timeline — the evidence behind the flag, not just the flag itself."
        actions={<Btn variant="secondary" size="sm" onClick={() => navigate('/diesel/alerts')}>← Back to Alerts</Btn>}
      />

      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}

      {!loading && data && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: ink }}>{data.site_name || data.site_id}</div>
            <div style={{ fontSize: 13, color: neutral[500] }}>
              {data.site_id} · {data.cluster || '—'} · {data.region || '—'} · Cycle {data.cycle_key}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
            {/* Reconciliation figures — the numbers that triggered the flag */}
            <Card>
              <SectionLabel style={{ marginBottom: 8, fontSize: 13, textTransform: 'none', letterSpacing: 0, color: ink, fontWeight: 700 }}>Reconciliation Figures</SectionLabel>
              <StatRow label="Theft (liters)" value={`${data.reconciliation.theft_liters} L`} highlight={data.reconciliation.theft_liters > 0} />
              <StatRow label="CMS Consumption" value={data.reconciliation.cms_consumption != null ? `${data.reconciliation.cms_consumption} L` : '—'} />
              <StatRow label="Contractual Consumption" value={data.reconciliation.contractual_consumption != null ? `${data.reconciliation.contractual_consumption} L` : '—'} />
              <StatRow label="Consumption Variance" value={data.reconciliation.cons_variance_pct != null ? `${data.reconciliation.cons_variance_pct}%` : '—'} highlight={Math.abs(data.reconciliation.cons_variance_pct || 0) > 15} />
              <StatRow label="Field Fuel Added" value={data.reconciliation.field_fuel_added != null ? `${data.reconciliation.field_fuel_added} L` : '—'} />
              <StatRow label="CMS Refuel Total" value={data.reconciliation.cms_refuel_total != null ? `${data.reconciliation.cms_refuel_total} L` : '—'} />
              <StatRow label="TomCard Purchased" value={data.reconciliation.tomcard_purchased != null ? `${data.reconciliation.tomcard_purchased} L` : '—'} />
              <StatRow label="Field vs. CMS Variance" value={data.reconciliation.refuel_field_vs_cms_var != null ? `${data.reconciliation.refuel_field_vs_cms_var} L` : '—'} highlight={Math.abs(data.reconciliation.refuel_field_vs_cms_var || 0) > 10} />
              <StatRow label="Field vs. Card Variance" value={data.reconciliation.refuel_field_vs_card_var != null ? `${data.reconciliation.refuel_field_vs_card_var} L` : '—'} highlight={Math.abs(data.reconciliation.refuel_field_vs_card_var || 0) > 10} />
              <StatRow label="CPH Gap Variation" value={data.reconciliation.gap_cph_variation != null ? `${data.reconciliation.gap_cph_variation}%` : '—'} />

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${neutral[100]}`, fontSize: 12, color: neutral[500] }}>
                Sources in this cycle: {data.counts.tank_readings} tank reading(s) · {data.counts.field_visits} field visit(s) ·{' '}
                {data.counts.mobile_refuels} mobile refuel(s) · {data.counts.tomcard_purchases} card purchase(s) ·{' '}
                {data.counts.generator_swaps} generator change(s)
              </div>
            </Card>

            {/* Timeline — the actual story, chronologically */}
            <Card style={{ maxHeight: 520, overflowY: 'auto' }}>
              <SectionLabel style={{ marginBottom: 8, fontSize: 13, textTransform: 'none', letterSpacing: 0, color: ink, fontWeight: 700 }}>Timeline</SectionLabel>
              {data.timeline.length === 0 ? (
                <EmptyState icon="📭" title="No dated events found" desc="No tank readings, field visits, refuels, or purchases have dates recorded for this site in this cycle." />
              ) : (
                data.timeline.map((event: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < data.timeline.length - 1 ? `1px solid ${neutral[100]}` : 'none' }}>
                    <div style={{ fontSize: 16, flexShrink: 0 }}>{TIMELINE_ICONS[event.type] || '•'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: neutral[400], marginBottom: 1 }}>
                        {new Date(event.date).toLocaleDateString()} · {TIMELINE_LABELS[event.type] || event.type}
                      </div>
                      <div style={{ fontSize: 13, color: ink }}>{event.label}</div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
