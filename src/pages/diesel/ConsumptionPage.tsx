/**
 * ConsumptionPage.tsx
 * Per-site, per-cycle refueling history.
 * Each refueling event shows: request details, purchase, form submission data,
 * dip-stick measurements, photos, runtime hours — everything in one timeline card.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCycles }         from '@/hooks/useDiesel';
import { dieselManagerAPI }  from '@/api/endpoints/dieselManager';
import { Card }              from '@/components/common/Card';
import { Select }            from '@/components/common/Select';
import { Spinner }           from '@/components/common/Spinner';
import { EmptyState }        from '@/components/common/EmptyState';
import { Badge }             from '@/components/common/Badge';
import { formatDate, formatNumber } from '@/utils/formatters';
import { FiDroplet, FiTrendingUp, FiBarChart2, FiCalendar, FiCamera,
         FiDollarSign, FiTruck, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import apiClient from '@/api/client';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt  = (n: any, d = 1) => n != null && n !== '' ? formatNumber(Number(n), d) : '—';
const fmtL = (n: any) => n != null ? `${fmt(n)} L` : '—';
const fmtXAF = (n: any) => n != null ? `XAF ${Number(n).toLocaleString()}` : '—';
const fmtDt  = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'6px 0', borderBottom:'1px solid #f3f4f6', fontSize:13 }}>
      <span style={{ color:'#6b7280', flexShrink:0, marginRight:16 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color:'#111827', textAlign:'right' }}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        {icon}
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#6b7280' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PhotoGrid({ photos }: { photos: any[] }) {
  if (!photos.length) return null;
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:6 }}>
      {photos.map((p: any, i: number) => {
        const url = typeof p === 'string' ? p : p?.url || p?.uri || '';
        const cat = typeof p === 'object' ? (p?.category || p?.type || '') : '';
        if (!url) return null;
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display:'block' }}>
            <img src={url} alt={cat || `Photo ${i+1}`}
              style={{ width:100, height:75, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            {cat && <div style={{ fontSize:10, color:'#6b7280', textAlign:'center', marginTop:2, textTransform:'capitalize' }}>{cat}</div>}
          </a>
        );
      })}
    </div>
  );
}

/* ─── Single refueling event card ──────────────────────────────────────────── */
function RefuelEventCard({ event, index }: { event: any; index: number }) {
  const [open, setOpen] = useState(index === 0); // first card open by default
  const req = event.fuel_request;
  const fc  = event.fuel_consumption;
  const fp  = event.fuel_purchase;
  const f   = fc?.fuel_data     || {};
  const rt  = fc?.runtime_data  || {};

  const allPhotos = [
    ...(Array.isArray(fc?.photos)             ? fc.photos             : []),
    ...(Array.isArray(fc?.measurement_photos) ? fc.measurement_photos : []),
    ...(Array.isArray(fc?.guard_photos)       ? fc.guard_photos       : []),
  ];

  const statusColor: Record<string,string> = {
    refueled:'#16a34a', completed:'#16a34a', approved:'#2563eb',
    scheduled:'#2563eb', purchase_made:'#d97706', denied:'#dc2626',
  };
  const sc = statusColor[req?.status] || '#6b7280';

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', marginBottom:14, background:'#fff' }}>
      {/* Header — always visible */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px', background:'#f9fafb', cursor:'pointer', userSelect:'none' }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:16, background:sc+'22', display:'flex',
            alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FiDroplet size={16} color={sc} />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#111827' }}>
              Refueling #{event.index}
              {req && <span style={{ marginLeft:8, fontSize:12, color:'#6b7280' }}>FUEL-{req._id?.slice(-6).toUpperCase()}</span>}
            </div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
              {fmtDt(fc?.record_date || req?.approved_at)}
              {req?.assigned_to?.fullName && ` · ${req.assigned_to.fullName}`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#e53935' }}>
              {fmtL(f.fuel_added || req?.liters_actually_added || req?.liters_approved)}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>
              {fmtXAF(fp?.total_cost_xaf || (req?.liters_approved || 0) * (req?.xaf_per_liter || 828))}
            </div>
          </div>
          <div style={{ padding:'3px 10px', borderRadius:6, background:sc+'15', border:`1px solid ${sc}40` }}>
            <span style={{ fontSize:11, fontWeight:700, color:sc, textTransform:'uppercase' }}>{req?.status || '—'}</span>
          </div>
          {open ? <FiChevronUp size={16} color="#9ca3af" /> : <FiChevronDown size={16} color="#9ca3af" />}
        </div>
      </div>

      {/* Body — collapsible */}
      {open && (
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>

            {/* Column 1 — Request */}
            <div>
              <Section title="Request" icon={<FiCalendar size={13} color="#6b7280" />}>
                <Row label="Requested by"  value={req?.requested_by_name || req?.requested_by?.fullName} />
                <Row label="Assigned to"   value={req?.assigned_to?.fullName} />
                <Row label="Litres requested" value={fmtL(req?.liters_requested)} />
                <Row label="Litres approved"  value={fmtL(req?.liters_approved)} bold />
                <Row label="Actually added"   value={fmtL(f.fuel_added || req?.liters_actually_added)} bold />
                {(req?.liters_balance_returned > 0) && (
                  <Row label="Balance returned" value={
                    <span style={{ color:'#2563eb' }}>{fmtL(req.liters_balance_returned)}</span>
                  } />
                )}
                <Row label="Urgency"      value={req?.urgency?.toUpperCase()} />
                <Row label="Scheduled"    value={fmtDt(req?.scheduled_date)} />
                <Row label="Reason"       value={req?.request_reason} />
              </Section>

              <Section title="Approval chain" icon={<FiUser size={13} color="#6b7280" />}>
                {(req?.approvalChain || []).map((step: any) => (
                  <div key={step.level} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'4px 0', fontSize:12 }}>
                    <span style={{ width:20, height:20, borderRadius:10, flexShrink:0,
                      background: step.status==='approved' ? '#16a34a' : step.status==='denied' ? '#dc2626' : '#e5e7eb',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:700, color: step.status==='pending' ? '#9ca3af' : '#fff' }}>
                      {step.level}
                    </span>
                    <span style={{ flex:1, color:'#374151' }}>
                      {step.approver?.name || step.name}
                    </span>
                    <span style={{ color: step.status==='approved' ? '#16a34a' : step.status==='denied' ? '#dc2626' : '#9ca3af',
                      fontSize:10, fontWeight:600, textTransform:'uppercase' }}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </Section>
            </div>

            {/* Column 2 — Form submission data */}
            <div>
              <Section title="Fuel measurements (form)" icon={<FiDroplet size={13} color="#6b7280" />}>
                <Row label="Opening level"    value={fmtL(f.opening_level)} />
                <Row label="Closing level"    value={fmtL(f.closing_level)} bold />
                <Row label="Fuel added"       value={fmtL(f.fuel_added)} bold />
                <Row label="Fuel consumed"    value={fmtL(f.fuel_consumed)} />
                <Row label="Est. cost"        value={
                  fc?.metrics?.total_cost_xaf ? fmtXAF(fc.metrics.total_cost_xaf)
                  : fc?.metrics?.cost_estimate ? fmtXAF(fc.metrics.cost_estimate)
                  : null} bold />
                <Row label="Tank capacity"    value={fmtL(f.tank_capacity)} />
                <Row label="Dip stick before" value={f.dip_stick_before_cm != null ? `${f.dip_stick_before_cm} cm` : null} />
                <Row label="Dip stick after"  value={f.dip_stick_after_cm  != null ? `${f.dip_stick_after_cm} cm`  : null} />
                <Row label="Dip stick rise"   value={
                  f.dip_stick_before_cm != null && f.dip_stick_after_cm != null
                    ? <span style={{ color:'#16a34a', fontWeight:700 }}>
                        +{(f.dip_stick_after_cm - f.dip_stick_before_cm).toFixed(1)} cm
                      </span>
                    : null
                } />
                <Row label="Sensor status"   value={f.fuel_sensor_status} />
                <Row label="Tank notes"      value={f.tank_observations} />
              </Section>

              <Section title="Runtime data" icon={<FiBarChart2 size={13} color="#6b7280" />}>
                <Row label="Opening hours"  value={rt.opening_hours  != null ? `${fmt(rt.opening_hours)} hrs`  : null} />
                <Row label="Closing hours"  value={rt.closing_hours  != null ? `${fmt(rt.closing_hours)} hrs`  : null} />
                <Row label="Runtime hours"  value={rt.runtime_hours  != null ? `${fmt(rt.runtime_hours)} hrs`  : null} bold />
                <Row label="Transfer time"  value={rt.transfer_time_min != null ? `${rt.transfer_time_min} min` : null} />
                <Row label="Cons. rate"     value={fc?.metrics?.consumption_rate != null ? `${fmt(fc.metrics.consumption_rate, 2)} L/h` : null} />
                <Row label="Efficiency"     value={fc?.metrics?.efficiency_rating} />
              </Section>

              <Section title="Personnel" icon={<FiUser size={13} color="#6b7280" />}>
                <Row label="Guard name"     value={fc?.guard_name} />
                <Row label="Guard number"   value={fc?.guard_number} />
                <Row label="FSE"            value={fc?.fse_name} />
                <Row label="Truck plate"    value={rt.truck_plate_number || fc?.truck_plate_number} />
              </Section>
            </div>

            {/* Column 3 — Purchase */}
            <div>
              <Section title="Purchase / Tom Card" icon={<FiDollarSign size={13} color="#6b7280" />}>
                <Row label="Tom Card #"    value={fp?.tom_card_number} bold />
                <Row label="Cluster"       value={fp?.cluster} />
                <Row label="Vendor"        value={fp?.supplier || fp?.fuel_vendor} />
                <Row label="Station"       value={fp?.station} />
                <Row label="Total qty"     value={fp?.total_quantity != null ? `${fmt(fp.total_quantity)} L` : null} bold />
                <Row label="Remaining"     value={fp?.remaining_quantity != null ? `${fmt(fp.remaining_quantity)} L` : null} />
                <Row label="Price/L"       value={fp?.price_per_liter != null ? `XAF ${fp.price_per_liter}/L` : null} />
                <Row label="Total cost"    value={fp?.total_cost_xaf != null ? fmtXAF(fp.total_cost_xaf) : fp?.total_cost != null ? fmtXAF(fp.total_cost) : null} bold />
                <Row label="Purchase date" value={fmtDt(fp?.purchase_date)} />
              </Section>

              <Section title="Truck & transport" icon={<FiTruck size={13} color="#6b7280" />}>
                <Row label="Truck plate"      value={fp?.truck_plate_number || rt.truck_plate_number} />
                <Row label="Arrived station"  value={fmtDt(fp?.arrival_time)} />
                <Row label="Left station"     value={fmtDt(fp?.departure_time)} />
                <Row label="Arrived site"     value={rt.arrival_time_site ? fmtDt(rt.arrival_time_site) : null} />
                <Row label="Transfer time"    value={rt.transfer_time_min != null ? `${rt.transfer_time_min} min` : null} />
              </Section>

              {/* Budget impact */}
              {req?.budget_snapshot && (
                <Section title="Budget impact" icon={<FiBarChart2 size={13} color="#6b7280" />}>
                  <Row label="Cycle budget"   value={fmtL(req.budget_snapshot.budget_liters)} />
                  <Row label="Used before"    value={fmtL((req.budget_snapshot.liters_used || 0) - (f.fuel_added || req?.liters_approved || 0))} />
                  <Row label="Used after"     value={fmtL(req.budget_snapshot.liters_used)} bold />
                  <Row label="Remaining"      value={fmtL(Math.max(0,
                    (req.budget_snapshot.budget_liters || 0) - (req.budget_snapshot.liters_used || 0)
                  ))} />
                </Section>
              )}
            </div>
          </div>

          {/* Photos — full width */}
          {allPhotos.length > 0 && (
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:16, marginTop:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <FiCamera size={13} color="#6b7280" />
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                  textTransform:'uppercase', color:'#6b7280' }}>
                  Photos ({allPhotos.length})
                </span>
              </div>
              <PhotoGrid photos={allPhotos} />
            </div>
          )}

          {/* Workflow timeline */}
          {fc?.workflow_history && fc.workflow_history.length > 0 && (
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:16, marginTop:16 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                textTransform:'uppercase', color:'#6b7280', marginBottom:10 }}>
                Workflow Timeline
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {fc.workflow_history.map((step: any, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12 }}>
                    <div style={{ width:8, height:8, borderRadius:4, background:'#16a34a', flexShrink:0 }} />
                    <span style={{ fontWeight:600, color:'#374151', textTransform:'capitalize', minWidth:120 }}>
                      {(step.status || step.type || '').replace(/_/g,' ')}
                    </span>
                    <span style={{ color:'#9ca3af' }}>{fmtDt(step.timestamp)}</span>
                    {step.note && <span style={{ color:'#6b7280' }}>— {step.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
const ConsumptionPage: React.FC = () => {
  const { isMobile, isNarrow } = useBreakpoint();
  const { cycles, selectedKey: cycleKey, setSelectedKey: setCycleKey } = useCycles();
  const [sites,        setSites]        = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [events,       setEvents]       = useState<any[]>([]);
  const [siteBudget,   setSiteBudget]   = useState<any>(null);
  const [summary,      setSummary]      = useState<any>(null);
  const [loading,      setLoading]      = useState(false);
  const [sitesLoading, setSitesLoading] = useState(true);

  // Load sites
  useEffect(() => {
    setSitesLoading(true);
    dieselManagerAPI.getSites()
      .then(res => setSites(res?.data || res || []))
      .catch(console.error)
      .finally(() => setSitesLoading(false));
  }, []);

  // Load site budget
  useEffect(() => {
    if (!selectedSite || !cycleKey) return;
    apiClient.get(`/site-budget/${cycleKey}/${selectedSite}`)
      .then(r => setSiteBudget(r.data?.data || null))
      .catch(() => setSiteBudget(null));
  }, [selectedSite, cycleKey]);

  // Load all refueling events for the site + cycle
  // An "event" = FuelRequest (refueled status) enriched with FuelConsumption + FuelPurchase
  const loadEvents = useCallback(async () => {
    if (!selectedSite || !cycleKey) return;
    setLoading(true);
    setEvents([]);
    setSummary(null);
    try {
      // 1. Get all refueled FuelRequests for this site + cycle
      const frRes = await apiClient.get('/fuel-requests', {
        params: { site_id: selectedSite, cycle_key: cycleKey, limit: 50 },
      });
      const allReqs: any[] = frRes.data?.data || [];
      const refueled = allReqs.filter(r =>
        ['refueled','completed','purchase_made'].includes(r.status)
      );

      if (refueled.length === 0) {
        setEvents([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      // 2. For each request, fetch the full detail (includes fuel_consumption + fuel_purchase)
      const enriched = await Promise.all(
        refueled.map(async (req, idx) => {
          try {
            const det = await apiClient.get(`/fuel-requests/${req._id}`);
            const full = det.data?.data || req;
            return {
              index:            refueled.length - idx,
              fuel_request:     full,
              fuel_consumption: full.fuel_consumption || null,
              fuel_purchase:    full.fuel_purchase    || null,
            };
          } catch {
            return { index: refueled.length - idx, fuel_request: req, fuel_consumption: null, fuel_purchase: null };
          }
        })
      );

      // Sort newest first
      enriched.sort((a, b) => {
        const da = new Date(a.fuel_consumption?.record_date || a.fuel_request?.approved_at || 0).getTime();
        const db = new Date(b.fuel_consumption?.record_date || b.fuel_request?.approved_at || 0).getTime();
        return db - da;
      });

      setEvents(enriched);

      // Summary
      const totalAdded    = enriched.reduce((s,e) => s + (e.fuel_consumption?.fuel_data?.fuel_added    || e.fuel_request?.liters_actually_added || 0), 0);
      const totalConsumed = enriched.reduce((s,e) => s + (e.fuel_consumption?.fuel_data?.fuel_consumed || 0), 0);
      const totalCost     = enriched.reduce((s,e) => s + (e.fuel_purchase?.total_cost_xaf || 0), 0);
      const totalRuntime  = enriched.reduce((s,e) => s + (e.fuel_consumption?.runtime_data?.runtime_hours || 0), 0);
      setSummary({ totalAdded, totalConsumed, totalCost, totalRuntime, count: enriched.length });

    } catch (err) {
      console.error('[ConsumptionPage] loadEvents:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSite, cycleKey]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const site = sites.find(s => (s.IHS_ID_SITE || s.site_id) === selectedSite);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fuel Consumption — Site History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a site to see every refueling event for the cycle — purchase, form data, measurements, photos
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          <Select label="Cycle" value={cycleKey} onChange={e => setCycleKey(e.target.value)}
            options={cycles.map(c => ({ value: c.cycle_key, label: `${c.label}${c.status !== 'open' ? ` (${c.status})` : ''}` }))}
            fullWidth />
          <Select label="Site" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
            options={[
              { value: '', label: sitesLoading ? 'Loading sites…' : 'Select a site…' },
              ...sites.map(s => ({
                value: s.IHS_ID_SITE || s.site_id,
                label: `${s.Site_Name || s.site_name || s.IHS_ID_SITE} (${s.IHS_ID_SITE || s.site_id})`,
              })),
            ]}
            fullWidth />
          {site && (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Site Details</div>
              <div style={{ fontSize:13, color:'#374151' }}>
                <span style={{ fontWeight:700 }}>{site.Site_Name || site.site_name}</span>
                <span style={{ color:'#9ca3af', marginLeft:8 }}>{site.GRATO_Cluster || site.cluster || ''}</span>
              </div>
              <div style={{ fontSize:12, color:'#6b7280' }}>
                CCPH: <strong>{site.CCPH || site.ccph || '—'} L/h</strong>
                {site.Tank_Capacity && <span style={{ marginLeft:12 }}>Tank: <strong>{site.Tank_Capacity} L</strong></span>}
              </div>
            </div>
          )}
        </div>
      </Card>

      {!selectedSite ? (
        <EmptyState icon={<FiDroplet className="h-16 w-16 text-gray-400" />}
          title="Select a site"
          description="Choose a cycle and site to see the full refueling history" />
      ) : loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Site budget */}
          {siteBudget && (
            <Card>
              <h2 style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Budget — {cycleKey}</h2>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isNarrow ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap:12 }}>
                {[
                  { label:'Budget (L)',     value: formatNumber(siteBudget.budget_liters, 0),    color:'#374151' },
                  { label:'Used (L)',       value: formatNumber(siteBudget.liters_used || 0, 0),  color:'#2563eb' },
                  { label:'Committed (L)', value: formatNumber(siteBudget.liters_committed || 0, 0), color:'#d97706' },
                  { label:'Remaining (L)', value: formatNumber(Math.max(0,(siteBudget.budget_liters||0)-(siteBudget.liters_used||0)-(siteBudget.liters_committed||0)),0),
                    color: ((siteBudget.budget_liters||0)-(siteBudget.liters_used||0)) < 50 ? '#dc2626' : '#16a34a' },
                  { label:'XAF per L',     value: `XAF ${siteBudget.xaf_per_liter || 828}`,     color:'#374151' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'10px', background:'#f9fafb', borderRadius:8 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {siteBudget.in_deficit && (
                <div style={{ marginTop:10, padding:'8px 12px', background:'#fff5f5', border:'1px solid #fca5a5',
                  borderRadius:8, fontSize:13, color:'#dc2626' }}>
                  ⚠️ Site is in <strong>budget deficit</strong> — {formatNumber(siteBudget.deficit_liters,1)}L over allocation.
                </div>
              )}
            </Card>
          )}

          {/* Summary KPIs */}
          {summary && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isNarrow ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:14 }}>
              {[
                { label:'Refueling Events',    value: summary.count,                              color:'#374151', icon:<FiCalendar size={22} color="#6b7280" /> },
                { label:'Total Fuel Added',    value: `${formatNumber(summary.totalAdded,1)} L`,  color:'#2563eb', icon:<FiDroplet size={22} color="#2563eb" /> },
                { label:'Total Consumed',      value: `${formatNumber(summary.totalConsumed,1)} L`,color:'#d97706',icon:<FiTrendingUp size={22} color="#d97706" /> },
                { label:'Total Cost',          value: fmtXAF(summary.totalCost),                  color:'#16a34a', icon:<FiDollarSign size={22} color="#16a34a" /> },
              ].map(s => (
                <Card key={s.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
                    </div>
                    {s.icon}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Refueling events */}
          {events.length === 0 ? (
            <EmptyState icon={<FiDroplet className="h-12 w-12 text-gray-400" />}
              title="No refueling records"
              description={`No completed refueling events found for this site in cycle ${cycleKey}`} />
          ) : (
            <div>
              <h2 style={{ fontWeight:700, fontSize:15, marginBottom:14, color:'#111827' }}>
                {events.length} Refueling Event{events.length !== 1 ? 's' : ''} — {site?.Site_Name || selectedSite}
              </h2>
              {events.map((ev, i) => <RefuelEventCard key={ev.fuel_request?._id || i} event={ev} index={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConsumptionPage;