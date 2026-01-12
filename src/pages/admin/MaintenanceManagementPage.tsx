import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Maintenance } from '@/types/maintenance.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { formatDate, formatStatus, formatPriority } from '@/utils/formatters';
import { STATUS_OPTIONS } from '@/utils/constants';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

const MaintenanceManagementPage: React.FC = () => {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<Maintenance | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadMaintenance();
  }, [pagination.current, statusFilter]);

  const loadMaintenance = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAllMaintenance({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
      });
      setMaintenance(result.data);
      setPagination(result.pagination);
    } catch (err) {
      showError('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem || !newStatus) return;

    try {
      await adminAPI.updateMaintenanceStatus(selectedItem._id, newStatus);
      success('Status updated successfully!');
      setShowStatusModal(false);
      setSelectedItem(null);
      loadMaintenance();
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const handleDelete = async (maintenanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      await adminAPI.deleteMaintenance(maintenanceId);
      success('Maintenance deleted successfully!');
      loadMaintenance();
    } catch (err) {
      showError('Failed to delete maintenance');
    }
  };

  const columns = [
    {
      key: 'maintenance_id',
      header: 'Maintenance ID',
      render: (item: Maintenance) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{item.maintenance_id}</p>
          <p className="text-xs text-gray-500">{item.site_id}</p>
        </div>
      ),
    },
    {
      key: 'site_name',
      header: 'Site',
      render: (item: Maintenance) => item.site_details?.Site_Name || item.site_id,
    },
    {
      key: 'technician',
      header: 'Technician',
      render: (item: Maintenance) => item.technician.fullName,
    },
    {
      key: 'visit_date',
      header: 'Visit Date',
      render: (item: Maintenance) => formatDate(item.visit_date),
    },
    {
      key: 'visit_type',
      header: 'Type',
      render: (item: Maintenance) => <Badge variant="blue">{item.visit_type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Maintenance) => {
        const status = formatStatus(item.status);
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: Maintenance) => {
        const priority = formatPriority(item.priority);
        return <Badge variant={priority.color as any}>{priority.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Maintenance) => (
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setSelectedItem(item);
              setShowDetailsModal(true);
            }}
            variant="ghost"
            size="sm"
          >
            <FiEye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setSelectedItem(item);
              setNewStatus(item.status);
              setShowStatusModal(true);
            }}
            variant="ghost"
            size="sm"
          >
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDelete(item._id)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
      </div>

      {/* Filters */}
      <Card>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]}
          className="w-64"
        />
      </Card>

      {/* Maintenance Table */}
      <Card padding="none">
        <Table data={maintenance} columns={columns} loading={loading} />
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          onPageChange={(page) => setPagination({ ...pagination, current: page })}
        />
      </Card>

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
                <p className="font-medium">{selectedItem.site_details?.Site_Name}</p>
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
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={formatStatus(selectedItem.status).color as any}>
                  {formatStatus(selectedItem.status).label}
                </Badge>
              </div>
            </div>

            {selectedItem.work_performed && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Work Performed</p>
                <p className="text-gray-900">{selectedItem.work_performed}</p>
              </div>
            )}

            {selectedItem.parts_used && selectedItem.parts_used.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Parts Used</p>
                <div className="space-y-1">
                  {selectedItem.parts_used.map((part, idx) => (
                    <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>{part.part_name}</span>
                      <span>x{part.quantity_used}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedItem(null);
        }}
        title="Update Status"
        size="sm"
      >
        {selectedItem && (
          <div className="space-y-4">
            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={STATUS_OPTIONS}
              fullWidth
            />
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowStatusModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} variant="primary">
                Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaintenanceManagementPage;