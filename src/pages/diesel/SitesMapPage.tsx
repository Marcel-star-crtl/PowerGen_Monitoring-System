/**
 * SitesMapPage.tsx
 *
 * Live map of all sites with valid coordinates, colored by this cycle's
 * fuel urgency (reusing the same prediction data fuelPlanningService
 * already computes — see routes/sitesMapRoutes.js). Lets a diesel manager
 * visually see where the critical/high-urgency sites actually are,
 * instead of only seeing them as rows in a table.
 *
 * Uses react-leaflet (already a project dependency, no API key needed —
 * OpenStreetMap tiles) rather than a Google Maps integration requiring a
 * paid, key-gated service.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCycles } from '../../hooks/useDiesel';
import { sitesMapApi, technicianTrackingApi, routeOptimizationApi } from '../../api/dieselApi';
import { useFetch } from '../../hooks/useDiesel';
import {
  PageHeader, CycleSelector, Spinner, ErrorBox, EmptyState, StatusPill, Btn, fmtDate, Card,
} from '../../components/diesel/DieselComponents';
import { urgency as urgencyTokens, neutral, ink, status as statusTokens, font } from '../../styles/dieselTokens';

// Default center: Douala, Cameroon — this fleet's operating region.
// Only used before any sites have loaded / as a fallback if no site has
// coordinates at all.
const DEFAULT_CENTER: [number, number] = [4.0511, 9.7679];
const DEFAULT_ZOOM = 8;

const labelStyleSmall: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: neutral[400], textTransform: 'uppercase',
  letterSpacing: '0.03em', marginBottom: 4,
};

type MapSite = {
  site_id: string;
  name: string;
  cluster: string | null;
  region: string | null;
  lat: number;
  lng: number;
  geofence_radius_m: number;
  current_fuel_level: number | null;
  tank_capacity: number | null;
  urgency: keyof typeof urgencyTokens;
  days_to_empty: number | null;
  fuel_level_source: 'field_visit' | 'tank_telemetry' | null;
  fuel_level_updated_at: string | null;
};

// Custom colored pin — avoids Leaflet's default marker image path issue
// entirely (a well-known bundler problem: the default marker PNGs don't
// resolve correctly under webpack/CRA without extra config), and doubles
// as urgency-color coding at the same time.
function buildPinIcon(color: string) {
  return L.divIcon({
    className: 'diesel-map-pin',
    html: `
      <div style="
        width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 2px solid #fff;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  });
}

const PIN_ICONS: Record<string, L.DivIcon> = {
  critical: buildPinIcon(urgencyTokens.critical.fg),
  high:     buildPinIcon(urgencyTokens.high.fg),
  medium:   buildPinIcon(urgencyTokens.medium.fg),
  ok:       buildPinIcon(urgencyTokens.ok.fg),
  unknown:  buildPinIcon(urgencyTokens.unknown.fg),
};

type TechnicianPosition = {
  technician_id: string;
  technician_name: string;
  technician_phone: string | null;
  site_id: string | null;
  site_name: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  last_updated: string;
};

// Distinct from urgency pins (a teardrop shape) — a round badge with a
// person glyph, so a technician is never visually confused with a site.
const TECHNICIAN_ICON = L.divIcon({
  className: 'diesel-technician-pin',
  html: `
    <div style="
      width: 30px; height: 30px; border-radius: 50%;
      background: #2563EB; border: 3px solid #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      font-size: 15px;
    ">🧑‍🔧</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

/** Minutes since a timestamp, for "last updated Xm ago" display. */
function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/**
 * Tracks the map's current zoom level so geofence circles can be hidden
 * at fleet-wide zoom (where a 150m circle is imperceptible and 246 of
 * them just add visual noise) and shown once zoomed in enough to be
 * actually useful.
 */
function useZoomLevel(initial: number) {
  const [zoom, setZoom] = useState(initial);
  useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
  return zoom;
}

const GEOFENCE_MIN_ZOOM = 14;

