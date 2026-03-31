import React, { useEffect, useState } from 'react';
import { useFuel } from '@/hooks/useFuel';
import { useNotification } from '@/contexts/NotificationContext';
import { FuelConsumption } from '@/types/fuel.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { FuelRequestForm } from '@/components/forms/FuelRequestForm';
import { formatDate, formatFuelLevel } from '@/utils/formatters';
import { FiDroplet, FiCheckCircle, FiXCircle, FiTruck, FiPlus, FiEye } from 'react-icons/fi';
// (removed duplicate imports)
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// ── Workflow step display config ──────────────────────────────────────────────
const WORKFLOW_STEPS: Record<string, { label: string; color: string }> = {
  initiated:      { label: 'Initiated',      color: 'gray'   },
  activated:      { label: 'Activated',      color: 'blue'   },
  fuel_station:   { label: 'Fuel Station',   color: 'purple' },
  checked_in:     { label: 'Checked In',     color: 'indigo' },
  form_opened:    { label: 'Form Opened',    color: 'yellow' },
  completed:      { label: 'Submitted',      color: 'green'  },
  form_submitted: { label: 'Form Submitted', color: 'green'  },
  checked_out:    { label: 'Checked Out',    color: 'teal'   },
  cancelled:      { label: 'Cancelled',      color: 'red'    },
};

