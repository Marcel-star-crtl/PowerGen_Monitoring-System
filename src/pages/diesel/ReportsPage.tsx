/**
 * ReportsPage.tsx
 * Download cycle, site, and Tom Card Excel reports. Historical cluster comparison.
 *
 * FIX: All downloads now use programmatic fetch with auth header instead of
 * bare <a href> links that bypass authentication.
 */
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';
import { useCycles, useClusterSummary, useSiteBudgets } from '../../hooks/useDiesel';
import { reportsApi } from '../../api/dieselApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PageHeader, CycleSelector, fmtNum, Spinner, EmptyState, Btn, Card, SectionLabel, KpiCard } from '../../components/diesel/DieselComponents';
import { neutral, ink, status as statusTokens, urgency as urgencyTokens, font } from '../../styles/dieselTokens';

export default function ReportsPage() {
  const { cycles, selectedKey, setSelectedKey, loading: cyclesLoading } = useCycles();
  const { data: clusterData, loading: clusterLoading } = useClusterSummary(selectedKey);
  const { data: sites } = useSiteBudgets(selectedKey);
  const [siteId, setSiteId] = useState('');
  const [downloading,   setDownloading]   = useState<string | null>(null);
  const [compareData,   setCompareData]   = useState<any[]>([]);
  const [compareLoading,setCompareLoading]= useState(false);

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

  // Load multi-cycle budget vs consumed data for last 6 cycles
  const loadComparison = useCallback(async () => {
    const last6 = cycles.slice(0, 6);
    if (!last6.length) return;
    setCompareLoading(true);
    try {
      const results = await Promise.allSettled(
        last6.map(c => apiClient.get('/site-budget/' + c.cycle_key + '/aggregate')
          .then(r => ({ cycle: c.cycle_key, label: c.label || c.cycle_key, ...r.data?.data?.totals })))
      );
      setCompareData(
        results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value)
          .filter(d => d.total_budget_liters > 0)
          .reverse()
      );
    } catch { /* no-op */ }
    finally { setCompareLoading(false); }
  }, [cycles]);

  useEffect(() => { if (cycles.length) loadComparison(); }, [cycles, loadComparison]);

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
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
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
                aria-label="Select site for deep-dive report"
                style={{ flex: 1, border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
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
      <div style={{ background: statusTokens.info.bg, border: `1px solid ${statusTokens.info.border}`, borderRadius: 10, padding: '12px 18px', marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: statusTokens.info.text }}>
          ℹ️ Site Deep-Dive reports now include technician PM running hours from maintenance records,
          enabling CMS validation against actual field meter readings.
        </p>
      </div>

      {/* ── Cluster comparison chart ── */}
      <Card>
        <SectionLabel>Budget vs Contractual vs CMS vs Field — by Cluster</SectionLabel>
        {clusterLoading ? <Spinner /> : chartData.length === 0 ? (
          <EmptyState icon="📊" title="No cluster data" desc="Run reconciliation first" />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
              <XAxis dataKey="cluster" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => fmtNum(v) + ' L'} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="budget"      fill={neutral[400]} name="Budget (L)"        radius={[4, 4, 0, 0]} />
              <Bar dataKey="contractual" fill="#2563eb" name="Contractual (L)"   radius={[4, 4, 0, 0]} />
              <Bar dataKey="cms"         fill={urgencyTokens.ok.fg} name="CMS Actual (L)"    radius={[4, 4, 0, 0]} />
              <Bar dataKey="field"       fill={urgencyTokens.high.fg} name="Field Consumed (L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      {/* ── Multi-cycle comparison chart ── */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color: ink }}>📈 Cycle Comparison — Budget vs Consumed</h3>
            <p style={{ margin:'4px 0 0', fontSize:12, color: neutral[500] }}>Last {compareData.length} cycles · from /site-budget aggregate</p>
          </div>
          <button onClick={loadComparison} disabled={compareLoading}
            style={{ border: `1px solid ${neutral[200]}`, background: neutral[50], borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12 }}>
            {compareLoading ? '⏳ Loading…' : '🔄 Refresh'}
          </button>
        </div>
        {compareLoading ? <Spinner size={28} /> : compareData.length === 0 ? (
          <p style={{ color: neutral[400], textAlign:'center', padding:24, fontSize:13 }}>
            No multi-cycle budget data available — upload Book11 files for past cycles to enable comparison.
          </p>
        ) : (
          <>
            {/* Summary stat strip */}
            <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
              {compareData.slice(-1).map((d: any) => (
                <React.Fragment key={d.cycle}>
                  <KpiCard label="Budget (L) (latest)" value={(d.total_budget_liters||0).toLocaleString()} />
                  <KpiCard label="Used (L) (latest)" value={(d.total_liters_used||0).toLocaleString()} />
                  <KpiCard label="Remaining (L) (latest)" value={Math.max(0,(d.total_budget_liters||0)-(d.total_liters_used||0)).toLocaleString()} />
                  <KpiCard label="Utilisation (latest)" value={d.total_budget_liters > 0
                      ? Math.round(((d.total_liters_used||0)/d.total_budget_liters)*100)+'%' : '—'} />
                </React.Fragment>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareData} margin={{ top:4, right:16, left:0, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                <XAxis dataKey="label" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={(v: number) => (v/1000).toFixed(0)+'k'} />
                <Tooltip
                  formatter={(value: any, name: string) => [Number(value).toLocaleString() + ' L', name]}
                  labelStyle={{ fontWeight:700, marginBottom:4 }}
                />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="total_budget_liters"   name="Budget (L)"    fill={neutral[200]} radius={[3,3,0,0]} />
                <Bar dataKey="total_liters_used"      name="Used (L)"      fill="#2a78d6" radius={[3,3,0,0]} />
                <Bar dataKey="total_liters_remaining" name="Remaining (L)" fill={urgencyTokens.ok.fg} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Cycle-by-cycle table */}
            <div style={{ overflowX:'auto', marginTop:20 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background: neutral[50] }}>
                    {['Cycle','Budget (L)','Used (L)','Remaining (L)','Utilisation','Sites'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color: neutral[500], fontSize:11, borderBottom: `1px solid ${neutral[200]}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...compareData].reverse().map((d: any) => {
                    const rem  = Math.max(0,(d.total_budget_liters||0)-(d.total_liters_used||0));
                    const pct  = d.total_budget_liters > 0 ? Math.round(((d.total_liters_used||0)/d.total_budget_liters)*100) : 0;
                    const color= pct>=90 ? urgencyTokens.critical.fg : pct>=75 ? urgencyTokens.high.fg : urgencyTokens.ok.fg;
                    return (
                      <tr key={d.cycle} style={{ borderBottom: `0.5px solid ${neutral[100]}` }}>
                        <td style={{ padding:'8px 12px', fontWeight:700 }}>{d.label}</td>
                        <td style={{ padding:'8px 12px' }}>{(d.total_budget_liters||0).toLocaleString()}</td>
                        <td style={{ padding:'8px 12px' }}>{(d.total_liters_used||0).toLocaleString()}</td>
                        <td style={{ padding:'8px 12px' }}>{rem.toLocaleString()}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <span style={{ color, fontWeight:700 }}>{pct}%</span>
                          <div style={{ background: neutral[200], height:4, width:60, borderRadius:2, display:'inline-block', marginLeft:8, verticalAlign:'middle' }}>
                            <div style={{ background:color, height:4, width:`${Math.min(pct,100)}%`, borderRadius:2 }} />
                          </div>
                        </td>
                        <td style={{ padding:'8px 12px', color: neutral[500] }}>{d.total_sites||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

    </div>
  );
}

function ReportCard({
  icon, title, desc, action,
}: {
  icon: string; title: string; desc: string; action: React.ReactNode;
}) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: ink }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 12, color: neutral[500], flex: 1, lineHeight: 1.5 }}>{desc}</p>
      {action}
    </Card>
  );
}


