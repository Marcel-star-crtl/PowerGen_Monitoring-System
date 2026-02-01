import React, { useEffect, useState } from 'react';
import { supervisorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Maintenance } from '@/types/maintenance.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { formatDate, formatStatus } from '@/utils/formatters';
import { FiCalendar, FiUser, FiMapPin, FiPlus, FiEdit, FiEye, FiTrash2, FiUpload, FiSettings } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const ScheduledPage: React.FC = () => {
  const [scheduled, setScheduled] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    siteId: '',
    siteName: '',
    visitDate: '',
    visitDate2: '',
    visitDate3: '',
    technicianName: '',
    technicianEmail: '',
    cluster: '',
    priority: '',
    topology: ''
  });

  const getSelectOptions = (required = false) => {
    // Ensure we only map valid strings and filter out any accidental undefineds
    const baseOptions = excelHeaders
      .filter(h => h !== undefined && h !== null)
      .map(h => ({ value: String(h), label: String(h) }));
      
    if (!required) {
      return [{ value: '', label: 'Not Mapped' }, ...baseOptions];
    }
    return baseOptions;
  };

  const [selectedItem, setSelectedItem] = useState<Maintenance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadScheduled();
    const fetchTechs = async () => {
      try {
        const result = await supervisorAPI.getTechnicians();
        setTechnicians(result.data || []);
      } catch (err) {
        console.error('Failed to load technicians:', err);
      }
    };
    fetchTechs();
  }, [statusFilter]);

  const loadScheduled = async () => {
    setLoading(true);
    try {
      const result = await supervisorAPI.getScheduledMaintenance({
        status: statusFilter || undefined,
      });
      setScheduled(result.data);
    } catch (err) {
      showError('Failed to load scheduled maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = async (data: any) => {
    setSubmitting(true);
    try {
      await supervisorAPI.scheduleMaintenance(data);
      success('Maintenance scheduled successfully!');
      setShowScheduleModal(false);
      loadScheduled();
    } catch (err) {
      showError('Failed to schedule maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMaintenance = async (data: any) => {
    if (!selectedItem) return;
    
    setSubmitting(true);
    try {
      await supervisorAPI.updateScheduledMaintenance(selectedItem._id, data);
      success('Maintenance updated successfully!');
      setShowEditModal(false);
      setSelectedItem(null);
      loadScheduled();
    } catch (err) {
      showError('Failed to update maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (maintenanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled maintenance?')) return;

    try {
      await supervisorAPI.deleteScheduledMaintenance(maintenanceId);
      success('Maintenance deleted successfully');
      loadScheduled();
    } catch (err) {
      showError('Failed to delete maintenance');
    }
  };

  const handleViewDetails = (item: Maintenance) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleEdit = (item: Maintenance) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get all rows to find the header row
        const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (allRows.length === 0) {
          showError('Excel file is empty');
          return;
        }

        // Find the first row that looks like a header (has content)
        const headerRowIndex = allRows.findIndex(row => 
          row && row.some(cell => cell !== null && cell !== '' && typeof cell !== 'number')
        );

        if (headerRowIndex === -1) {
          showError('Could not find header row in Excel file');
          return;
        }

        const headerRow = allRows[headerRowIndex];
        const headers: string[] = headerRow
          .map(h => String(h || ''))
          .filter(h => h.trim() !== '');
        
        if (headers.length === 0) {
          showError('No valid headers found in Excel file');
          return;
        }

        // Read data starting from the header row
        const rows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
        
        setExcelHeaders(headers);
        setExcelData(rows);
        
        // Auto-mapping attempt with improved detection
        const newMapping = {
          siteId: '',
          siteName: '',
          visitDate: '',
          visitDate2: '',
          visitDate3: '',
          technicianName: '',
          technicianEmail: '',
          cluster: '',
          priority: '',
          topology: ''
        };

        headers.forEach(h => {
          const lower = h.toLowerCase().trim();
          
          // Site ID detection - prioritize IHS SITE ID over operator ID
          if (lower === 'ihs site id') {
            newMapping.siteId = h;
          } else if (!newMapping.siteId && (lower === 'site id' || lower.includes('site id operator'))) {
            newMapping.siteId = h;
          }
          // Site Name detection
          if (lower === 'site name' || (lower.includes('site') && lower.includes('name'))) {
            if (!newMapping.siteId || lower !== newMapping.siteId.toLowerCase()) {
               newMapping.siteName = h;
            }
          }
          // Date detection - Support up to 3 service dates
          if (lower.includes('1st service planned')) {
            newMapping.visitDate = h;
          }
          if (lower.includes('2nd service planned')) {
            newMapping.visitDate2 = h;
          }
          if (lower.includes('3rd service planned')) {
            newMapping.visitDate3 = h;
          }
          // Technician Name detection
          if (lower.includes('technician name') || lower.includes('tech name') || lower.includes('teams')) {
            newMapping.technicianName = h;
          }
          // Email detection
          if (lower.includes('email')) {
            newMapping.technicianEmail = h;
          }
          // Cluster detection
          if (lower === 'cluster') {
            newMapping.cluster = h;
          }
          // Priority detection
          if (lower === 'priority') {
            newMapping.priority = h;
          }
          // Topology detection
          if (lower.includes('topology')) {
            newMapping.topology = h;
          }
        });
        
        setMapping(newMapping);
        setShowMappingModal(true);
      } catch (err) {
        console.error(err);
        showError('Failed to read Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBatchSubmit = async () => {
    if (!mapping.siteId || !mapping.visitDate || !mapping.technicianName) {
      showError('Please map at least Site ID, 1st Visit Date and Technician Name');
      return;
    }

    const previewData: any[] = [];
    
    // Helper to format date from Excel (could be Date object or serial number or string)
    const parseExcelDate = (val: any) => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString();
      // If it's a number (Excel serial date)
      if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      // If it's a string like "12/26/2025" or "2025-12-26"
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
      return null;
    };

    console.log('Excel Data Sample (first row):', excelData[0]);
    console.log('Mapping:', mapping);
    console.log('Total rows:', excelData.length);

    let skippedNoSiteId = 0;
    let skippedNoDate = 0;

    excelData.forEach((row, index) => {
      const siteId = row[mapping.siteId];
      if (!siteId) {
        skippedNoSiteId++;
        console.log(`Row ${index + 1}: No siteId found. Column "${mapping.siteId}", Available keys:`, Object.keys(row));
        return;
      }

      const techName = row[mapping.technicianName];
      const techEmail = mapping.technicianEmail ? row[mapping.technicianEmail] : '';
      
      const technician = findTechnician(techName, techEmail);
      
      // We'll create up to 3 entries for this row if dates are provided
      const datesToProcess = [
        mapping.visitDate ? row[mapping.visitDate] : null,
        mapping.visitDate2 ? row[mapping.visitDate2] : null,
        mapping.visitDate3 ? row[mapping.visitDate3] : null
      ].filter(Boolean);

      if (datesToProcess.length === 0) {
        skippedNoDate++;
        console.log(`Row ${index + 1}: No valid dates. Column "${mapping.visitDate}", Value:`, row[mapping.visitDate]);
        return;
      }

      datesToProcess.forEach((rawDate, dateIdx) => {
        const visitDate = parseExcelDate(rawDate);
        if (!visitDate) {
          console.log(`Row ${index + 1}, Date ${dateIdx + 1}: Failed to parse date:`, rawDate, typeof rawDate);
          return;
        }

        const dateLabel = dateIdx === 0 ? '1st' : dateIdx === 1 ? '2nd' : '3rd';

        previewData.push({
          id: `${index}-${dateIdx}`,
          siteId,
          siteName: mapping.siteName ? row[mapping.siteName] : '',
          visitDate,
          rawDate,
          dateLabel,
          technicianName: techName,
          technicianEmail: techEmail,
          technicianId: technician?._id || '',
          cluster: mapping.cluster ? row[mapping.cluster] : '',
          priority: mapping.priority ? row[mapping.priority] : 'Medium',
          topology: mapping.topology ? row[mapping.topology] : '',
          status: technician ? 'Valid' : 'Technician Not Found'
        });
      });
    });

    console.log('Preview data generated:', previewData.length, 'records');
    console.log('Skipped rows - No Site ID:', skippedNoSiteId, 'No Date:', skippedNoDate);

    if (previewData.length === 0) {
      showError(`No valid data found. Skipped: ${skippedNoSiteId} rows (no site ID), ${skippedNoDate} rows (no valid dates). Check console for details.`);
      return;
    }

    setPreviewRows(previewData);
    setShowMappingModal(false);
    setShowPreviewModal(true);
  };

  const findTechnician = (name: string, email?: string) => {
    if ((!name || name === '') && (!email || email === '')) return null;
    if (!Array.isArray(technicians) || technicians.length === 0) return null;

    const normalizedName = name ? String(name).toLowerCase().trim() : '';
    const normalizedEmail = email ? String(email).toLowerCase().trim() : '';

    // Helper to get a tech's display name in a safe way
    const techName = (t: any) => String(t.fullName || t.name || t.displayName || '').toLowerCase();

    if (normalizedEmail) {
      const byEmail = technicians.find((t: any) => String(t.email || '').toLowerCase() === normalizedEmail);
      if (byEmail) return byEmail;
    }

    if (normalizedName) {
      const byName = technicians.find((t: any) => techName(t) === normalizedName);
      if (byName) return byName;

      const byPartialName = technicians.find((t: any) => {
        const tn = techName(t);
        return (tn && tn.includes(normalizedName)) || (normalizedName && normalizedName.includes(tn));
      });
      if (byPartialName) return byPartialName;
    }

    return null;
  };

  const handleFinalSubmit = async () => {
    const invalidRows = previewRows.filter(r => !r.technicianId);
    if (invalidRows.length > 0) {
      showError(`Please select a technician for all rows (${invalidRows.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const finalData = previewRows.map(row => ({
        siteId: row.siteId,
        siteName: row.siteName,
        visitDate: row.visitDate,
        technician: row.technicianId, // Backend expects _id
        cluster: row.cluster,
        priority: row.priority,
        topology: row.topology,
        visitType: 'PM'
      }));

      const response = await supervisorAPI.batchSchedule(finalData);
      success(`Successfully scheduled ${response.processed} tasks.`);
      setShowPreviewModal(false);
      loadScheduled();
    } catch (err) {
      console.error(err);
      showError('Failed to process batch upload');
    } finally {
      setSubmitting(false);
    }
  };

  // Group by date
  const groupedByDate = scheduled.reduce((acc, item) => {
    const date = formatDate(item.visit_date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, Maintenance[]>);

  const dates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Maintenance</h1>
        <div className="flex items-center space-x-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'approved', label: 'Approved' },
              { value: 'in_progress', label: 'In Progress' },
              { value: '', label: 'All Scheduled' },
            ]}
            className="w-48"
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx, .xls" 
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="ghost" disabled={submitting}>
            <FiUpload className="mr-2" />
            {submitting ? 'Uploading...' : 'Upload Excel'}
          </Button>
          <Button onClick={() => setShowScheduleModal(true)} variant="primary">
            <FiPlus className="mr-2" />
            Schedule New
          </Button>
        </div>
      </div>

      {scheduled.length === 0 ? (
        <EmptyState
          icon={<FiCalendar className="h-16 w-16 text-gray-400" />}
          title="No scheduled maintenance"
          description="No maintenance scheduled for the selected filter"
          actionLabel="Schedule Maintenance"
          onAction={() => setShowScheduleModal(true)}
        />
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center mb-4">
                <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
                <Badge variant="blue" size="sm" className="ml-3">
                  {groupedByDate[date].length} task{groupedByDate[date].length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedByDate[date].map((item) => {
                  const status = formatStatus(item.status);

                  return (
                    <Card key={item._id} className="hover:shadow-lg transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {item.site_details?.Site_Name || item.site_id}
                            </h3>
                            <p className="text-sm text-gray-500">{item.site_id}</p>
                          </div>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <FiUser className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.technician.fullName}</span>
                          </div>
                          {item.site_details?.Region && (
                            <div className="flex items-center text-gray-600">
                              <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.site_details.Region}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Visit Type:</span>
                            <Badge variant="blue" size="sm">
                              {item.visit_type}
                            </Badge>
                          </div>
                          {item.priority && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Priority:</span>
                              <Badge 
                                variant={
                                  item.priority === 'high' ? 'red' : 
                                  item.priority === 'medium' ? 'yellow' : 'gray'
                                } 
                                size="sm"
                              >
                                {item.priority}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {item.work_performed && (
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {item.work_performed}
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button
                            onClick={() => handleViewDetails(item)}
                            variant="ghost"
                            size="sm"
                            fullWidth
                          >
                            <FiEye className="mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="secondary"
                            size="sm"
                            fullWidth
                          >
                            <FiEdit className="mr-1" />
                            Edit
                          </Button>
                           <Button
                            onClick={() => handleDelete(item._id)}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {scheduled.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{scheduled.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {scheduled.filter((s) => s.status === 'approved').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-green-600">
                {scheduled.filter((s) => s.status === 'in_progress').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {scheduled.filter((s) => s.priority === 'high').length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule New Maintenance Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => !submitting && setShowScheduleModal(false)}
        title="Schedule Maintenance"
        size="lg"
      >
        <MaintenanceForm
          onSubmit={handleScheduleMaintenance}
          onCancel={() => setShowScheduleModal(false)}
          loading={submitting}
        />
      </Modal>

      {/* Edit Maintenance Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !submitting && setShowEditModal(false)}
        title="Edit Scheduled Maintenance"
        size="lg"
      >
        {selectedItem && (
          <MaintenanceForm
            initialData={{
              technician: selectedItem.technician?._id || '',
              site_id: selectedItem.site_id,
              visit_type: selectedItem.visit_type,
              visit_date: new Date(selectedItem.visit_date).toISOString().split('T')[0],
              priority: selectedItem.priority,
              notes: selectedItem.work_performed || '',
              estimated_duration: selectedItem.estimated_duration,
            }}
            onSubmit={handleEditMaintenance}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            loading={submitting}
          />
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItem(null);
        }}
        title="Maintenance Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <p className="font-medium">{selectedItem.site_details?.Site_Name || selectedItem.site_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Site ID</p>
                <p className="font-medium">{selectedItem.site_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Technician</p>
                <p className="font-medium">{selectedItem.technician.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visit Date</p>
                <p className="font-medium">{formatDate(selectedItem.visit_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visit Type</p>
                <Badge variant="blue">{selectedItem.visit_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <Badge 
                  variant={
                    selectedItem.priority === 'high' ? 'red' : 
                    selectedItem.priority === 'medium' ? 'yellow' : 'gray'
                  }
                >
                  {selectedItem.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={formatStatus(selectedItem.status).color as any}>
                  {formatStatus(selectedItem.status).label}
                </Badge>
              </div>
              {selectedItem.estimated_duration && (
                <div>
                  <p className="text-sm text-gray-500">Est. Duration</p>
                  <p className="font-medium">{selectedItem.estimated_duration}h</p>
                </div>
              )}
            </div>

            {selectedItem.work_performed && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Work to be Performed</p>
                <p className="text-gray-900">{selectedItem.work_performed}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button onClick={() => {
                setShowDetailsModal(false);
                handleEdit(selectedItem);
              }} variant="secondary">
                Edit
              </Button>
              <Button onClick={() => setShowDetailsModal(false)} variant="primary">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Excel Mapping Modal */}
      <Modal
        isOpen={showMappingModal}
        onClose={() => !submitting && setShowMappingModal(false)}
        title="Verify Schedule Mapping"
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Automatic Detection Complete:</strong> We've automatically matched your Excel columns to the required fields. Please verify the assignments below before proceeding with the import.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Site ID *</label>
              <Select
                value={mapping.siteId}
                onChange={(e) => setMapping({ ...mapping, siteId: e.target.value })}
                options={getSelectOptions(true)}
                placeholder="Select IHS SITE ID column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Site Name</label>
              <Select
                value={mapping.siteName}
                onChange={(e) => setMapping({ ...mapping, siteName: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select Site Name column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">1st Service Date *</label>
              <Select
                value={mapping.visitDate}
                onChange={(e) => setMapping({ ...mapping, visitDate: e.target.value })}
                options={getSelectOptions(true)}
                placeholder="Select date column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">2nd Service Date</label>
              <Select
                value={mapping.visitDate2}
                onChange={(e) => setMapping({ ...mapping, visitDate2: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select date column (optional)"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">3rd Service Date</label>
              <Select
                value={mapping.visitDate3}
                onChange={(e) => setMapping({ ...mapping, visitDate3: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select date column (optional)"
              />
            </div>
             <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Technician Name *</label>
              <Select
                value={mapping.technicianName}
                onChange={(e) => setMapping({ ...mapping, technicianName: e.target.value })}
                options={getSelectOptions(true)}
                placeholder="Select Technician Name column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Technician Email</label>
              <Select
                value={mapping.technicianEmail}
                onChange={(e) => setMapping({ ...mapping, technicianEmail: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select Email column (Optional)"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Cluster</label>
              <Select
                value={mapping.cluster}
                onChange={(e) => setMapping({ ...mapping, cluster: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select Cluster column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <Select
                value={mapping.priority}
                onChange={(e) => setMapping({ ...mapping, priority: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select Priority column"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Topology</label>
              <Select
                value={mapping.topology}
                onChange={(e) => setMapping({ ...mapping, topology: e.target.value })}
                options={getSelectOptions()}
                placeholder="Select Topology column"
              />
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {excelData.length} rows found in Excel
            </span>
            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowMappingModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBatchSubmit}
                loading={submitting}
                disabled={!mapping.siteId || !mapping.visitDate || !mapping.technicianName}
              >
                Start Import
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Excel Preview & Technician Resolution Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => !submitting && setShowPreviewModal(false)}
        title="Review Schedule Data"
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Review Required:</strong> We've parsed {previewRows.length} tasks from your file. Please ensure all technicians are correctly matched. Rows in <span className="text-red-600 font-bold">red</span> need a technician selected manually.
            </p>
          </div>

          <div className="max-h-[500px] overflow-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excel Tech</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matched Technician</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewRows.map((row) => (
                  <tr key={row.id} className={!row.technicianId ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.siteId}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium">{row.dateLabel}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(row.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {row.technicianName}
                      {row.technicianEmail && <div className="text-xs text-gray-400">{row.technicianEmail}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <select
                        className={`block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${!row.technicianId ? 'border-red-500' : ''}`}
                        value={row.technicianId}
                        onChange={(e) => {
                          const updated = previewRows.map(r => 
                            r.id === row.id ? { ...r, technicianId: e.target.value } : r
                          );
                          setPreviewRows(updated);
                        }}
                      >
                        <option value="">-- Select Technician --</option>
                        {technicians.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {!row.technicianId ? (
                        <span className="text-red-600 font-medium">Missing</span>
                      ) : (
                        <span className="text-green-600 font-medium">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {previewRows.filter(r => r.technicianId).length} of {previewRows.length} ready to import
            </span>
            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowPreviewModal(false)}
                disabled={submitting}
              >
                Back to Mapping
              </Button>
              <Button 
                variant="primary" 
                onClick={handleFinalSubmit}
                loading={submitting}
                disabled={previewRows.some(r => !r.technicianId)}
              >
                Confirm & Import
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduledPage;



