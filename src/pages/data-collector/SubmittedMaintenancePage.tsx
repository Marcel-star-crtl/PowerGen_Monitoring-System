import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/common/Select';
import { formatDate } from '@/utils/formatters';
import { FiCheckCircle, FiDownload, FiEye } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const SubmittedMaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>('all');
  const { success, error: showError } = useNotification();

  const handleViewDetails = (maintenanceId: string) => {
    navigate(`/data-collector/maintenance/${maintenanceId}`);
  };

  const loadMaintenance = async () => {
    setLoading(true);
    try {
      const response = await dataCollectorAPI.getSubmittedMaintenance();
      const data = response.data || response || [];
      setMaintenanceList(data);
      setFilteredList(data);
    } catch (err) {
      showError('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...maintenanceList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    if (visitTypeFilter !== 'all') {
      filtered = filtered.filter(m => m.visit_type === visitTypeFilter);
    }

    setFilteredList(filtered);
  }, [statusFilter, visitTypeFilter, maintenanceList]);

  const handleExportToExcel = () => {
    if (filteredList.length === 0) {
      showError('No data to export');
      return;
    }

    try {
      // Prepare data for Excel
      const exportData = filteredList.map((item: any) => ({
        'Maintenance ID': item._id || 'N/A',
        'Site ID': item.site_id || 'N/A',
        'Site Name': item.site_details?.Site_Name || item.site_name || 'N/A',
        'Region': item.site_details?.Region || 'N/A',
        'Cluster': item.site_details?.Cluster || 'N/A',
        'Technician': item.technician?.fullName || item.technician_name || 'Unknown',
        'Technician Email': item.technician?.email || 'N/A',
        'Visit Date': formatDate(item.visit_date),
        'Visit Type': item.visit_type || 'N/A',
        'Status': item.status || 'N/A',
        'Priority': item.priority || 'N/A',
        'Work Performed': item.work_performed || 'N/A',
        'Issues Found': item.issues_found || 'N/A',
        'Recommendations': item.recommendations || 'N/A',
        'Parts Used': item.parts_used?.map((p: any) => `${p.name} (Qty: ${p.quantity})`).join(', ') || 'None',
        'Parts Cost': item.parts_used?.reduce((sum: number, p: any) => sum + (p.quantity * (p.unit_price || 0)), 0) || 0,
        'Photos Count': item.photos?.length || 0,
        'Submitted At': item.submitted_at ? formatDate(item.submitted_at) : 'N/A',
        'Approved At': item.approved_at ? formatDate(item.approved_at) : 'N/A',
        'Approved By': item.approved_by?.fullName || 'N/A',
        
        // Generator checks
        'Generator Status': item.equipment_checks?.generator?.status || 'N/A',
        'Generator Running Hours': item.equipment_checks?.generator?.running_hours || 'N/A',
        'Generator Oil Level': item.equipment_checks?.generator?.oil_level || 'N/A',
        'Generator Coolant Level': item.equipment_checks?.generator?.coolant_level || 'N/A',
        'Generator Battery Voltage': item.equipment_checks?.generator?.battery_voltage || 'N/A',
        'Generator Notes': item.equipment_checks?.generator?.notes || 'N/A',
        
        // Power Cabinet checks
        'Power Cabinet Status': item.equipment_checks?.power_cabinet?.status || 'N/A',
        'Power Cabinet Breakers': item.equipment_checks?.power_cabinet?.breakers_condition || 'N/A',
        'Power Cabinet Wiring': item.equipment_checks?.power_cabinet?.wiring_condition || 'N/A',
        'Power Cabinet Notes': item.equipment_checks?.power_cabinet?.notes || 'N/A',
        
        // Grid checks
        'Grid Status': item.equipment_checks?.grid?.status || 'N/A',
        'Grid Voltage': item.equipment_checks?.grid?.voltage || 'N/A',
        'Grid Frequency': item.equipment_checks?.grid?.frequency || 'N/A',
        'Grid Notes': item.equipment_checks?.grid?.notes || 'N/A',
        
        // Shelter checks
        'Shelter Status': item.equipment_checks?.shelter?.status || 'N/A',
        'Shelter Condition': item.equipment_checks?.shelter?.condition || 'N/A',
        'Shelter Security': item.equipment_checks?.shelter?.security || 'N/A',
        'Shelter Notes': item.equipment_checks?.shelter?.notes || 'N/A',
        
        // Cleaning checks
        'Cleaning Status': item.equipment_checks?.cleaning?.status || 'N/A',
        'Cleaning Areas': item.equipment_checks?.cleaning?.areas_cleaned?.join(', ') || 'N/A',
        'Cleaning Notes': item.equipment_checks?.cleaning?.notes || 'N/A',
        
        // Fuel Tank checks
        'Fuel Tank Status': item.equipment_checks?.fuel_tank?.status || 'N/A',
        'Fuel Level': item.equipment_checks?.fuel_tank?.fuel_level || 'N/A',
        'Tank Condition': item.equipment_checks?.fuel_tank?.tank_condition || 'N/A',
        'Fuel Tank Notes': item.equipment_checks?.fuel_tank?.notes || 'N/A',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Submitted Maintenance');

      // Auto-size columns
      const colWidths = Array(Object.keys(exportData[0] || {}).length).fill({ wch: 20 });
      ws['!cols'] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const statusLabel = statusFilter === 'all' ? 'All' : statusFilter;
      const typeLabel = visitTypeFilter === 'all' ? 'All' : visitTypeFilter;
      const filename = `Submitted_Maintenance_${statusLabel}_${typeLabel}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      success(`Exported ${filteredList.length} maintenance record${filteredList.length !== 1 ? 's' : ''} to Excel`);
    } catch (err) {
      console.error('Export error:', err);
      showError('Failed to export data to Excel');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'pending_approval': 'yellow',
      'approved': 'green',
      'completed': 'blue',
      'rejected': 'red',
      'scheduled': 'gray',
      'in_progress': 'blue',
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, any> = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'gray',
    };
    return colors[priority] || 'gray';
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submitted Maintenance Records</h1>
          <p className="text-sm text-gray-500 mt-1">View and export all maintenance submissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending_approval', label: 'Pending Approval' },
              { value: 'approved', label: 'Approved' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            className="w-48"
          />
          <Select
            value={visitTypeFilter}
            onChange={(e) => setVisitTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'preventive', label: 'Preventive' },
              { value: 'corrective', label: 'Corrective' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'emergency', label: 'Emergency' },
            ]}
            className="w-48"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportToExcel}
            disabled={filteredList.length === 0}
            className="flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export to Excel
          </Button>
          <Badge variant="blue">{filteredList.length} Record{filteredList.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{maintenanceList.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {maintenanceList.filter(m => m.status === 'pending_approval').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {maintenanceList.filter(m => m.status === 'approved').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {maintenanceList.filter(m => m.status === 'completed').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {maintenanceList.filter(m => m.status === 'rejected').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Maintenance List */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon={<FiCheckCircle className="h-16 w-16 text-gray-400" />}
          title="No maintenance records found"
          description="No submitted maintenance records match your filters"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((item: any, index: number) => (
            <Card key={item._id || index} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.site_details?.Site_Name || item.site_name || item.site_id}
                    </h3>
                    <p className="text-sm text-gray-500">{item.site_id}</p>
                    {item.site_details?.Region && (
                      <p className="text-xs text-gray-400">{item.site_details.Region} • {item.site_details.Cluster}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Technician</p>
                    <p className="font-medium">{item.technician?.fullName || item.technician_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Visit Date</p>
                    <p className="font-medium">{formatDate(item.visit_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Visit Type</p>
                    <Badge variant="blue" size="sm">{item.visit_type}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <Badge variant={getPriorityColor(item.priority)} size="sm">
                      {item.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium text-xs">{item.submitted_at ? formatDate(item.submitted_at) : 'N/A'}</p>
                  </div>
                </div>

                {item.work_performed && (
                  <div>
                    <p className="text-sm text-gray-500">Work Performed</p>
                    <p className="text-sm text-gray-900 mt-1">{item.work_performed}</p>
                  </div>
                )}

                {item.parts_used && item.parts_used.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Parts Used</p>
                    <div className="flex flex-wrap gap-2">
                      {item.parts_used.map((part: any, idx: number) => (
                        <Badge key={idx} variant="gray" size="sm">
                          {part.name} (Qty: {part.quantity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.equipment_checks && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Equipment Checks</p>
                    <div className="flex flex-wrap gap-2">
                      {item.equipment_checks.generator && (
                        <Badge variant="blue" size="sm">
                          Generator: {item.equipment_checks.generator.status}
                        </Badge>
                      )}
                      {item.equipment_checks.power_cabinet && (
                        <Badge variant="blue" size="sm">
                          Power Cabinet: {item.equipment_checks.power_cabinet.status}
                        </Badge>
                      )}
                      {item.equipment_checks.grid && (
                        <Badge variant="blue" size="sm">
                          Grid: {item.equipment_checks.grid.status}
                        </Badge>
                      )}
                      {item.equipment_checks.shelter && (
                        <Badge variant="blue" size="sm">
                          Shelter: {item.equipment_checks.shelter.status}
                        </Badge>
                      )}
                      {item.equipment_checks.cleaning && (
                        <Badge variant="blue" size="sm">
                          Cleaning: {item.equipment_checks.cleaning.status}
                        </Badge>
                      )}
                      {item.equipment_checks.fuel_tank && (
                        <Badge variant="blue" size="sm">
                          Fuel Tank: {item.equipment_checks.fuel_tank.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewDetails(item._id)}
                    className="flex items-center gap-2"
                  >
                    <FiEye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmittedMaintenancePage;
