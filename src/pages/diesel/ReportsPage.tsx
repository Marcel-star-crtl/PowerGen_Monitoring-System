/**
 * ReportsPage.tsx
 * Download cycle, site, and Tom Card Excel reports. Historical cluster comparison.
 *
 * FIX: All downloads now use programmatic fetch with auth header instead of
 * bare <a href> links that bypass authentication.
 */
import React, { useState } from 'react';
import { useCycles, useClusterSummary, useSiteBudgets } from '../../hooks/useDiesel';
import { reportsApi } from '../../api/dieselApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PageHeader, CycleSelector, fmtNum, Spinner, EmptyState, Btn } from '../../components/diesel/DieselComponents';

export default function ReportsPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: clusterData, loading: clusterLoading } = useClusterSummary(selectedKey);
  const { data: sites } = useSiteBudgets(selectedKey);
  const [siteId, setSiteId] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  /** Programmatic authenticated download — avoids browser navigation stripping auth header */
  async function handleDownload(url: string, filename: string, key: string) {
    setDownloading(key);
    try {
      await reportsApi.downloadFile(url, filename);
    } catch (e: any) {
      alert(`Download failed: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }

  if (cyclesLoading) return <Spinner />;
  const clusters = (clusterData as any)?.data || clusterData || [];
  const siteList  = (sites as any)?.data || sites || [];

  const chartData = clusters.map((c: any) => ({
    cluster:      c._id,
    budget:       c.total_budget_liters,
    contractual:  c.total_contractual,
    cms:          c.total_cms_consumed,
    field:        c.total_field_consumed,
  }));

  const cycleLabel = selectedKey || '—';

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="📊 Reports"
        subtitle="Download formatted Excel reports or view cluster comparisons"
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      {/* ── Download cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <ReportCard
          icon="📦"
          title="Full Cycle Report"
          desc="One sheet per cluster with every site's RH, consumption, variances, and alert flags."
          action={
            <Btn
              style={{ width: '100%' }}
              disabled={!selectedKey || downloading === 'cycle'}
              // onClick={() => handleDownload(
              //   `/diesel-recon/reports/cycle/${selectedKey}/excel`,
              //   `cycle-report-${cycleLabel}.xlsx`,
              //   'cycle'
              // )}
              onClick={() => handleDownload(
                reportsApi.cyclePath(selectedKey),
                `cycle-report-${cycleLabel}.xlsx`,
                'cycle'
              )}
            >
              {downloading === 'cycle' ? '⏳ Downloading…' : '⬇️ Download'}
            </Btn>
          }
        />
        <ReportCard
          icon="💳"
          title="Tom Card Reconciliation"
          desc="Every fuel purchase transaction with card, station, and cluster mapping totals."
          action={
            <Btn
              style={{ width: '100%' }}
              disabled={!selectedKey || downloading === 'tomcard'}
              // onClick={() => handleDownload(
              //   `/diesel-recon/reports/tomcard/${selectedKey}/excel`,
              //   `tomcard-report-${cycleLabel}.xlsx`,
              //   'tomcard'
              // )}
              onClick={() => handleDownload(
                reportsApi.tomCardPath(selectedKey),
                `tomcard-report-${cycleLabel}.xlsx`,
                'tomcard'
              )}
            >
              {downloading === 'tomcard' ? '⏳ Downloading…' : '⬇️ Download'}
            </Btn>
          }
        />
        <ReportCard
          icon="🔎"
          title="Site Deep-Dive"
          desc="Pick a site for a full KPI sheet, daily CMS log, field visits, and technician PM records."
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={siteId}
                onChange={e => setSiteId(e.target.value)}
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
              >
                <option value="">Select site…</option>
                {siteList.map((s: any) => (
                  <option key={s.site_id} value={s.site_id}>{s.site_id} — {s.site_name || ''}</option>
                ))}
              </select>
              <Btn
                size="sm"
                disabled={!siteId || downloading === 'site'}
                // onClick={() => siteId && handleDownload(
                //   `/diesel-recon/reports/site/${siteId}/${selectedKey}/excel`,
                //   `site-report-${siteId}-${cycleLabel}.xlsx`,
                //   'site'
                // )}
                onClick={() => siteId && handleDownload(
                  reportsApi.sitePath(siteId, selectedKey),
                  `site-report-${siteId}-${cycleLabel}.xlsx`,
                  'site'
                )}
              >
                {downloading === 'site' ? '⏳' : '⬇️'}
              </Btn>
            </div>
          }
        />
      </div>

      {/* ── PM Integration note ── */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 18px', marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          ℹ️ Site Deep-Dive reports now include technician PM running hours from maintenance records,
          enabling CMS validation against actual field meter readings.
        </p>
      </div>

      {/* ── Cluster comparison chart ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>
          Budget vs Contractual vs CMS vs Field — by Cluster
        </h3>
        {clusterLoading ? <Spinner /> : chartData.length === 0 ? (
          <EmptyState icon="📊" title="No cluster data" desc="Run reconciliation first" />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="cluster" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => fmtNum(v) + ' L'} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="budget"      fill="#9ca3af" name="Budget (L)"        radius={[4, 4, 0, 0]} />
              <Bar dataKey="contractual" fill="#2563eb" name="Contractual (L)"   radius={[4, 4, 0, 0]} />
              <Bar dataKey="cms"         fill="#16a34a" name="CMS Actual (L)"    radius={[4, 4, 0, 0]} />
              <Bar dataKey="field"       fill="#f59e0b" name="Field Consumed (L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  icon, title, desc, action,
}: {
  icon: string; title: string; desc: string; action: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', flex: 1, lineHeight: 1.5 }}>{desc}</p>
      {action}
    </div>
  );
}


