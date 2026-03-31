import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { operationsAPI } from '@/api';

const AuditDetailPage: React.FC = () => {
  const { auditId } = useParams();
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        if (!auditId) return;
        const data = await operationsAPI.getAudit(auditId);
        setAudit(data);
      } catch (error) {
        console.error('Failed to load audit:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, [auditId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!audit) {
    return <div className="text-gray-500">Audit not found.</div>;
  }

  const fileBaseUrl = process.env.REACT_APP_FILE_BASE_URL || 'http://localhost:5000';
  const sectionLabels: Record<string, string> = {
    site_details: 'Site Details',
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
    // signatures: 'Signatures',
    general: 'General Photos',
  };

  const sectionOrder = [
    'janitorial',
    'fumigation',
    'generator',
    'ats_system',
    'grid',
    'avr',
    'fuel_tank',
    'air_conditioning',
    'canopy',
    'cable_tray',
    'fence',
    'power_rectifiers',
    'power_batteries',
    'cooling_system_cabinet',
    'solar_batteries',
    'solar_panels',
    'earthing_system',
    'alarms_system',
    // 'signatures',
    'general',
  ];

  const formatValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
    return String(value);
  };

  const getSectionPhotos = (sectionKey: string) => {
    const label = sectionLabels[sectionKey] || sectionKey;
    return (audit.photos || []).filter((photo: any) => {
      const desc = photo?.description || '';
      return desc === sectionKey || desc === label;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Detail</h1>
        <p className="text-gray-500">{audit.site_name || audit.site?.Site_Name} · {audit.site_code || audit.site?.IHS_ID_SITE}</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Region</p>
            <p className="font-medium text-gray-900">{audit.region || audit.site?.Region || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-gray-900 capitalize">{audit.status}</p>
          </div>
          <div>
            <p className="text-gray-500">Created At</p>
            <p className="font-medium text-gray-900">{audit.createdAt ? new Date(audit.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Score</p>
            <p className="font-medium text-gray-900">{typeof audit.total_score === 'number' ? audit.total_score.toFixed(2) : 'N/A'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line">{audit.notes || 'No additional notes'}</p>
      </Card>

      {sectionOrder.map((sectionKey) => {
        const sectionData = audit?.[sectionKey];
        const sectionNotes = audit?.section_notes?.[sectionKey];
        const sectionScore = audit?.section_scores?.[sectionKey];
        const sectionPhotos = getSectionPhotos(sectionKey);

        const dataEntries = sectionData && typeof sectionData === 'object'
          ? Object.entries(sectionData).filter(([, value]) => {
              if (value === null || value === undefined) return false;
              if (typeof value === 'string' && value.trim().length === 0) return false;
              return true;
            })
          : [];

        const hasContent =
          dataEntries.length > 0 ||
          (typeof sectionNotes === 'string' && sectionNotes.trim().length > 0) ||
          sectionPhotos.length > 0 ||
          typeof sectionScore === 'number';

        if (!hasContent) return null;

        return (
          <Card key={sectionKey}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">{sectionLabels[sectionKey] || sectionKey}</h2>
              {typeof sectionScore === 'number' && (
                <div className="text-sm font-semibold text-gray-900 bg-gray-100 border rounded-full px-3 py-1">
                  Score: {sectionScore.toFixed(2)}
                </div>
              )}
            </div>

            {dataEntries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                {dataEntries.map(([fieldKey, value]) => (
                  <div key={fieldKey} className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      {fieldKey.replace(/_/g, ' ')}
                    </p>
                    <p className="text-gray-800 whitespace-pre-line">{formatValue(value)}</p>
                  </div>
                ))}
              </div>
            )}

            {typeof sectionNotes === 'string' && sectionNotes.trim().length > 0 && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{sectionNotes}</p>
              </div>
            )}

            {sectionPhotos.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Photos</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sectionPhotos.map((photo: any, index: number) => (
                    <img
                      key={`${sectionKey}-${index}`}
                      src={photo.url?.startsWith('/uploads') ? `${fileBaseUrl}${photo.url}` : photo.url}
                      alt={photo.description || `Photo ${index + 1}`}
                      className="h-32 w-full object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AuditDetailPage;
