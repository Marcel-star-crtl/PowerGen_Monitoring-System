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
import { FiCheckCircle, FiXCircle, FiEye, FiFilter } from 'react-icons/fi';
import { Select } from '@/components/common/Select';

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
