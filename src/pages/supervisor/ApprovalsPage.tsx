import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supervisorAPI } from '@/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatStatus } from '@/utils/formatters';
import { FiCheckCircle, FiXCircle, FiEye, FiFilter, FiDownload } from 'react-icons/fi';
import { Select } from '@/components/common/Select';
import * as XLSX from 'xlsx';

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();

  // These are unified task/visit records
  const [visitsList, setVisitsList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Show final reports (pending_approval) by default
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');

  useEffect(() => {
    loadVisits();
  }, [user]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredList(visitsList);
    } else {
      setFilteredList(visitsList.filter(v => v.status === statusFilter));
    }
  }, [statusFilter, visitsList]);

  const loadVisits = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await supervisorAPI.getPendingMaintenance();
      const all = result.data || [];
      setVisitsList(all);
      // apply default filter (pending_approval)
      setFilteredList(all.filter((v: any) => v.status === statusFilter));
    } catch (err) {
      showError('Failed to load pending maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item: any) => {
    navigate(`/supervisor/approvals/${item._id}`);
  };

  const handleExportToExcel = () => {
    if (filteredList.length === 0) {
      showError('No data to export');
      return;
    }

    try {
      // Prepare data for Excel
      const exportData = filteredList.map((item: any) => ({
        'Site Name': item.site_details?.Site_Name || item.site_name || item.site_id || 'N/A',
        'Site ID': item.site_id || 'N/A',
        'Technician': item.technician?.fullName || item.technician_name || 'Unknown',
        'Visit Date': formatDate(item.visit_date),
        'Visit Type': item.visit_type || 'N/A',
        'Status': formatStatus(item.status || 'pending_approval').label,
        'Priority': item.priority || 'N/A',
        'Check Title': item.check_title || 'N/A',
        'Work Performed': item.work_performed || 'N/A',
        'Parts Used': item.parts_used?.map((p: any) => `${p.name} (Qty: ${p.quantity})`).join(', ') || 'None',
        'Issues Found': item.issues_found || 'N/A',
        'Recommendations': item.recommendations || 'N/A',
        'Photos Count': item.photos?.length || 0,
        'Submitted At': item.submitted_at ? formatDate(item.submitted_at) : 'N/A',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Site Visit Approvals');

      // Auto-size columns
      const colWidths = [
        { wch: 25 }, // Site Name
        { wch: 15 }, // Site ID
        { wch: 20 }, // Technician
        { wch: 12 }, // Visit Date
        { wch: 15 }, // Visit Type
        { wch: 15 }, // Status
        { wch: 10 }, // Priority
        { wch: 20 }, // Check Title
        { wch: 40 }, // Work Performed
        { wch: 40 }, // Parts Used
        { wch: 30 }, // Issues Found
        { wch: 30 }, // Recommendations
        { wch: 12 }, // Photos Count
        { wch: 18 }, // Submitted At
      ];
      ws['!cols'] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const statusLabel = statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ');
      const filename = `Site_Visits_${statusLabel}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      success(`Exported ${filteredList.length} visit${filteredList.length !== 1 ? 's' : ''} to Excel`);
    } catch (err) {
      console.error('Export error:', err);
      showError('Failed to export data to Excel');
    }
  };

  if (loading && filteredList.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Site Visit Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve completed site visits from your technicians</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'pending_approval', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'all', label: 'All Statuses' },
            ]}
            className="w-40"
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
          <Badge variant="blue">{filteredList.length} Visit{filteredList.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          icon={<FiCheckCircle className="h-16 w-16 text-gray-400" />}
          title="No visits found"
          description="No site visits from your technicians"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredList.map((item: any, index: number) => {
            const status = formatStatus(item.status || 'pending_approval');

            return (
              <Card key={item._id || index} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.check_title && (
                          <Badge variant="blue" size="sm">{item.check_title}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.site_details?.Site_Name || item.site_name || item.site_id}
                      </h3>
                      <p className="text-sm text-gray-500">{item.site_id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <Badge 
                        variant={
                          item.priority === 'high' || item.priority === 'critical' ? 'red' : 
                          item.priority === 'medium' ? 'yellow' : 'gray'
                        } 
                        size="sm"
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  </div>

                  {item.work_performed && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Work Performed:</p>
                      <p className="text-sm text-gray-900">{item.work_performed}</p>
                    </div>
                  )}

                  {item.parts_used && item.parts_used.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Parts Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.parts_used.map((part: any, idx: number) => (
                          <Badge key={idx} variant="blue" size="sm">
                            {part.part_name} (x{part.quantity_used})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => handleViewDetails(item)}
                      variant="primary"
                      size="sm"
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