/**
 * Individual site markers — deliberately NOT clustered. Every site pin
 * stays visible and independently clickable at any zoom level, even when
 * several sites sit close enough to visually overlap. This was a
 * deliberate choice, not an oversight: an earlier version grouped nearby
 * sites into a single numbered badge that had to be clicked (and
 * sometimes zoomed/spiderfied) to reach an individual site — the
 * preferred behavior instead is that a site is always just a normal
 * pin, and the user zooms in manually to separate a dense area rather
 * than clicking through a cluster first.
 */
function SiteMarkers({
  sites, onSiteClick,
}: {
  sites: MapSite[];
  onSiteClick: (site: MapSite) => void;
}) {
  return (
    <>
      {sites.map(site => (
        <Marker
          key={site.site_id}
          position={[site.lat, site.lng]}
          icon={PIN_ICONS[site.urgency] || PIN_ICONS.unknown}
          eventHandlers={{ click: () => onSiteClick(site) }}
        />
      ))}
    </>
  );
}

/** Recenters/zooms the map imperatively when a search result is picked. */
/** Captures a map click as the route's starting point while route mode is active. */
function RouteClickCapture({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

/** Captures the live map instance into a ref so code outside the MapContainer (the side panel) can read its current view — e.g. "Use Map Center". */
function MapInstanceCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

function FlyToSite({ target }: { target: MapSite | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 0.6 });
  }, [target, map]);
  return null;
}

function GeofenceCircles({ sites }: { sites: MapSite[] }) {
  const zoom = useZoomLevel(DEFAULT_ZOOM);
  if (zoom < GEOFENCE_MIN_ZOOM) return null;
  return (
    <>
      {sites.map(site => (
        <Circle
          key={`geo-${site.site_id}`}
          center={[site.lat, site.lng]}
          radius={site.geofence_radius_m}
          pathOptions={{
            fillColor: urgencyTokens[site.urgency]?.fg || urgencyTokens.unknown.fg,
            fillOpacity: 0.12,
            color: urgencyTokens[site.urgency]?.fg || urgencyTokens.unknown.fg,
            weight: 1,
          }}
        />
      ))}
    </>
  );
}

function fuelLevelSourceLabel(source: MapSite['fuel_level_source']) {
  if (source === 'tank_telemetry') return 'Tank telemetry';
  if (source === 'field_visit') return 'Field visit';
  return null;
}

