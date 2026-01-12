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

const FuelRequestsPage: React.FC = () => {
  const {
    getPendingRequests,
    approveFuelRequest,
    rejectFuelRequest,
    markDelivered,
    createFuelRequest,
    loading,
  } = useFuel();
  const { success, error: showError } = useNotification();

  const [requests, setRequests] = useState<FuelConsumption[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FuelConsumption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'deliver'>('approve');
  const [deliveryData, setDeliveryData] = useState({
    delivered_quantity: '',
    delivered_by: '',
    notes: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const result = await getPendingRequests({ page: 1, limit: 50 });
      setRequests(result.data);
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
        delivered_by: deliveryData.delivered_by,
        notes: deliveryData.notes,
      });
      success('Fuel delivery recorded!');
      setShowModal(false);
      setSelectedRequest(null);
      setDeliveryData({ delivered_quantity: '', delivered_by: '', notes: '' });
      loadRequests();
    } catch (err) {
      showError('Failed to record delivery');
    }
  };

  const openModal = (request: FuelConsumption, type: 'approve' | 'reject' | 'deliver') => {
    setSelectedRequest(request);
    setModalType(type);
    setShowModal(true);
  };

  const openDetailsModal = (request: FuelConsumption) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, any> = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[urgency] || 'gray';
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Requests</h1>
        <div className="flex items-center space-x-3">
          <Badge variant="blue">{requests.length} Pending</Badge>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            <FiPlus className="mr-2" />
            Create Request
          </Button>
        </div>
      </div>

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
              request.fuel_data.tank_capacity
            );

            return (
              <Card key={request._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {request.site_details?.Site_Name || request.site_id}
                      </h3>
                      <p className="text-sm text-gray-500">{request.site_id}</p>
                    </div>
                    <Badge variant={getUrgencyColor(request.request_info?.request_urgency || 'medium')}>
                      {request.request_info?.request_urgency?.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Current Fuel Level</p>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${
                          fuelInfo.color === 'red' ? 'bg-red-500' : 
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
                      <span className="text-gray-500">Requested:</span>
                      <span className="font-medium">
                        {request.request_info?.fuel_requested} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days Until Empty:</span>
                      <span className="font-medium">
                        {request.days_until_empty || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {request.request_info?.request_reason && (
                    <div>
                      <p className="text-sm text-gray-500">Reason:</p>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {request.request_info.request_reason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => openDetailsModal(request)}
                      variant="ghost"
                      size="sm"
                      fullWidth
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </Button>

                    {request.approval_status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => openModal(request, 'approve')}
                          variant="success"
                          size="sm"
                          fullWidth
                        >
                          <FiCheckCircle className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openModal(request, 'reject')}
                          variant="danger"
                          size="sm"
                          fullWidth
                        >
                          <FiXCircle className="mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.approval_status === 'approved' && (
                      <Button
                        onClick={() => openModal(request, 'deliver')}
                        variant="primary"
                        size="sm"
                        fullWidth
                      >
                        <FiTruck className="mr-1" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !submitting && setShowCreateModal(false)}
        title="Create Fuel Request"
        size="lg">
        <FuelRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowCreateModal(false)}
          loading={submitting}
          showSiteSelector={true}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        title="Fuel Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <p className="font-medium">
                  {selectedRequest.site_details?.Site_Name || selectedRequest.site_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Site ID</p>
                <p className="font-medium">{selectedRequest.site_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-medium">{selectedRequest.site_details?.Region || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={
                  selectedRequest.approval_status === 'approved' ? 'green' :
                  selectedRequest.approval_status === 'rejected' ? 'red' : 'yellow'
                }>
                  {selectedRequest.approval_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Urgency</p>
                <Badge variant={getUrgencyColor(selectedRequest.request_info?.request_urgency || 'medium')}>
                  {selectedRequest.request_info?.request_urgency?.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Requested Date</p>
                <p className="font-medium">{formatDate(selectedRequest.record_date)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Fuel Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Level</p>
                  <p className="font-medium">
                    {selectedRequest.fuel_data.closing_level} L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tank Capacity</p>
                  <p className="font-medium">
                    {selectedRequest.fuel_data.tank_capacity} L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested</p>
                  <p className="font-medium text-blue-600">
                    {selectedRequest.request_info?.fuel_requested} L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Until Empty</p>
                  <p className="font-medium">
                    {selectedRequest.days_until_empty || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Current Fuel Level</p>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      formatFuelLevel(
                        selectedRequest.fuel_data.closing_level,
                        selectedRequest.fuel_data.tank_capacity
                      ).color === 'red' ? 'bg-red-500' :
                      formatFuelLevel(
                        selectedRequest.fuel_data.closing_level,
                        selectedRequest.fuel_data.tank_capacity
                      ).color === 'orange' ? 'bg-orange-500' :
                      formatFuelLevel(
                        selectedRequest.fuel_data.closing_level,
                        selectedRequest.fuel_data.tank_capacity
                      ).color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${formatFuelLevel(
                        selectedRequest.fuel_data.closing_level,
                        selectedRequest.fuel_data.tank_capacity
                      ).percentage}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {selectedRequest.request_info?.request_reason && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Request Reason</p>
                <p className="text-gray-900">{selectedRequest.request_info.request_reason}</p>
              </div>
            )}

            {selectedRequest.approval_notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Approval Comments</p>
                <p className="text-gray-900">{selectedRequest.approval_notes}</p>
              </div>
            )}

            {selectedRequest.rejection_reason && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Rejection Reason</p>
                <p className="text-red-600">{selectedRequest.rejection_reason}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              {selectedRequest.approval_status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openModal(selectedRequest, 'reject');
                    }}
                    variant="danger"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openModal(selectedRequest, 'approve');
                    }}
                    variant="success"
                  >
                    Approve
                  </Button>
                </>
              )}
              {selectedRequest.approval_status === 'approved' && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openModal(selectedRequest, 'deliver');
                  }}
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
        )}
      </Modal>

      {/* Action Modal (Approve/Reject/Deliver) */}
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
            modalType === 'approve'
              ? 'Approve Fuel Request'
              : modalType === 'reject'
              ? 'Reject Fuel Request'
              : 'Record Fuel Delivery'
          }
          size="md"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Site</p>
              <p className="font-medium">{selectedRequest.site_details?.Site_Name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Requested Quantity</p>
              <p className="font-medium">{selectedRequest.request_info?.fuel_requested} L</p>
            </div>

            {modalType === 'approve' && (
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleApprove} variant="success" loading={loading}>
                  Approve
                </Button>
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
                  <Button onClick={() => setShowModal(false)} variant="secondary">
                    Cancel
                  </Button>
                  <Button onClick={handleReject} variant="danger" loading={loading}>
                    Reject
                  </Button>
                </div>
              </>
            )}

            {modalType === 'deliver' && (
              <>
                <Input
                  label="Delivered Quantity (L) *"
                  type="number"
                  value={deliveryData.delivered_quantity}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, delivered_quantity: e.target.value })
                  }
                  required
                  fullWidth
                />
                <Input
                  label="Delivered By *"
                  type="text"
                  value={deliveryData.delivered_by}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, delivered_by: e.target.value })
                  }
                  placeholder="Driver/Transport team name"
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
                  <Button onClick={() => setShowModal(false)} variant="secondary">
                    Cancel
                  </Button>
                  <Button onClick={handleDeliver} variant="primary" loading={loading}>
                    Record Delivery
                  </Button>
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