const API_BASE = 'http://localhost:5000';
const resolveUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_BASE}${path}`;

// ── Reusable photo thumbnail ──────────────────────────────────────────────────
const PhotoThumb = ({ src, label }: { src: string; label: string }) => {
  const [broken, setBroken] = useState(false);
  const url = resolveUrl(src);
  if (broken) return <p className="text-xs text-gray-400 italic">Photo unavailable</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
    >
      <img
        src={url}
        alt={label}
        className="w-28 h-28 object-cover"
        style={{ background: '#f3f3f3' }}
        onError={() => setBroken(true)}
      />
      <p className="text-xs text-center text-gray-400 py-1">{label}</p>
    </a>
  );
};

// ── Shared label/value row ────────────────────────────────────────────────────
const Field = ({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-sm">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </p>
    </div>
  );
};

const FuelRequestsPage: React.FC = () => {
      // Date range state
      const [exportStart, setExportStart] = useState<string>('');
      const [exportEnd, setExportEnd] = useState<string>('');
    // Export handler
    const handleExportToExcel = () => {
      // Filter requests by date range
      let filtered = requests;
      if (exportStart) {
        filtered = filtered.filter(r => r.record_date && new Date(r.record_date) >= new Date(exportStart));
      }
      if (exportEnd) {
        // Add 1 day to end date to make it inclusive
        const end = new Date(exportEnd);
        end.setDate(end.getDate() + 1);
        filtered = filtered.filter(r => r.record_date && new Date(r.record_date) < end);
      }
      if (filtered.length === 0) {
        showError('No data to export for selected period');
        return;
      }
      try {
        // Prepare data for Excel (include all modal fields)
        const exportData = filtered.map((r: any) => ({
          'Site Name': r.site_name || r.site_id || 'N/A',
          'Site ID': r.site_id || 'N/A',
          'Record Date': r.record_date ? formatDate(r.record_date) : 'N/A',
          'Recorded By': r.recorded_by?.fullName || r.recorded_by || 'N/A',
          'Approval Status': r.approval_status || 'N/A',
          'Workflow Status': r.workflow_status || 'N/A',
          'Requested Qty (L)': r.request_info?.fuel_requested ?? '',
          'Request Reason': r.request_info?.request_reason ?? '',
          'Requested At': r.request_info?.requested_at ? formatDate(r.request_info.requested_at) : '',
          'Urgency': r.request_info?.request_urgency ?? '',
          'Requested By (Info)': r.request_info?.requested_by?.fullName ?? '',
          'Opening Level (L)': r.fuel_data?.opening_level ?? '',
          'Closing Level (L)': r.fuel_data?.closing_level ?? '',
          'Fuel Added (L)': r.fuel_data?.fuel_added ?? '',
          'Fuel Consumed (L)': r.fuel_data?.fuel_consumed ?? '',
          'Tank Capacity (L)': r.fuel_data?.tank_capacity ?? '',
          'Fuel Type': r.fuel_data?.fuel_type ?? '',
          'Dip Stick Before (cm)': r.fuel_data?.dip_stick_before_cm ?? '',
          'Dip Stick After (cm)': r.fuel_data?.dip_stick_after_cm ?? '',
          'Tank Observations': r.fuel_data?.tank_observations ?? '',
          'Fuel Sensor Status': r.fuel_data?.fuel_sensor_status ?? '',
          'Opening Hours': r.runtime_data?.opening_hours ?? '',
          'Closing Hours': r.runtime_data?.closing_hours ?? '',
          'Runtime Hours': r.runtime_data?.runtime_hours ?? '',
          'Truck Plate': r.runtime_data?.truck_plate_number ?? '',
          'Flow Meter Before (L)': r.runtime_data?.truck_flow_meter_before_l ?? '',
          'Flow Meter After (L)': r.runtime_data?.truck_flow_meter_after_l ?? '',
          'Quantity Transferred (L)': r.runtime_data?.quantity_transfer_l ?? '',
          'Departure Time (min)': r.runtime_data?.departure_time_min ?? '',
          'Arrival at Station': r.runtime_data?.arrival_time_station ?? '',
          'Arrival at Site': r.runtime_data?.arrival_time_site ?? '',
          'Transfer Time (min)': r.runtime_data?.transfer_time_min ?? '',
          'Guard Name': r.guard_name ?? '',
          'Guard Number': r.guard_number ?? '',
          'FSE Name': r.fse_name ?? '',
          'Planifier': r.planifier ?? '',
          'Consumption Rate (L/hr)': r.metrics?.consumption_rate ?? '',
          'Cost Estimate': r.metrics?.cost_estimate ?? '',
          'Efficiency Rating': r.metrics?.efficiency_rating ?? '',
          'Anomaly Detected': r.metrics?.anomaly_detected ? 'Yes' : '',
          'Anomaly Reason': r.metrics?.anomaly_reason ?? '',
          'Delivered By': r.delivery_info?.delivered_by ?? '',
          'Delivered Quantity (L)': r.delivery_info?.delivered_quantity ?? '',
          'Delivered At': r.delivery_info?.delivered_at ? formatDate(r.delivery_info.delivered_at) : '',
          'Delivery Notes': r.delivery_info?.delivery_notes ?? '',
          'Comments': r.comments ?? r.notes ?? '',
          'Photos Count': Array.isArray(r.photos) ? r.photos.length : 0,
          'Submitted At': r.submitted_at ? formatDate(r.submitted_at) : '',
          // Optionally: flatten workflow_history, guard_photos, measurement_photos, etc.
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fuel Requests');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Fuel_Requests_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
        success(`Exported ${requests.length} request${requests.length !== 1 ? 's' : ''} to Excel`);
      } catch (err) {
        console.error('Export error:', err);
        showError('Failed to export data to Excel');
      }
    };
  const {
    getPendingRequests,
    approveFuelRequest,
    rejectFuelRequest,
    markDelivered,
    createFuelRequest,
    loading,
  } = useFuel();
  const { success, error: showError } = useNotification();

  const [requests, setRequests]                 = useState<FuelConsumption[]>([]);
  const [selectedRequest, setSelectedRequest]   = useState<FuelConsumption | null>(null);
  const [showModal, setShowModal]               = useState(false);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalType, setModalType]               = useState<'approve' | 'reject' | 'deliver'>('approve');
  const [deliveryData, setDeliveryData]         = useState({ delivered_quantity: '', delivered_by: '', notes: '' });
  const [rejectionReason, setRejectionReason]   = useState('');
  const [submitting, setSubmitting]             = useState(false);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const result = await getPendingRequests({ page: 1, limit: 50 });
      setRequests(result.data);
    } catch {
      showError('Failed to load fuel requests');
    }
  };

  const handleCreateRequest = async (data: any) => {
    setSubmitting(true);
    try {
      await createFuelRequest(data);
      success('Fuel request created successfully!');
      setShowCreateModal(false);
      loadRequests();
    } catch {
      showError('Failed to create fuel request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approveFuelRequest(selectedRequest._id, 'Approved for delivery');
      success('Fuel request approved!');
      setShowModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch {
      showError('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }
    try {
      await rejectFuelRequest(selectedRequest._id, rejectionReason);
      success('Fuel request rejected');
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch {
      showError('Failed to reject request');
    }
  };

  const handleDeliver = async () => {
    if (!selectedRequest || !deliveryData.delivered_quantity || !deliveryData.delivered_by) {
      showError('Please fill all required fields');
      return;
    }
    try {
      await markDelivered(selectedRequest._id, {
        delivered_quantity: parseFloat(deliveryData.delivered_quantity),
        delivered_by:       deliveryData.delivered_by,
        notes:              deliveryData.notes,
      });
      success('Fuel delivery recorded!');
      setShowModal(false);
      setSelectedRequest(null);
      setDeliveryData({ delivered_quantity: '', delivered_by: '', notes: '' });
      loadRequests();
    } catch {
      showError('Failed to record delivery');
    }
  };

  const openModal = (req: FuelConsumption, type: 'approve' | 'reject' | 'deliver') => {
    setSelectedRequest(req);
    setModalType(type);
    setShowModal(true);
  };

  const openDetailsModal = (req: FuelConsumption) => {
    setSelectedRequest(req);
    setShowDetailsModal(true);
  };

  const getUrgencyColor = (urgency: string) =>
    ({ low: 'gray', medium: 'blue', high: 'orange', critical: 'red' } as Record<string, any>)[urgency] ?? 'gray';

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Details modal inner component ─────────────────────────────────────────
  // Extracted as a named inner component so hooks (useState for PhotoThumb) work correctly
  const DetailsContent = ({ r }: { r: FuelConsumption }) => {
    const f  = r.fuel_data;
    const rt = r.runtime_data;
    const ri = r.request_info;

    // Workflow history sorted oldest → newest
    const wh = Array.isArray(r.workflow_history)
      ? [...r.workflow_history].sort(
          (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      : [];

    // Section guards — only render a section if at least one value is present
    const hasDipStick      = f?.dip_stick_before_cm != null || f?.dip_stick_after_cm != null;
    const hasTankExtra     = f?.tank_observations   || f?.fuel_sensor_status;
    const hasTruckData     =
      rt?.truck_plate_number           ||
      rt?.truck_flow_meter_before_l != null ||
      rt?.truck_flow_meter_after_l  != null;
    const hasRuntimeMeters =
      rt?.closing_hours != null || rt?.opening_hours != null || rt?.runtime_hours != null;
    const hasPersonnel     =
      r.guard_name || r.guard_number || (r as any).fse_name || (r as any).planifier;
    const hasRequestInfo   =
      ri?.fuel_requested || ri?.request_reason || ri?.request_urgency;
    const hasDelivery      =
      r.delivery_info?.delivered      ||
      r.delivery_info?.delivered_quantity ||
      r.delivery_info?.delivered_by;
    const hasMetrics       = r.metrics != null;

    // Photo arrays — normalised to string[]
    const mainPhotos        = Array.isArray(r.photos)                      ? r.photos as string[]                      : [];
    const guardPhotos       = Array.isArray((r as any).guard_photos)       ? (r as any).guard_photos as string[]       : [];
    const measurementPhotos = Array.isArray((r as any).measurement_photos) ? (r as any).measurement_photos as string[] : [];
    const hasPhotos         = mainPhotos.length > 0 || guardPhotos.length > 0 || measurementPhotos.length > 0;

    return (
      <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1 text-gray-800">

        {/* ── 1. Record Header ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Site Name"   value={r.site_name || r.site_id} />
          <Field label="Site ID"     value={r.site_id} />
          <Field label="Record Date" value={formatDate(r.record_date)} />
          <Field label="Recorded By" value={(r.recorded_by as any)?.fullName} />
          <div>
            <p className="text-xs text-gray-500">Approval Status</p>
            <Badge variant={
              r.approval_status === 'approved'  ? 'green'  :
              r.approval_status === 'rejected'  ? 'red'    :
              r.approval_status === 'fulfilled' ? 'teal'   : 'yellow'
            }>
              {r.approval_status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500">Workflow Status</p>
            <Badge variant={
              r.workflow_status === 'completed'   ? 'green'  :
              r.workflow_status === 'checked_out' ? 'teal'   :
              r.workflow_status === 'cancelled'   ? 'red'    : 'blue'
            }>
              {r.workflow_status || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* ── 2. Workflow Timeline ───────────────────────────────────────── */}
        {wh.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Workflow Timeline</h3>
            <ol className="relative border-l border-gray-200 ml-3 space-y-4">
              {wh.map((step: any, idx: number) => {
                const cfg  = WORKFLOW_STEPS[step.status] || { label: step.status, color: 'gray' };
                const meta = step.meta || {};
                return (
                  <li key={step._id || idx} className="ml-4">
                    <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-${cfg.color}-500`} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={cfg.color as any}>{cfg.label}</Badge>
                      <span className="text-xs text-gray-400">
                        {step.timestamp ? new Date(step.timestamp).toLocaleString() : '—'}
                      </span>
                    </div>
                    {Object.keys(meta).length > 0 && (
                      <div className="mt-1 ml-1 text-xs text-gray-500 space-y-1">
                        {meta.fuelQty     != null && <p>Fuel Qty: <span className="font-medium text-gray-700">{meta.fuelQty} L</span></p>}
                        {meta.activatedAt       && <p>Activated at: <span className="font-medium text-gray-700">{new Date(meta.activatedAt).toLocaleString()}</span></p>}
                        {meta.fuelStationAt     && <p>At station: <span className="font-medium text-gray-700">{new Date(meta.fuelStationAt).toLocaleString()}</span></p>}
                        {meta.checkedInAt       && <p>Checked in: <span className="font-medium text-gray-700">{new Date(meta.checkedInAt).toLocaleString()}</span></p>}
                        {meta.formOpenedAt      && <p>Form opened: <span className="font-medium text-gray-700">{new Date(meta.formOpenedAt).toLocaleString()}</span></p>}
                        {meta.submittedAt       && <p>Submitted: <span className="font-medium text-gray-700">{new Date(meta.submittedAt).toLocaleString()}</span></p>}
                        {meta.checkedOutAt      && <p>Checked out: <span className="font-medium text-gray-700">{new Date(meta.checkedOutAt).toLocaleString()}</span></p>}
                        {meta.action            && <p>Action: <span className="font-medium text-gray-700">{meta.action}</span></p>}
                        {meta.photo && <PhotoThumb src={meta.photo} label={cfg.label} />}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* ── 3. Fuel Data ───────────────────────────────────────────────── */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 text-sm">Fuel Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Level" value={f?.opening_level} suffix="L" />
            <Field label="Closing Level" value={f?.closing_level} suffix="L" />
            <Field label="Fuel Added"    value={f?.fuel_added}    suffix="L" />
            <Field label="Fuel Consumed" value={f?.fuel_consumed} suffix="L" />
            <Field label="Tank Capacity" value={f?.tank_capacity} suffix="L" />
            <Field label="Fuel Type"     value={f?.fuel_type} />
          </div>
        </div>

        {/* ── 4. Dip Stick ───────────────────────────────────────────────── */}
        {hasDipStick && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Dip Stick Measurements</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Before (cm)" value={f?.dip_stick_before_cm} />
              <Field label="After (cm)"  value={f?.dip_stick_after_cm} />
            </div>
          </div>
        )}

        {/* ── 5. Tank Observations & Sensor ──────────────────────────────── */}
        {hasTankExtra && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Tank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tank Observations"  value={f?.tank_observations} />
              <Field label="Fuel Sensor Status" value={f?.fuel_sensor_status} />
            </div>
          </div>
        )}

        {/* ── 6. Meter Readings ──────────────────────────────────────────── */}
        {hasRuntimeMeters && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Meter Readings</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opening Hours" value={rt?.opening_hours} suffix="hrs" />
              <Field label="Closing Hours" value={rt?.closing_hours} suffix="hrs" />
              <Field label="Runtime Hours" value={rt?.runtime_hours} suffix="hrs" />
            </div>
          </div>
        )}

        {/* ── 7. Truck & Transfer ────────────────────────────────────────── */}
        {hasTruckData && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Truck & Transfer</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Truck Plate"             value={rt?.truck_plate_number} />
              <Field label="Flow Meter Before (L)"   value={rt?.truck_flow_meter_before_l} />
              <Field label="Flow Meter After (L)"    value={rt?.truck_flow_meter_after_l} />
              <Field label="Quantity Transferred (L)" value={rt?.quantity_transfer_l} />
              <Field label="Departure Time (min)"    value={rt?.departure_time_min} />
              <Field label="Arrival at Station"      value={rt?.arrival_time_station} />
              <Field label="Arrival at Site"         value={rt?.arrival_time_site} />
              <Field label="Transfer Time (min)"     value={rt?.transfer_time_min} />
            </div>
          </div>
        )}

        {/* ── 8. Personnel ───────────────────────────────────────────────── */}
        {hasPersonnel && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Personnel</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Guard Name"   value={r.guard_name} />
              <Field label="Guard Number" value={r.guard_number} />
              <Field label="FSE Name"     value={(r as any).fse_name} />
              <Field label="Planifier"    value={(r as any).planifier} />
            </div>
          </div>
        )}

        {/* ── 9. Request Info ────────────────────────────────────────────── */}
        {hasRequestInfo && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Request Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuel Requested" value={ri?.fuel_requested} suffix="L" />
              <Field label="Request Reason" value={ri?.request_reason} />
              <Field
                label="Requested At"
                value={ri?.requested_at ? formatDate(ri.requested_at) : undefined}
              />
              <div>
                <p className="text-xs text-gray-500">Urgency</p>
                <Badge variant={getUrgencyColor(ri?.request_urgency || 'medium')}>
                  {(ri?.request_urgency || 'medium').toUpperCase()}
                </Badge>
              </div>
              {(ri as any)?.requested_by?.fullName && (
                <Field label="Requested By" value={(ri as any).requested_by.fullName} />
              )}
            </div>
          </div>
        )}

        {/* ── 10. Metrics ────────────────────────────────────────────────── */}
        {hasMetrics && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Consumption Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumption Rate" value={r.metrics?.consumption_rate} suffix="L/hr" />
              <Field label="Cost Estimate"    value={r.metrics?.cost_estimate} />
              <div>
                <p className="text-xs text-gray-500">Efficiency Rating</p>
                <Badge variant={
                  r.metrics?.efficiency_rating === 'excellent' ? 'green'  :
                  r.metrics?.efficiency_rating === 'good'      ? 'blue'   :
                  r.metrics?.efficiency_rating === 'fair'      ? 'yellow' :
                  r.metrics?.efficiency_rating === 'poor'      ? 'orange' : 'red'
                }>
                  {r.metrics?.efficiency_rating}
                </Badge>
              </div>
              {r.metrics?.anomaly_detected && (
                <div>
                  <p className="text-xs text-gray-500">Anomaly</p>
                  <Badge variant="red">Detected</Badge>
                  {r.metrics?.anomaly_reason && (
                    <p className="text-xs text-red-500 mt-1">{r.metrics.anomaly_reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 11. Delivery Info ──────────────────────────────────────────── */}
        {hasDelivery && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm">Delivery Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Delivered By"       value={r.delivery_info?.delivered_by} />
              <Field label="Delivered Quantity" value={r.delivery_info?.delivered_quantity} suffix="L" />
              <Field
                label="Delivered At"
                value={r.delivery_info?.delivered_at ? formatDate(r.delivery_info.delivered_at) : undefined}
              />
              <Field label="Delivery Notes" value={r.delivery_info?.delivery_notes} />
            </div>
          </div>
        )}

        {/* ── 12. Comments ───────────────────────────────────────────────── */}
        {(r.comments || (r as any).notes) && (
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">Comments / Notes</p>
            <p className="font-medium text-sm mt-1">{r.comments ?? (r as any).notes}</p>
          </div>
        )}

        {/* ── 13. Photos — three separate labelled groups ─────────────────── */}
        {hasPhotos && (
          <div className="border-t pt-4 space-y-4">
            {mainPhotos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">
                  Documentation Photos ({mainPhotos.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {mainPhotos.map((url, i) => (
                    <PhotoThumb key={i} src={url} label={`Photo ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}

            {guardPhotos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">
                  Guard Photos ({guardPhotos.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {guardPhotos.map((url, i) => (
                    <PhotoThumb key={i} src={url} label={`Guard ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}

            {measurementPhotos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">
                  Measurement Photos ({measurementPhotos.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {measurementPhotos.map((url, i) => (
                    <PhotoThumb key={i} src={url} label={`Measurement ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 14. Action buttons ─────────────────────────────────────────── */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {r.approval_status === 'pending' && (
            <>
              <Button
                onClick={() => { setShowDetailsModal(false); openModal(r, 'reject'); }}
                variant="danger"
              >
                Reject
              </Button>
              <Button
                onClick={() => { setShowDetailsModal(false); openModal(r, 'approve'); }}
                variant="success"
              >
                Approve
              </Button>
            </>
          )}
          {r.approval_status === 'approved' && (
            <Button
              onClick={() => { setShowDetailsModal(false); openModal(r, 'deliver'); }}
              variant="primary"
            >
              Mark as Delivered
            </Button>
          )}
          <Button onClick={() => setShowDetailsModal(false)} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    );
  };

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Requests</h1>
        <div className="flex items-center space-x-3">
          <Badge variant="blue">{requests.length} Pending</Badge>
          {/* Date range filter */}
          <input
            type="date"
            value={exportStart}
            onChange={e => setExportStart(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            style={{ minWidth: 120 }}
            placeholder="Start date"
          />
          <span className="mx-1">to</span>
          <input
            type="date"
            value={exportEnd}
            onChange={e => setExportEnd(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            style={{ minWidth: 120 }}
            placeholder="End date"
          />
          <Button onClick={handleExportToExcel} variant="primary">
            <FiDownload className="mr-2" />
            Export to Excel
          </Button>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            <FiPlus className="mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      {/* Cards */}
      {requests.length === 0 ? (
        <EmptyState
          icon={<FiDroplet className="h-16 w-16 text-gray-400" />}
          title="No pending fuel requests"
          description="All fuel requests have been processed"
          actionLabel="Create New Request"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => {
            const fuelInfo = formatFuelLevel(
              request.fuel_data.closing_level,
              request.fuel_data.tank_capacity,
            );
            return (
              <Card key={request._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {request.site_name || request.site_id}
                      </h3>
                      <p className="text-sm text-gray-500">{request.site_id}</p>
                    </div>
                    <Badge variant={getUrgencyColor(request.request_info?.request_urgency || 'medium')}>
                      {(request.request_info?.request_urgency || 'medium').toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Current Fuel Level</p>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${
                          fuelInfo.color === 'red'    ? 'bg-red-500'    :
                          fuelInfo.color === 'orange' ? 'bg-orange-500' :
                          fuelInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${fuelInfo.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium mt-1">{fuelInfo.text}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fuel Added:</span>
                      <span className="font-medium">{request.fuel_data?.fuel_added ?? '—'} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days Until Empty:</span>
                      <span className="font-medium">{(request as any).days_until_empty ?? 'N/A'}</span>
                    </div>
                  </div>

                  {request.comments && (
                    <div>
                      <p className="text-sm text-gray-500">Comments:</p>
                      <p className="text-sm text-gray-900 line-clamp-2">{request.comments}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button onClick={() => openDetailsModal(request)} variant="ghost" size="sm" fullWidth>
                      <FiEye className="mr-1" />
                      View Details
                    </Button>
                    {request.approval_status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => openModal(request, 'approve')} variant="success" size="sm" fullWidth>
                          <FiCheckCircle className="mr-1" />Approve
                        </Button>
                        <Button onClick={() => openModal(request, 'reject')} variant="danger" size="sm" fullWidth>
                          <FiXCircle className="mr-1" />Reject
                        </Button>
                      </div>
                    )}
                    {request.approval_status === 'approved' && (
                      <Button onClick={() => openModal(request, 'deliver')} variant="primary" size="sm" fullWidth>
                        <FiTruck className="mr-1" />Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Request Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !submitting && setShowCreateModal(false)}
        title="Create Fuel Request"
        size="lg"
      >
        <FuelRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowCreateModal(false)}
          loading={submitting}
          showSiteSelector={true}
        />
      </Modal>

      {/* ── Details Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedRequest(null); }}
        title="Fuel Request Details"
        size="lg"
      >
        {selectedRequest && <DetailsContent r={selectedRequest} />}
      </Modal>

      {/* ── Action Modal (Approve / Reject / Deliver) ────────────────────── */}
      {showModal && selectedRequest && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
            setDeliveryData({ delivered_quantity: '', delivered_by: '', notes: '' });
            setRejectionReason('');
          }}
          title={
            modalType === 'approve' ? 'Approve Fuel Request' :
            modalType === 'reject'  ? 'Reject Fuel Request'  :
                                      'Record Fuel Delivery'
          }
          size="md"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Site</p>
              <p className="font-medium">{selectedRequest.site_name || selectedRequest.site_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fuel Added</p>
              <p className="font-medium">{selectedRequest.fuel_data?.fuel_added ?? '—'} L</p>
            </div>

            {modalType === 'approve' && (
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                <Button onClick={handleApprove} variant="success" loading={loading}>Approve</Button>
              </div>
            )}

            {modalType === 'reject' && (
              <>
                <Textarea
                  label="Rejection Reason *"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                  required
                  fullWidth
                />
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                  <Button onClick={handleReject} variant="danger" loading={loading}>Reject</Button>
                </div>
              </>
            )}

            {modalType === 'deliver' && (
              <>
                <Input
                  label="Delivered Quantity (L) *"
                  type="number"
                  value={deliveryData.delivered_quantity}
                  onChange={(e) => setDeliveryData({ ...deliveryData, delivered_quantity: e.target.value })}
                  required
                  fullWidth
                />
                <Input
                  label="Delivered By *"
                  type="text"
                  value={deliveryData.delivered_by}
                  onChange={(e) => setDeliveryData({ ...deliveryData, delivered_by: e.target.value })}
                  placeholder="Driver / Transport team name"
                  required
                  fullWidth
                />
                <Textarea
                  label="Delivery Notes"
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                  rows={3}
                  fullWidth
                />
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                  <Button onClick={handleDeliver} variant="primary" loading={loading}>Record Delivery</Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FuelRequestsPage;












// import React, { useEffect, useState } from 'react';
// import { useFuel } from '@/hooks/useFuel';
// import { useNotification } from '@/contexts/NotificationContext';
// import { FuelConsumption } from '@/types/fuel.types';
// import { Card } from '@/components/common/Card';
// import { Badge } from '@/components/common/Badge';
// import { Button } from '@/components/common/Button';
// import { Modal } from '@/components/common/Modal';
// import { Input } from '@/components/common/Input';
// import { Textarea } from '@/components/common/Textarea';
// import { Spinner } from '@/components/common/Spinner';
// import { EmptyState } from '@/components/common/EmptyState';
// import { FuelRequestForm } from '@/components/forms/FuelRequestForm';
// import { formatDate, formatFuelLevel } from '@/utils/formatters';
// import { FiDroplet, FiCheckCircle, FiXCircle, FiTruck, FiPlus, FiEye } from 'react-icons/fi';

// const FuelRequestsPage: React.FC = () => {
//   const {
//     getPendingRequests,
//     approveFuelRequest,
//     rejectFuelRequest,
//     markDelivered,
//     createFuelRequest,
//     loading,
//   } = useFuel();
//   const { success, error: showError } = useNotification();

//   const [requests, setRequests] = useState<FuelConsumption[]>([]);
//   const [selectedRequest, setSelectedRequest] = useState<FuelConsumption | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [modalType, setModalType] = useState<'approve' | 'reject' | 'deliver'>('approve');
//   const [deliveryData, setDeliveryData] = useState({
//     delivered_quantity: '',
//     delivered_by: '',
//     notes: '',
//   });
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     loadRequests();
//   }, []);

//   const loadRequests = async () => {
//     try {
//       const result = await getPendingRequests({ page: 1, limit: 50 });
//       setRequests(result.data);
//     } catch (err) {
//       showError('Failed to load fuel requests');
//     }
//   };

//   const handleCreateRequest = async (data: any) => {
//     setSubmitting(true);
//     try {
//       await createFuelRequest(data);
//       success('Fuel request created successfully!');
//       setShowCreateModal(false);
//       loadRequests();
//     } catch (err) {
//       showError('Failed to create fuel request');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleApprove = async () => {
//     if (!selectedRequest) return;

//     try {
//       await approveFuelRequest(selectedRequest._id, 'Approved for delivery');
//       success('Fuel request approved!');
//       setShowModal(false);
//       setSelectedRequest(null);
//       loadRequests();
//     } catch (err) {
//       showError('Failed to approve request');
//     }
//   };

//   const handleReject = async () => {
//     if (!selectedRequest || !rejectionReason.trim()) {
//       showError('Please provide a rejection reason');
//       return;
//     }

//     try {
//       await rejectFuelRequest(selectedRequest._id, rejectionReason);
//       success('Fuel request rejected');
//       setShowModal(false);
//       setSelectedRequest(null);
//       setRejectionReason('');
//       loadRequests();
//     } catch (err) {
//       showError('Failed to reject request');
//     }
//   };

//   const handleDeliver = async () => {
//     if (!selectedRequest || !deliveryData.delivered_quantity || !deliveryData.delivered_by) {
//       showError('Please fill all required fields');
//       return;
//     }

//     try {
//       await markDelivered(selectedRequest._id, {
//         delivered_quantity: parseFloat(deliveryData.delivered_quantity),
//         delivered_by: deliveryData.delivered_by,
//         notes: deliveryData.notes,
//       });
//       success('Fuel delivery recorded!');
//       setShowModal(false);
//       setSelectedRequest(null);
//       setDeliveryData({ delivered_quantity: '', delivered_by: '', notes: '' });
//       loadRequests();
//     } catch (err) {
//       showError('Failed to record delivery');
//     }
//   };

//   const DetailField = ({ label, value, suffix = '' }: {
//     label: string;
//     value: string | number | null | undefined;
//     suffix?: string;
//   }) => {
//     if (value === undefined || value === null || value === '') return null;
//     return (
//       <div>
//         <p className="text-sm text-gray-500">{label}</p>
//         <p className="font-medium">{value}{suffix ? ` ${suffix}` : ''}</p>
//       </div>
//     );
//   };

//   const openModal = (request: FuelConsumption, type: 'approve' | 'reject' | 'deliver') => {
//     setSelectedRequest(request);
//     setModalType(type);
//     setShowModal(true);
//   };

//   const openDetailsModal = (request: FuelConsumption) => {
//     setSelectedRequest(request);
//     setShowDetailsModal(true);
//   };

//   const getUrgencyColor = (urgency: string) => {
//     const colors: Record<string, any> = {
//       low: 'gray',
//       medium: 'blue',
//       high: 'orange',
//       critical: 'red',
//     };
//     return colors[urgency] || 'gray';
//   };

//   if (loading && requests.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Spinner size="lg" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Fuel Requests</h1>
//         <div className="flex items-center space-x-3">
//           <Badge variant="blue">{requests.length} Pending</Badge>
//           <Button onClick={() => setShowCreateModal(true)} variant="primary">
//             <FiPlus className="mr-2" />
//             Create Request
//           </Button>
//         </div>
//       </div>

//       {requests.length === 0 ? (
//         <EmptyState
//           icon={<FiDroplet className="h-16 w-16 text-gray-400" />}
//           title="No pending fuel requests"
//           description="All fuel requests have been processed"
//           actionLabel="Create New Request"
//           onAction={() => setShowCreateModal(true)}
//         />
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {requests.map((request) => {
//             const fuelInfo = formatFuelLevel(
//               request.fuel_data.closing_level,
//               request.fuel_data.tank_capacity
//             );

//             return (
//               <Card key={request._id} className="hover:shadow-lg transition-shadow">
//                 <div className="space-y-4">
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-gray-900 line-clamp-1">
//                         {request.site_details?.Site_Name || request.site_id}
//                       </h3>
//                       <p className="text-sm text-gray-500">{request.site_id}</p>
//                     </div>
//                     <Badge variant={getUrgencyColor(request.request_info?.request_urgency || 'medium')}>
//                       {request.request_info?.request_urgency?.toUpperCase()}
//                     </Badge>
//                   </div>

//                   <div>
//                     <p className="text-sm text-gray-500 mb-2">Current Fuel Level</p>
//                     <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
//                       <div
//                         className={`absolute inset-y-0 left-0 ${
//                           fuelInfo.color === 'red' ? 'bg-red-500' : 
//                           fuelInfo.color === 'orange' ? 'bg-orange-500' : 
//                           fuelInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
//                         }`}
//                         style={{ width: `${fuelInfo.percentage}%` }}
//                       />
//                     </div>
//                     <p className="text-sm font-medium mt-1">{fuelInfo.text}</p>
//                   </div>

//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-gray-500">Requested:</span>
//                       <span className="font-medium">
//                         {request.request_info?.fuel_requested} L
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-500">Days Until Empty:</span>
//                       <span className="font-medium">
//                         {request.days_until_empty || 'N/A'}
//                       </span>
//                     </div>
//                   </div>

//                   {request.request_info?.request_reason && (
//                     <div>
//                       <p className="text-sm text-gray-500">Reason:</p>
//                       <p className="text-sm text-gray-900 line-clamp-2">
//                         {request.request_info.request_reason}
//                       </p>
//                     </div>
//                   )}

//                   <div className="space-y-2">
//                     <Button
//                       onClick={() => openDetailsModal(request)}
//                       variant="ghost"
//                       size="sm"
//                       fullWidth
//                     >
//                       <FiEye className="mr-1" />
//                       View Details
//                     </Button>

//                     {request.approval_status === 'pending' && (
//                       <div className="grid grid-cols-2 gap-2">
//                         <Button
//                           onClick={() => openModal(request, 'approve')}
//                           variant="success"
//                           size="sm"
//                           fullWidth
//                         >
//                           <FiCheckCircle className="mr-1" />
//                           Approve
//                         </Button>
//                         <Button
//                           onClick={() => openModal(request, 'reject')}
//                           variant="danger"
//                           size="sm"
//                           fullWidth
//                         >
//                           <FiXCircle className="mr-1" />
//                           Reject
//                         </Button>
//                       </div>
//                     )}

//                     {request.approval_status === 'approved' && (
//                       <Button
//                         onClick={() => openModal(request, 'deliver')}
//                         variant="primary"
//                         size="sm"
//                         fullWidth
//                       >
//                         <FiTruck className="mr-1" />
//                         Mark as Delivered
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* Create Request Modal */}
//       <Modal
//         isOpen={showCreateModal}
//         onClose={() => !submitting && setShowCreateModal(false)}
//         title="Create Fuel Request"
//         size="lg">
//         <FuelRequestForm
//           onSubmit={handleCreateRequest}
//           onCancel={() => setShowCreateModal(false)}
//           loading={submitting}
//           showSiteSelector={true}
//         />
//       </Modal>

//       {/* Details Modal */}
//       {/* Details Modal */}
// <Modal
//   isOpen={showDetailsModal}
//   onClose={() => {
//     setShowDetailsModal(false);
//     setSelectedRequest(null);
//   }}
//   title="Fuel Request Details"
//   size="lg"
// >
//   {selectedRequest && (() => {
//     const f  = selectedRequest.fuel_data;
//     const r  = selectedRequest.runtime_data;
//     const ri = selectedRequest.request_info;
//     const photos = selectedRequest.photos;
 
//     // Section visibility guards
//     const hasTankDimensions = f?.tank_length_cm || f?.tank_height_cm || f?.tank_width_cm || f?.tank_observations || f?.fuel_sensor_status;
//     const hasDipStick       = f?.dip_stick_before_cm || f?.dip_stick_after_cm;
//     const hasTruckInfo      = r?.truck_flow_meter_before_l || r?.truck_flow_meter_after_l || r?.truck_plate_number || r?.quantity_transfer_l;
//     const hasTiming         = r?.departure_time_min || r?.arrival_time_station || r?.arrival_time_site || r?.transfer_time_min;
//     const hasRuntimeMeters  = r?.opening_hours || r?.closing_hours || r?.runtime_hours;
//     const hasPersonnel      = selectedRequest.fse_name || selectedRequest.planifier || selectedRequest.guard_name || selectedRequest.guard_number;
 
//     return (
//       <div className="space-y-5">
 
//         {/* ── Header info ───────────────────────────────────────────────── */}
//         <div className="grid grid-cols-2 gap-4">
//           <DetailField label="Site"         value={selectedRequest.site_details?.Site_Name || selectedRequest.site_id} />
//           <DetailField label="Site ID"      value={selectedRequest.site_id} />
//           <DetailField label="Region"       value={selectedRequest.site_details?.Region} />
//           <div>
//             <p className="text-sm text-gray-500">Status</p>
//             <Badge variant={
//               selectedRequest.approval_status === 'approved'  ? 'green'  :
//               selectedRequest.approval_status === 'rejected'  ? 'red'    : 'yellow'
//             }>
//               {selectedRequest.approval_status}
//             </Badge>
//           </div>
//           <div>
//             <p className="text-sm text-gray-500">Urgency</p>
//             <Badge variant={getUrgencyColor(ri?.request_urgency || 'medium')}>
//               {(ri?.request_urgency || 'medium').toUpperCase()}
//             </Badge>
//           </div>
//           <DetailField label="Record Date"     value={formatDate(selectedRequest.record_date)} />
//           <DetailField label="Fuel Requested"  value={ri?.fuel_requested}  suffix="L" />
//           <DetailField label="Request Reason"  value={ri?.request_reason} />
//         </div>
 
//         {/* ── Fuel Information ─────────────────────────────────────────── */}
//         <div className="border-t pt-4">
//           <h3 className="font-semibold mb-3">Fuel Information</h3>
//           <div className="grid grid-cols-2 gap-4">
//             <DetailField label="Opening Level"  value={f?.opening_level}  suffix="L" />
//             <DetailField label="Closing Level"  value={f?.closing_level}  suffix="L" />
//             <DetailField label="Fuel Added"     value={f?.fuel_added}     suffix="L" />
//             <DetailField label="Fuel Consumed"  value={f?.fuel_consumed}  suffix="L" />
//             <DetailField label="Tank Capacity"  value={f?.tank_capacity}  suffix="L" />
//             <DetailField label="Fuel Type"      value={f?.fuel_type} />
//           </div>
//         </div>
 
//         {/* ── Tank Dimensions (only if any field present) ───────────────── */}
//         {hasTankDimensions && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Tank Details</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="Tank Length (cm)"   value={f?.tank_length_cm} />
//               <DetailField label="Tank Height (cm)"   value={f?.tank_height_cm} />
//               <DetailField label="Tank Width (cm)"    value={f?.tank_width_cm} />
//               <DetailField label="Tank Observations"  value={f?.tank_observations} />
//               <DetailField label="Fuel Sensor Status" value={f?.fuel_sensor_status} />
//             </div>
//           </div>
//         )}
 
//         {/* ── Dip Stick ─────────────────────────────────────────────────── */}
//         {hasDipStick && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Dip Stick Measurements</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="Before (cm)" value={f?.dip_stick_before_cm} />
//               <DetailField label="After (cm)"  value={f?.dip_stick_after_cm} />
//             </div>
//           </div>
//         )}
 
//         {/* ── Meter Readings ─────────────────────────────────────────────── */}
//         {hasRuntimeMeters && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Meter Readings</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="Opening Hours"  value={r?.opening_hours}  suffix="hrs" />
//               <DetailField label="Closing Hours"  value={r?.closing_hours}  suffix="hrs" />
//               <DetailField label="Runtime Hours"  value={r?.runtime_hours}  suffix="hrs" />
//             </div>
//           </div>
//         )}
 
//         {/* ── Truck & Flow Meter ────────────────────────────────────────── */}
//         {hasTruckInfo && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Truck & Transfer</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="Flow Meter Before (L)" value={r?.truck_flow_meter_before_l} />
//               <DetailField label="Flow Meter After (L)"  value={r?.truck_flow_meter_after_l} />
//               <DetailField label="Truck Plate"           value={r?.truck_plate_number} />
//               <DetailField label="Quantity Transfer (L)" value={r?.quantity_transfer_l} />
//             </div>
//           </div>
//         )}
 
//         {/* ── Timing ───────────────────────────────────────────────────── */}
//         {hasTiming && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Timing</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="Departure Time (min)"    value={r?.departure_time_min} />
//               <DetailField label="Arrival at Station"      value={r?.arrival_time_station} />
//               <DetailField label="Arrival at Site"         value={r?.arrival_time_site} />
//               <DetailField label="Transfer Time (min)"     value={r?.transfer_time_min} />
//             </div>
//           </div>
//         )}
 
//         {/* ── Personnel ─────────────────────────────────────────────────── */}
//         {hasPersonnel && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Personnel</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <DetailField label="FSE Name"     value={selectedRequest.fse_name} />
//               <DetailField label="Planifier"    value={selectedRequest.planifier} />
//               <DetailField label="Guard Name"   value={selectedRequest.guard_name} />
//               <DetailField label="Guard Number" value={selectedRequest.guard_number} />
//             </div>
//           </div>
//         )}
 
//         {/* ── Comments ─────────────────────────────────────────────────── */}
//         {(selectedRequest.comments || selectedRequest.notes) && (
//           <div className="border-t pt-4">
//             <p className="text-sm text-gray-500">Comments</p>
//             <p className="font-medium">{selectedRequest.comments ?? selectedRequest.notes}</p>
//           </div>
//         )}

//         {/* ── Photos ───────────────────────────────────────────────────── */}
//         {photos && Array.isArray(photos) && photos.length > 0 && (
//           <div className="border-t pt-4">
//             <h3 className="font-semibold mb-3">Photos</h3>
//             <div className="flex flex-wrap gap-4">
//               {photos.map((url: string, idx: number) => {
//                 // If the URL is relative, prepend the correct backend host
//                 const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
//                 return (
//                   <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer">
//                     <img
//                       src={fullUrl}
//                       alt={`Photo ${idx + 1}`}
//                       className="w-32 h-32 object-cover rounded border"
//                       style={{ background: '#f3f3f3' }}
//                     />
//                   </a>
//                 );
//               })}
//             </div>
//           </div>
//         )}
 
//         {/* ── Action buttons ───────────────────────────────────────────── */}
//         <div className="flex justify-end space-x-3 pt-4 border-t">
//           {selectedRequest.approval_status === 'pending' && (
//             <>
//               <Button
//                 onClick={() => { setShowDetailsModal(false); openModal(selectedRequest, 'reject'); }}
//                 variant="danger"
//               >Reject</Button>
//               <Button
//                 onClick={() => { setShowDetailsModal(false); openModal(selectedRequest, 'approve'); }}
//                 variant="success"
//               >Approve</Button>
//             </>
//           )}
//           {selectedRequest.approval_status === 'approved' && (
//             <Button
//               onClick={() => { setShowDetailsModal(false); openModal(selectedRequest, 'deliver'); }}
//               variant="primary"
//             >Mark as Delivered</Button>
//           )}
//           <Button onClick={() => setShowDetailsModal(false)} variant="secondary">Close</Button>
//         </div>
 
//       </div>
//     );
//   })()}
// </Modal>

//       {/* Action Modal (Approve/Reject/Deliver) */}
//       {showModal && selectedRequest && (
//         <Modal
//           isOpen={showModal}
//           onClose={() => {
//             setShowModal(false);
//             setSelectedRequest(null);
//             setDeliveryData({ delivered_quantity: '', delivered_by: '', notes: '' });
//             setRejectionReason('');
//           }}
//           title={
//             modalType === 'approve'
//               ? 'Approve Fuel Request'
//               : modalType === 'reject'
//               ? 'Reject Fuel Request'
//               : 'Record Fuel Delivery'
//           }
//           size="md"
//         >
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-500">Site</p>
//               <p className="font-medium">{selectedRequest.site_details?.Site_Name}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Requested Quantity</p>
//               <p className="font-medium">{selectedRequest.request_info?.fuel_requested} L</p>
//             </div>

//             {modalType === 'approve' && (
//               <div className="flex justify-end space-x-3">
//                 <Button onClick={() => setShowModal(false)} variant="secondary">
//                   Cancel
//                 </Button>
//                 <Button onClick={handleApprove} variant="success" loading={loading}>
//                   Approve
//                 </Button>
//               </div>
//             )}

//             {modalType === 'reject' && (
//               <>
//                 <Textarea
//                   label="Rejection Reason *"
//                   value={rejectionReason}
//                   onChange={(e) => setRejectionReason(e.target.value)}
//                   placeholder="Explain why this request is being rejected..."
//                   rows={4}
//                   required
//                   fullWidth
//                 />
//                 <div className="flex justify-end space-x-3">
//                   <Button onClick={() => setShowModal(false)} variant="secondary">
//                     Cancel
//                   </Button>
//                   <Button onClick={handleReject} variant="danger" loading={loading}>
//                     Reject
//                   </Button>
//                 </div>
//               </>
//             )}

//             {modalType === 'deliver' && (
//               <>
//                 <Input
//                   label="Delivered Quantity (L) *"
//                   type="number"
//                   value={deliveryData.delivered_quantity}
//                   onChange={(e) =>
//                     setDeliveryData({ ...deliveryData, delivered_quantity: e.target.value })
//                   }
//                   required
//                   fullWidth
//                 />
//                 <Input
//                   label="Delivered By *"
//                   type="text"
//                   value={deliveryData.delivered_by}
//                   onChange={(e) =>
//                     setDeliveryData({ ...deliveryData, delivered_by: e.target.value })
//                   }
//                   placeholder="Driver/Transport team name"
//                   required
//                   fullWidth
//                 />
//                 <Textarea
//                   label="Delivery Notes"
//                   value={deliveryData.notes}
//                   onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
//                   rows={3}
//                   fullWidth
//                 />
//                 <div className="flex justify-end space-x-3">
//                   <Button onClick={() => setShowModal(false)} variant="secondary">
//                     Cancel
//                   </Button>
//                   <Button onClick={handleDeliver} variant="primary" loading={loading}>
//                     Record Delivery
//                   </Button>
//                 </div>
//               </>
//             )}
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default FuelRequestsPage;