export default function SitesMapPage() {
  const navigate = useNavigate();
  const { isNarrow } = useBreakpoint();
  const { cycles, selectedKey, setSelectedKey } = useCycles();
  const { data: sites, loading, error, refetch } = useFetch<MapSite[]>(
    () => sitesMapApi.forCycle(selectedKey),
    [selectedKey],
    { skip: !selectedKey }
  );

  const [urgencyFilter, setUrgencyFilter] = useState<string[]>(['critical', 'high', 'medium', 'ok', 'unknown']);
  const [clusterFilter, setClusterFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<MapSite | null>(null);
  const [flyTarget, setFlyTarget] = useState<MapSite | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianPosition[]>([]);
  const [showTechnicians, setShowTechnicians] = useState(true);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStops, setRouteStops] = useState<MapSite[]>([]);
  const [routeStart, setRouteStart] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [routeResult, setRouteResult] = useState<{
    order: any[];
    total_distance_km: number;
    total_duration_min: number | null;
    used_road_distance: boolean;
    route_geometry: [number, number][] | null;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await technicianTrackingApi.active();
        if (active) setTechnicians(((res as any)?.data || res || []) as TechnicianPosition[]);
      } catch {
        // Non-fatal — if this fails, the map simply shows no technician
        // pins rather than breaking the rest of the page.
      }
    }
    void poll();
    const interval = setInterval(poll, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const siteList: MapSite[] = (sites as any) || [];

  const clusters = useMemo(
    () => Array.from(new Set(siteList.map(s => s.cluster).filter(Boolean))).sort() as string[],
    [siteList]
  );

  const filtered = siteList.filter(s =>
    urgencyFilter.includes(s.urgency) &&
    (!clusterFilter || s.cluster === clusterFilter)
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return siteList
      .filter(s => s.name.toLowerCase().includes(q) || s.site_id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, siteList]);

  const center: [number, number] = filtered.length > 0
    ? [filtered[0].lat, filtered[0].lng]
    : DEFAULT_CENTER;

  const counts = {
    critical: siteList.filter(s => s.urgency === 'critical').length,
    high:     siteList.filter(s => s.urgency === 'high').length,
    medium:   siteList.filter(s => s.urgency === 'medium').length,
    ok:       siteList.filter(s => s.urgency === 'ok').length,
    unknown:  siteList.filter(s => s.urgency === 'unknown').length,
  };

  function pickSearchResult(site: MapSite) {
    setSelectedSite(site);
    setFlyTarget(site);
    setSearch('');
  }

  function toggleRouteStop(site: MapSite) {
    setRouteStops(prev =>
      prev.some(s => s.site_id === site.site_id)
        ? prev.filter(s => s.site_id !== site.site_id)
        : [...prev, site]
    );
    setRouteResult(null); // selection changed — any previous result is stale
  }

  function handleSiteClick(site: MapSite) {
    if (routeMode) {
      toggleRouteStop(site);
    } else {
      setSelectedSite(site);
    }
  }

  async function runRouteOptimization() {
    if (!routeStart) {
      setRouteError('Set a starting point first — click "Use Map Center" or enter coordinates.');
      return;
    }
    if (routeStops.length < 2) {
      setRouteError('Select at least 2 sites to plan a route.');
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await routeOptimizationApi.optimize(
        routeStops.map(s => s.site_id),
        routeStart.lat, routeStart.lng
      );
      setRouteResult((res as any)?.data || res);
    } catch (err: any) {
      setRouteError(err?.response?.data?.error || 'Failed to compute route');
    } finally {
      setRouteLoading(false);
    }
  }

  function resetRoute() {
    setRouteStops([]);
    setRouteResult(null);
    setRouteError(null);
    setRouteStart(null);
    setManualLat('');
    setManualLng('');
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="🗺️ Live Site Map"
        subtitle="All sites with GPS coordinates on file, colored by this cycle's fuel urgency. Click a pin for site details."
        actions={<CycleSelector cycles={cycles} value={selectedKey} onChange={setSelectedKey} />}
      />

      {/* Legend / urgency filter toggles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {(['critical', 'high', 'medium', 'ok', 'unknown'] as const).map(u => {
          const active = urgencyFilter.includes(u);
          const tok = urgencyTokens[u];
          return (
            <button
              key={u}
              onClick={() => setUrgencyFilter(f => active ? f.filter(x => x !== u) : [...f, u])}
              aria-pressed={active}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${tok.fg}`,
                background: active ? tok.fg : '#fff',
                color: active ? '#fff' : tok.fg,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#fff' : tok.fg }} />
              {u.toUpperCase()} ({counts[u]})
            </button>
          );
        })}
        {clusters.length > 0 && (
          <select
            value={clusterFilter}
            onChange={e => setClusterFilter(e.target.value)}
            aria-label="Filter map by cluster"
            style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
          >
            <option value="">All Clusters</option>
            {clusters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {/* Technician tracking toggle — visible only for the currently
            checked-in technicians (see backend privacy design), and easy
            to hide entirely if a manager just wants the site view. */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
          color: neutral[600], cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <input type="checkbox" checked={showTechnicians} onChange={e => setShowTechnicians(e.target.checked)} />
          🧑‍🔧 Technicians on active jobs ({technicians.length})
        </label>
        <Btn
          variant={routeMode ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => { setRouteMode(m => !m); if (routeMode) resetRoute(); }}
        >
          🗺️ {routeMode ? 'Exit Route Planning' : 'Plan Route'}
        </Btn>
        {/* Search — find a site by name or ID and fly the map to it */}
        <div style={{ position: 'relative', marginLeft: 'auto', width: isNarrow ? '100%' : 260 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search site name or ID…"
            aria-label="Search for a site on the map"
            style={{ width: '100%', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, boxSizing: 'border-box' }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden',
            }}>
              {searchResults.map(s => (
                <button
                  key={s.site_id}
                  onClick={() => pickSearchResult(s)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                    fontSize: 12, border: 'none', borderBottom: `1px solid ${neutral[100]}`,
                    background: '#fff', cursor: 'pointer',
                  }}
                >
                  <strong>{s.name}</strong> <span style={{ color: neutral[400] }}>· {s.site_id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data-quality nudge — 34%+ of a real fleet showing "Unknown" isn't
          just a visual state, it's a real gap: those sites have no fuel
          reading on file at all. Surfaced as an actionable prompt rather
          than a silent gray dot, linking to the two upload paths that
          would close it. */}
      {counts.unknown > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          background: neutral[50], border: `1px solid ${neutral[200]}`, borderRadius: 10,
          padding: '10px 14px', fontSize: 12, color: neutral[700],
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyTokens.unknown.fg, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{counts.unknown} site{counts.unknown === 1 ? '' : 's'}</strong> have no fuel reading on
            file at all — their urgency can't be determined until a tank-level reading or field visit is recorded.
          </span>
          <Btn size="sm" variant="secondary" onClick={() => navigate('/diesel/tank-level')}>Upload Tank Levels</Btn>
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={refetch} />}

      {loading ? (
        <Spinner />
      ) : siteList.length === 0 ? (
        <EmptyState icon="🗺️" title="No sites with coordinates" desc="No sites have Latitude/Longitude on file yet — add coordinates to Site records to see them here." />
      ) : (
        <div style={{ display: 'flex', gap: 16, flexDirection: isNarrow ? 'column' : 'row' }}>
          <div style={{
            flex: 1, height: isNarrow ? 420 : 620, borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${neutral[200]}`,
          }}>
            <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <SiteMarkers sites={filtered} onSiteClick={handleSiteClick} />
              <GeofenceCircles sites={filtered} />
              <FlyToSite target={flyTarget} />
              {showTechnicians && technicians.map(t => (
                <Marker key={t.technician_id} position={[t.lat, t.lng]} icon={TECHNICIAN_ICON}>
                  <Popup>
                    <div style={{ minWidth: 160, fontSize: 13 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>🧑‍🔧 {t.technician_name}</div>
                      {t.site_name && (
                        <div style={{ color: neutral[500], fontSize: 11, marginBottom: 4 }}>
                          On site: {t.site_name}{t.site_id ? ` (${t.site_id})` : ''}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: neutral[400] }}>
                        Updated {minutesAgo(t.last_updated)}m ago
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Route polyline — real road path when OSRM succeeded
                  (solid line, actual roads), or a straight-line
                  fallback between pins when it didn't (dashed —
                  visually distinct on purpose, since a straight line
                  through a river or a building is not a route to
                  actually drive, and looking identical to a real one
                  would be actively misleading). */}
              {routeResult && routeStart && routeResult.route_geometry && (
                <Polyline
                  positions={routeResult.route_geometry}
                  pathOptions={{ color: '#2563EB', weight: 4 }}
                />
              )}
              {routeResult && routeStart && !routeResult.route_geometry && (
                <Polyline
                  positions={[
                    [routeStart.lat, routeStart.lng],
                    ...routeResult.order.map((s: any) => [s.lat, s.lng] as [number, number]),
                  ]}
                  pathOptions={{ color: '#2563EB', weight: 3, dashArray: '6 6' }}
                />
              )}
              {routeStart && (
                <Marker position={[routeStart.lat, routeStart.lng]} icon={buildPinIcon(ink)}>
                  <Popup>Route start</Popup>
                </Marker>
              )}
              <MapInstanceCapture mapRef={mapInstanceRef} />
              {routeMode && <RouteClickCapture onMapClick={(lat, lng) => setRouteStart({ lat, lng })} />}
            </MapContainer>
          </div>

          {/* Site detail panel — replaces the old in-map Leaflet popup.
              Markers are now created imperatively by the clustering
              plugin, which can't bind a declarative React <Popup>, and a
              persistent side panel is a better home for quick actions
              (like "Create Fuel Request") than a small map bubble anyway. */}
          <Card style={{
            width: isNarrow ? '100%' : 300, flexShrink: 0,
            maxHeight: isNarrow ? undefined : 620, overflowY: 'auto',
          }}>
            {routeMode ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, color: ink, marginBottom: 8 }}>Plan a Route</div>
                <div style={{ fontSize: 12, color: neutral[500], marginBottom: 12 }}>
                  Click site pins to add/remove stops. Set a starting point by clicking the map, using the map's center, or entering coordinates directly below.
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyleSmall}>Starting Point</div>
                  {routeStart ? (
                    <div style={{ fontSize: 12, color: neutral[700], marginBottom: 8 }}>
                      {routeStart.lat.toFixed(4)}, {routeStart.lng.toFixed(4)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: neutral[400], marginBottom: 8 }}>Not set</div>
                  )}
                  <Btn
                    variant="primary"
                    size="sm"
                    style={{ width: '100%', marginBottom: 8 }}
                    loading={locatingUser}
                    onClick={() => {
                      if (!navigator.geolocation) {
                        setRouteError('Your browser doesn\'t support location access — use "Use Map Center" or enter coordinates instead.');
                        return;
                      }
                      setLocatingUser(true);
                      setRouteError(null);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setRouteStart({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          setLocatingUser(false);
                        },
                        (err) => {
                          setRouteError(
                            err.code === err.PERMISSION_DENIED
                              ? 'Location access was denied — allow it in your browser settings, or use "Use Map Center" instead.'
                              : 'Could not get your current location — use "Use Map Center" or enter coordinates instead.'
                          );
                          setLocatingUser(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }}
                  >
                    📡 Use My Current Location
                  </Btn>
                  <Btn
                    variant="secondary"
                    size="sm"
                    style={{ width: '100%', marginBottom: 8 }}
                    onClick={() => {
                      const center = mapInstanceRef.current?.getCenter();
                      if (center) setRouteStart({ lat: center.lat, lng: center.lng });
                    }}
                  >
                    📍 Use Map Center
                  </Btn>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number" placeholder="Latitude" value={manualLat}
                      onChange={e => setManualLat(e.target.value)}
                      aria-label="Starting point latitude"
                      style={{ width: '50%', border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '5px 8px', fontSize: 12 }}
                    />
                    <input
                      type="number" placeholder="Longitude" value={manualLng}
                      onChange={e => setManualLng(e.target.value)}
                      aria-label="Starting point longitude"
                      style={{ width: '50%', border: `1px solid ${neutral[200]}`, borderRadius: 6, padding: '5px 8px', fontSize: 12 }}
                    />
                  </div>
                  <Btn
                    variant="secondary"
                    size="sm"
                    style={{ width: '100%', marginTop: 6 }}
                    disabled={!manualLat || !manualLng}
                    onClick={() => {
                      const lat = Number(manualLat), lng = Number(manualLng);
                      if (!isNaN(lat) && !isNaN(lng)) setRouteStart({ lat, lng });
                    }}
                  >
                    Use These Coordinates
                  </Btn>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyleSmall}>Stops ({routeStops.length})</div>
                  {routeStops.length === 0 ? (
                    <div style={{ fontSize: 12, color: neutral[400] }}>No stops selected yet</div>
                  ) : (
                    routeStops.map(s => (
                      <div key={s.site_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
                        <span>{s.name}</span>
                        <button onClick={() => toggleRouteStop(s)} style={{ border: 'none', background: 'none', color: urgencyTokens.critical.fg, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    ))
                  )}
                </div>

                {routeError && (
                  <div style={{ fontSize: 12, color: urgencyTokens.critical.fg, marginBottom: 10 }}>{routeError}</div>
                )}

                <Btn variant="primary" size="sm" style={{ width: '100%', marginBottom: 8 }} onClick={runRouteOptimization} loading={routeLoading}>
                  Optimize Route
                </Btn>
                <Btn variant="secondary" size="sm" style={{ width: '100%' }} onClick={resetRoute}>
                  Clear Selection
                </Btn>

                {routeResult && (
                  <div style={{ marginTop: 16, borderTop: `1px solid ${neutral[100]}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Suggested order · {routeResult.total_distance_km} km
                      {routeResult.total_duration_min != null && ` · ~${routeResult.total_duration_min} min driving`}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, marginBottom: 8, padding: '3px 8px', borderRadius: 6, display: 'inline-block',
                      background: routeResult.used_road_distance ? statusTokens.success.bg : statusTokens.warning.bg,
                      color: routeResult.used_road_distance ? statusTokens.success.text : statusTokens.warning.text,
                    }}>
                      {routeResult.used_road_distance ? '🚗 Real road route' : '⚠ Straight-line estimate — road data unavailable, distances/order may not reflect actual driving conditions'}
                    </div>
                    {routeResult.order.map((s: any, i: number) => (
                      <div key={s.site_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', background: '#2563EB', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                        <span>{s.site_name}</span>
                        <span style={{ color: urgencyTokens[s.urgency as keyof typeof urgencyTokens]?.fg || urgencyTokens.unknown.fg, marginLeft: 'auto', fontSize: 10 }}>{s.urgency.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : !selectedSite ? (
              <div style={{ color: neutral[400], fontSize: 13, textAlign: 'center', padding: '40px 8px' }}>
                Click a pin to see site details here.
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, color: ink, marginBottom: 2 }}>{selectedSite.name}</div>
                <div style={{ color: neutral[500], fontSize: 12, marginBottom: 10 }}>
                  {selectedSite.site_id}{selectedSite.cluster ? ` · ${selectedSite.cluster}` : ''}{selectedSite.region ? ` · ${selectedSite.region}` : ''}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <StatusPill status={selectedSite.urgency === 'ok' ? 'completed' : selectedSite.urgency === 'unknown' ? 'unknown' : selectedSite.urgency === 'critical' ? 'open' : 'pending'} />
                </div>

                {selectedSite.current_fuel_level != null && selectedSite.tank_capacity ? (
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    Fuel: <strong>{selectedSite.current_fuel_level} L</strong> / {selectedSite.tank_capacity} L
                    {' '}({Math.round((selectedSite.current_fuel_level / selectedSite.tank_capacity) * 100)}%)
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: neutral[400], marginBottom: 4 }}>No current fuel reading</div>
                )}

                {/* Data provenance — tells the manager whether this urgency
                    color can actually be trusted right now, and from what
                    source, rather than presenting it as unconditionally current. */}
                {fuelLevelSourceLabel(selectedSite.fuel_level_source) && (
                  <div style={{ fontSize: 11, color: neutral[400], marginBottom: 10 }}>
                    Source: {fuelLevelSourceLabel(selectedSite.fuel_level_source)}
                    {selectedSite.fuel_level_updated_at && ` · Updated ${fmtDate(selectedSite.fuel_level_updated_at)}`}
                  </div>
                )}

                <div style={{ fontSize: 11, color: neutral[400], marginBottom: 14 }}>
                  Geofence radius: {selectedSite.geofence_radius_m}m
                </div>

                {(selectedSite.urgency === 'critical' || selectedSite.urgency === 'high') && (
                  <Btn
                    variant="primary"
                    size="sm"
                    style={{ width: '100%', marginBottom: 8 }}
                    onClick={() => navigate(`/diesel/scheduled?create_for_site=${selectedSite.site_id}`)}
                  >
                    ⛽ Create Fuel Request
                  </Btn>
                )}
                <Btn
                  variant="secondary"
                  size="sm"
                  style={{ width: '100%' }}
                  onClick={() => navigate(`/diesel/reconciliation?site_id=${selectedSite.site_id}`)}
                >
                  View Reconciliation
                </Btn>
              </>
            )}
          </Card>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: neutral[500] }}>
        Showing {filtered.length} of {siteList.length} site(s) with coordinates on file.
        Sites without Latitude/Longitude are not shown — add coordinates to include them.
      </div>
    </div>

  );
}
