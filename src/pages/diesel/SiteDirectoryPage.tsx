/**
 * SiteDirectoryPage.tsx
 *
 * Flexible filter + export tool for site data — deliberately NOT gated
 * behind a billing cycle selection like most of this app's other pages,
 * since the point is being able to pull a filtered site list "at any
 * point in time" regardless of where the current cycle stands. Queries
 * the live Site collection directly (routes/siteRoutes.js's extended
 * GET /api/sites), not a cycle-scoped reconciliation snapshot.
 */
import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { sitesDirectoryApi } from '../../api/dieselApi';
import {
  PageHeader, Spinner, ErrorBox, EmptyState, Btn,
} from '../../components/diesel/DieselComponents';
import { neutral, ink } from '../../styles/dieselTokens';

type SiteRow = {
  IHS_ID_SITE: string;
  Site_Name?: string;
  GRATO_Cluster?: string;
  Region?: string;
  Latitude?: number | null;
  Longitude?: number | null;
  Sites_Type?: string;
  Sites_Priority?: string;
  Sites_Configuration_Outdoor_Indoor?: string;
  Fuel_Quantity_Found?: number | null;
  Tank_Capacity_1?: number | null;
  Fuel_Level_Source?: string | null;
  Fuel_Level_Updated_At?: string | null;
  Number_of_Generators?: number;
  Primary_Generator?: string;
  Total_Run_Hours_All_Generators?: number;
  Grid_Availability?: string;
  Actual_Date_Visit?: string | null;
  Technician_Name?: string;
  IHS_supervisor_name?: string;
  IHS_phone_number?: string;
};

const inputStyle: React.CSSProperties = {
  border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '7px 10px',
  fontSize: 13, width: '100%', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: neutral[500],
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em',
};

// Column groups offered for export — a deliberate curated subset of the
// Site model's 100+ fields (many are legacy/administrative and not
// useful in a fuel-operations export), organized so a user can build
// exactly the export they need rather than getting either a bare
// 5-column table or an overwhelming 100-column dump.
const COLUMN_GROUPS: { label: string; fields: { key: keyof SiteRow | 'fuel_pct'; header: string }[] }[] = [
  {
    label: 'Identification',
    fields: [
      { key: 'IHS_ID_SITE', header: 'Site ID' },
      { key: 'Site_Name', header: 'Site Name' },
      { key: 'GRATO_Cluster', header: 'Cluster' },
      { key: 'Region', header: 'Region' },
      { key: 'Sites_Type', header: 'Site Type' },
      { key: 'Sites_Priority', header: 'Priority' },
      { key: 'Sites_Configuration_Outdoor_Indoor', header: 'Configuration' },
    ],
  },
  {
    label: 'Location',
    fields: [
      { key: 'Latitude', header: 'Latitude' },
      { key: 'Longitude', header: 'Longitude' },
    ],
  },
  {
    label: 'Fuel',
    fields: [
      { key: 'Fuel_Quantity_Found', header: 'Current Fuel (L)' },
      { key: 'Tank_Capacity_1', header: 'Tank Capacity (L)' },
      { key: 'fuel_pct', header: 'Fuel %' },
      { key: 'Fuel_Level_Source', header: 'Fuel Reading Source' },
      { key: 'Fuel_Level_Updated_At', header: 'Fuel Reading Date' },
    ],
  },
  {
    label: 'Generator',
    fields: [
      { key: 'Number_of_Generators', header: '# Generators' },
      { key: 'Primary_Generator', header: 'Primary Generator' },
      { key: 'Total_Run_Hours_All_Generators', header: 'Total Run Hours' },
      { key: 'Grid_Availability', header: 'Grid Availability' },
    ],
  },
  {
    label: 'Visit & Contact',
    fields: [
      { key: 'Actual_Date_Visit', header: 'Last Visit Date' },
      { key: 'Technician_Name', header: 'Technician' },
      { key: 'IHS_supervisor_name', header: 'IHS Supervisor' },
      { key: 'IHS_phone_number', header: 'IHS Phone' },
    ],
  },
];
const ALL_FIELD_KEYS = COLUMN_GROUPS.flatMap(g => g.fields.map(f => f.key));

function fuelPct(s: SiteRow): number | null {
  if (s.Fuel_Quantity_Found == null || !s.Tank_Capacity_1) return null;
  return Math.round((s.Fuel_Quantity_Found / s.Tank_Capacity_1) * 100);
}

