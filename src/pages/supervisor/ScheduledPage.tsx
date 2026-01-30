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
import { FiCalendar, FiUser, FiMapPin, FiPlus, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

const ScheduledPage: React.FC = () => {
  const [scheduled, setScheduled] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Maintenance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadScheduled();
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
    </div>
  );
};

export default ScheduledPage;



