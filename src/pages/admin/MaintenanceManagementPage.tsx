import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Maintenance } from '@/types/maintenance.types';
import { FuelConsumption } from '@/types/fuel.types';
import { dieselManagerAPI } from '@/api/endpoints/dieselManager';
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
    // Map FuelConsumption approval_status to Maintenance status for display
    const mapApprovalStatus = (status: string) => {
      switch (status) {
        case 'pending': return 'pending';
        case 'approved': return 'approved';
        case 'rejected': return 'rejected';
        case 'fulfilled': return 'completed';
        default: return 'pending';
      }
    };
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [fuelConsumption, setFuelConsumption] = useState<FuelConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<Maintenance | FuelConsumption | null>(null);
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
    loadFuelConsumption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total ?? 0,
        pages: result.pagination?.pages ?? 1,
      }));
    } catch (err) {
      showError('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const loadFuelConsumption = async () => {
    try {
      // Fetch all fuel consumption records (adjust params as needed)
      const result = await dieselManagerAPI.getFuelConsumptionBySite('all');
      setFuelConsumption(result.data || []);
    } catch (err) {
      showError('Failed to load fuel consumption records');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      await adminAPI.deleteMaintenance(id);
      success('Maintenance record deleted');
      loadMaintenance();
    } catch (err) {
      showError('Failed to delete maintenance record');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem || !newStatus) return;
    try {
      await adminAPI.updateMaintenanceStatus(selectedItem._id, newStatus);
      success('Status updated successfully');
      setShowStatusModal(false);
      setSelectedItem(null);
      loadMaintenance();
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'site',
      header: 'Site',
      render: (item: any) => (
        <div>
          <p className="font-medium">{item.site_details?.Site_Name || item.site_name || item.site_id}</p>
          <p className="text-sm text-gray-500">{item.site_id}</p>
        </div>
      ),
    },
    {
      key: 'technician',
      header: 'Technician',
      render: (item: any) => (
        <p className="font-medium">{item.technician?.fullName || item.fse_name || 'N/A'}</p>
      ),
    },
    {
      key: 'visit_date',
      header: 'Visit Date',
      render: (item: any) => <p>{formatDate(item.visit_date || item.record_date)}</p>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const status = formatStatus(item.status || item.approval_status);
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: any) => {
        const priority = formatPriority(item.priority || 'N/A');
        return <Badge variant={priority.color as any}>{priority.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
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
          {item.status && (
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
          )}
          {item.status && (
            <Button onClick={() => handleDelete(item._id)} variant="ghost" size="sm">
              <FiTrash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
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

      {/* Maintenance & Fuel Table */}
      <Card padding="none">
        <Table data={[...maintenance, ...fuelConsumption]} columns={columns} loading={loading} />
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
        title="Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <p className="font-medium">
                  {'site_details' in selectedItem ? selectedItem.site_details?.Site_Name : selectedItem.site_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Technician</p>
                <p className="font-medium">
                  {'technician' in selectedItem ? selectedItem.technician?.fullName : selectedItem.fse_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visit Date</p>
                <p className="font-medium">
                  {'visit_date' in selectedItem ? formatDate(selectedItem.visit_date) : formatDate(selectedItem.record_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={formatStatus('status' in selectedItem ? selectedItem.status : mapApprovalStatus(selectedItem.approval_status)).color as any}>
                  {formatStatus('status' in selectedItem ? selectedItem.status : mapApprovalStatus(selectedItem.approval_status)).label}
                </Badge>
              </div>
            </div>

            {/* Refuel/Fuel Data */}
            {'equipment_checks' in selectedItem && selectedItem.equipment_checks?.fuel_tank_checks ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Refuel Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Departure Time (min)</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.departure_time_min ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arrival Time Station</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.arrival_time_station ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arrival Time Site</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.arrival_time_site ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transfer Time (min)</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.transfer_time_min ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Transfer (L)</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.quantity_transfer_l ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Comments</p>
                    <p className="font-medium">
                      {selectedItem.equipment_checks.fuel_tank_checks.comments ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : 'fuel_data' in selectedItem && selectedItem.fuel_data ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Fuel Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedItem.fuel_data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
                      <p className="font-medium">{value ?? 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : 'runtime_data' in selectedItem && selectedItem.runtime_data ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Runtime Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedItem.runtime_data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
                      <p className="font-medium">{value ?? 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Comments, Planifier, Guard, etc. */}
            {'comments' in selectedItem && selectedItem.comments && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Comments</p>
                <p className="text-gray-900">{selectedItem.comments}</p>
              </div>
            )}
            {'planifier' in selectedItem && selectedItem.planifier && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Planifier</p>
                <p className="text-gray-900">{selectedItem.planifier}</p>
              </div>
            )}
            {'guard_name' in selectedItem && selectedItem.guard_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Guard Name</p>
                <p className="text-gray-900">{selectedItem.guard_name}</p>
              </div>
            )}
            {'guard_number' in selectedItem && selectedItem.guard_number && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Guard Number</p>
                <p className="text-gray-900">{selectedItem.guard_number}</p>
              </div>
            )}

            {/* Work Performed & Parts Used (Maintenance only) */}
            {'work_performed' in selectedItem && selectedItem.work_performed && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Work Performed</p>
                <p className="text-gray-900">{selectedItem.work_performed}</p>
              </div>
            )}
            {'parts_used' in selectedItem && selectedItem.parts_used && selectedItem.parts_used.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Parts Used</p>
                <div className="space-y-1">
                  {selectedItem.parts_used.map((part: any, idx: number) => (
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