export default function SiteDirectoryPage() {
  const { isNarrow } = useBreakpoint();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [cluster, setCluster] = useState('');
  const [sitesType, setSitesType] = useState('');
  const [priority, setPriority] = useState('');
  const [hasCoordinates, setHasCoordinates] = useState('');
  const [minFuelPct, setMinFuelPct] = useState('');
  const [maxFuelPct, setMaxFuelPct] = useState('');
  const [visitAfter, setVisitAfter] = useState('');
  const [visitBefore, setVisitBefore] = useState('');

  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Export column selection ─────────────────────────────────────────────
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(ALL_FIELD_KEYS as string[]));

  async function runQuery() {
    setLoading(true);
    setError(null);
    try {
      const res = await sitesDirectoryApi.list({
        search: search || undefined,
        region: region || undefined,
        cluster: cluster || undefined,
        sitesType: sitesType || undefined,
        priority: priority || undefined,
        hasCoordinates: hasCoordinates || undefined,
        minFuelPct: minFuelPct || undefined,
        maxFuelPct: maxFuelPct || undefined,
        visitAfter: visitAfter || undefined,
        visitBefore: visitBefore || undefined,
      });
      setSites(((res as any)?.data || res || []) as SiteRow[]);
      setHasSearched(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }

  // Load an unfiltered baseline on first visit — "at any point in time"
  // should mean useful data is there immediately, not an empty page
  // waiting for the user to configure filters before seeing anything.
  useEffect(() => { runQuery(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const clusters = useMemo(
    () => Array.from(new Set(sites.map(s => s.GRATO_Cluster).filter(Boolean))).sort() as string[],
    [sites]
  );
  const regions = useMemo(
    () => Array.from(new Set(sites.map(s => s.Region).filter(Boolean))).sort() as string[],
    [sites]
  );

  function toggleField(key: string) {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleExport() {
    const activeFields = COLUMN_GROUPS.flatMap(g => g.fields).filter(f => selectedFields.has(f.key as string));
    const rows = sites.map(s => {
      const row: Record<string, any> = {};
      for (const f of activeFields) {
        row[f.header] = f.key === 'fuel_pct' ? fuelPct(s) : (s as any)[f.key] ?? '';
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sites');
    XLSX.writeFile(wb, `Site_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function resetFilters() {
    setSearch(''); setRegion(''); setCluster(''); setSitesType(''); setPriority('');
    setHasCoordinates(''); setMinFuelPct(''); setMaxFuelPct(''); setVisitAfter(''); setVisitBefore('');
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="📋 Site Directory"
        subtitle="Filter and extract site data at any point — not tied to a billing cycle. Filter, then export exactly the columns you need."
      />

      {/* ── Filters ── */}
      <div style={{
        border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 16,
        display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(4, 1fr)', gap: 12,
      }}>
        <div>
          <label style={labelStyle} htmlFor="dir-search">Search</label>
          <input id="dir-search" style={inputStyle} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Site name, ID, or tenant…" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-region">Region</label>
          <select id="dir-region" style={inputStyle} value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-cluster">Cluster</label>
          <select id="dir-cluster" style={inputStyle} value={cluster} onChange={e => setCluster(e.target.value)}>
            <option value="">All Clusters</option>
            {clusters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-priority">Priority</label>
          <select id="dir-priority" style={inputStyle} value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">Any Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-sitetype">Site Type</label>
          <input id="dir-sitetype" style={inputStyle} value={sitesType} onChange={e => setSitesType(e.target.value)}
            placeholder="e.g. Rooftop, Ground…" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-coords">Coordinates</label>
          <select id="dir-coords" style={inputStyle} value={hasCoordinates} onChange={e => setHasCoordinates(e.target.value)}>
            <option value="">Any</option>
            <option value="true">Has coordinates</option>
            <option value="false">Missing coordinates</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-minfuel">Min Fuel %</label>
          <input id="dir-minfuel" type="number" min={0} max={100} style={inputStyle} value={minFuelPct}
            onChange={e => setMinFuelPct(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-maxfuel">Max Fuel %</label>
          <input id="dir-maxfuel" type="number" min={0} max={100} style={inputStyle} value={maxFuelPct}
            onChange={e => setMaxFuelPct(e.target.value)} placeholder="100" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-visitafter">Last Visit After</label>
          <input id="dir-visitafter" type="date" style={inputStyle} value={visitAfter} onChange={e => setVisitAfter(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="dir-visitbefore">Last Visit Before</label>
          <input id="dir-visitbefore" type="date" style={inputStyle} value={visitBefore} onChange={e => setVisitBefore(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, gridColumn: isNarrow ? undefined : 'span 2' }}>
          <Btn variant="primary" size="sm" onClick={runQuery} loading={loading} style={{ flex: 1 }}>
            Apply Filters
          </Btn>
          <Btn variant="secondary" size="sm" onClick={resetFilters}>Reset</Btn>
        </div>
      </div>

      {/* ── Export column picker ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>Export Columns</span>
          <Btn variant="primary" size="sm" onClick={handleExport} disabled={sites.length === 0 || selectedFields.size === 0}>
            ⬇ Export {sites.length} site{sites.length === 1 ? '' : 's'} to Excel
          </Btn>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {COLUMN_GROUPS.map(group => (
            <div key={group.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: neutral[400], marginBottom: 6, textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.fields.map(f => (
                <label key={f.key as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedFields.has(f.key as string)}
                    onChange={() => toggleField(f.key as string)}
                  />
                  {f.header}
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={runQuery} />}

      {loading ? (
        <Spinner />
      ) : !hasSearched || sites.length === 0 ? (
        <EmptyState icon="📋" title="No sites match these filters" desc="Try widening your filters, or reset them to see the full directory." />
      ) : (
        <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, overflow: 'auto', maxHeight: 520 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: neutral[50], zIndex: 1 }}>
              <tr>
                {['Site ID', 'Name', 'Cluster', 'Region', 'Fuel %', 'Last Visit', 'Coordinates'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map(s => {
                const pct = fuelPct(s);
                return (
                  <tr key={s.IHS_ID_SITE} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                    <td style={{ padding: '7px 12px', fontFamily: 'monospace' }}>{s.IHS_ID_SITE}</td>
                    <td style={{ padding: '7px 12px' }}>{s.Site_Name || '—'}</td>
                    <td style={{ padding: '7px 12px' }}>{s.GRATO_Cluster || '—'}</td>
                    <td style={{ padding: '7px 12px' }}>{s.Region || '—'}</td>
                    <td style={{ padding: '7px 12px' }}>{pct != null ? `${pct}%` : '—'}</td>
                    <td style={{ padding: '7px 12px' }}>{s.Actual_Date_Visit ? new Date(s.Actual_Date_Visit).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '7px 12px' }}>{s.Latitude != null && s.Longitude != null ? '✓' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: neutral[500] }}>
        {sites.length} site{sites.length === 1 ? '' : 's'} match{sites.length === 1 ? 'es' : ''} the current filters.
        Table shows a summary view — use the column picker above to choose exactly what's included in the Excel export.
      </div>
    </div>
  );
}
