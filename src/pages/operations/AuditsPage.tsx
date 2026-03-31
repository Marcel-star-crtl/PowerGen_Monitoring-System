import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { operationsAPI } from '@/api';
import * as XLSX from 'xlsx';

const AuditsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);

  const initialStatus = searchParams.get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadAudits = async () => {
      try {
        const status = statusFilter === 'all' ? undefined : statusFilter;
        const data = await operationsAPI.listAudits({ status, limit: 500 });
        setAudits(data.data || []);
      } catch (error) {
        console.error('Failed to load audits:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAudits();
  }, [statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (statusFilter === 'all') {
      params.delete('status');
    } else {
      params.set('status', statusFilter);
    }
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      window.history.replaceState(null, '', `?${next}`);
    }
  }, [searchParams, statusFilter]);

  const regions = useMemo(() => {
    const unique = new Set<string>();
    audits.forEach((audit) => {
      const value = audit.region || audit.site?.Region;
      if (value) unique.add(String(value));
    });
    return Array.from(unique).sort();
  }, [audits]);

  const filteredAudits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    return audits.filter((audit) => {
      if (statusFilter !== 'all' && audit.status !== statusFilter) return false;

      if (regionFilter !== 'all') {
        const region = audit.region || audit.site?.Region;
        if (region !== regionFilter) return false;
      }

      if (term) {
        const siteName = (audit.site_name || audit.site?.Site_Name || '').toLowerCase();
        const siteCode = (audit.site_code || audit.site?.IHS_ID_SITE || '').toLowerCase();
        const region = (audit.region || audit.site?.Region || '').toLowerCase();
        if (!siteName.includes(term) && !siteCode.includes(term) && !region.includes(term)) return false;
      }

      if (fromDate || toDate) {
        const createdAt = audit.createdAt ? new Date(audit.createdAt) : undefined;
        if (!createdAt) return false;
        if (fromDate && createdAt < fromDate) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }
      }

      return true;
    });
  }, [audits, dateFrom, dateTo, regionFilter, searchTerm, statusFilter]);

  const exportToExcel = () => {
    const formatCellValue = (value: any): string => {
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.map((item) => formatCellValue(item)).join(' | ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    const sectionLabels: Record<string, string> = {
      janitorial: 'Site Janitorial / Hygiene',
      fumigation: 'Fumigation',
      generator: 'Generator',
      ats_system: 'ATS System',
      grid: 'Grid (ENEO)',
      avr: 'AVR (Automatic Voltage Regulator)',
      fuel_tank: 'Fuel Tank',
      air_conditioning: 'Air Conditioning',
      canopy: 'Canopy Status',
      cable_tray: 'Cable & Cable Tray',
      fence: 'Fence',
      power_rectifiers: 'Power System - Rectifiers',
      power_batteries: 'Power System - Batteries',
      cooling_system_cabinet: 'Cooling System for Power Cabinet',
      solar_batteries: 'Solar System - Batteries',
      solar_panels: 'Solar Panels',
      earthing_system: 'Earthing System',
      alarms_system: 'Alarms System',
    };

    const essentialFields: Record<string, string[]> = {
      janitorial: ['inside_clean', 'outside_perimeter_clean', 'shelter_cleaned'],
      fumigation: ['rat_mice_signs_checked', 'chemicals_applied'],
      generator: ['capacity', 'generator_brand', 'engine_brand', 'running_hours', 'clean_inside_outside'],
      ats_system: ['loose_connections_checked', 'components_checked', 'test_functioning_done'],
      grid: ['grid_index', 'grid_connected_operational', 'grid_stable'],
      avr: ['physical_status_ok', 'input_output_measured'],
      fuel_tank: ['capacity_height_cm', 'capacity_width_cm', 'capacity_depth_cm', 'quantity_found', 'quantity_refueled'],
      air_conditioning: ['ac_type', 'temperature_recorded', 'amps_measured'],
      canopy: ['rust_checked', 'structure_stable', 'foundation_no_cracks'],
      cable_tray: ['rust_checked', 'fixed_firmly', 'cables_tightened'],
      fence: ['fence_type', 'gate_locking_operational', 'razor_wire_available'],
      power_rectifiers: ['modules_found', 'modules_missing', 'output_voltage'],
      power_batteries: ['batteries_count', 'unit_battery_capacity', 'autonomy_estimated'],
      cooling_system_cabinet: ['temperature_checked', 'water_accumulation_signs'],
      solar_batteries: ['batteries_count', 'unit_capacity', 'autonomy_estimated'],
      solar_panels: ['output_checked_before_clean', 'panels_cleaned', 'connections_checked'],
      earthing_system: ['earth_resistance_measured', 'earth_resistance_value', 'less_than_5_ohms'],
      alarms_system: ['alarms_reporting', 'alarms_not_reporting_reason'],
    };

    const rows = filteredAudits.map((audit) => ({
      'Audit ID': audit._id,
      'Site Name': audit.site_name || audit.site?.Site_Name || '',
      'Site ID': audit.site_code || audit.site?.IHS_ID_SITE || '',
      Region: audit.region || audit.site?.Region || '',
      Status: audit.status || '',
      'Sub-Region': audit.sub_region || '',
      'Access Ref': audit.access_ref || '',
      'Time In': audit.time_in || '',
      'Time Out': audit.time_out || '',
      'Total Score': typeof audit.total_score === 'number' ? audit.total_score : '',
      Notes: audit.notes || '',
      'Created At': audit.createdAt ? new Date(audit.createdAt).toLocaleString() : '',
      'Updated At': audit.updatedAt ? new Date(audit.updatedAt).toLocaleString() : '',
      ...Object.entries(essentialFields).reduce((acc, [sectionKey, fields]) => {
        const label = sectionLabels[sectionKey] || sectionKey;
        const sectionData = audit?.[sectionKey] || {};
        fields.forEach((field) => {
          acc[`${label} - ${field.replace(/_/g, ' ')}`] = formatCellValue(sectionData[field]);
        });
        const noteValue = audit?.section_notes?.[sectionKey];
        if (noteValue !== undefined) {
          acc[`Notes - ${label}`] = formatCellValue(noteValue);
        }
        const scoreValue = audit?.section_scores?.[sectionKey];
        if (scoreValue !== undefined) {
          acc[`Score - ${label}`] = formatCellValue(scoreValue);
        }
        return acc;
      }, {} as Record<string, any>),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audits');
    const filename = `operations_audits_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setRegionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Site Audits</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export Excel
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Region</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="all">All</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Site name, ID, region"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAudits.map((audit) => (
                <tr
                  key={audit._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/operations/audits/${audit._id}`)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{audit.site_name || audit.site?.Site_Name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{audit.site_code || audit.site?.IHS_ID_SITE}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{audit.region || audit.site?.Region}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${audit.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {audit.createdAt ? new Date(audit.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditsPage;
