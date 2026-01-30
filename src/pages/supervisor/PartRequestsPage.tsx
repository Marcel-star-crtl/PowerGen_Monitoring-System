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
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { PhotoGallery } from '@/components/common/PhotoGallery';
import { Photo } from '@/types/common.types';
import { formatDate } from '@/utils/formatters';
import { FiTool, FiCheck, FiX, FiEye, FiFilter, FiPackage } from 'react-icons/fi';
import { Select } from '@/components/common/Select';

interface PartRequestItem {
  part: {
    _id: string;
    part_name: string;
    part_number: string;
    category: string;
    stock: number;
  };
  part_name: string;
  part_number: string;
  quantity: number;
}

interface PartRequest {
  _id: string;
  request_id: string;
  technician: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  items: PartRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  photos: Array<{ url: string; category: string; description: string }>;
  notes: string;
  site: string;
  supervisor_approval?: {
    approved_by: string;
    approved_at: string;
    comments: string;
  };
  createdAt: string;
  updatedAt: string;
}

const PartRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();

  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<PartRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, urgencyFilter, requests]);

  const loadRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await supervisorAPI.getPartRequests();
      setRequests(result.data || []);
    } catch (err) {
      showError('Failed to load part requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgencyFilter);
    }

    // Sort by urgency and date
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const urgDiff = (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
      if (urgDiff !== 0) return urgDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredRequests(filtered);
  };

  const handleViewDetails = (request: PartRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApproveClick = (request: PartRequest) => {
    setSelectedRequest(request);
    setApprovalComments('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (request: PartRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await supervisorAPI.approvePartRequest(selectedRequest._id, approvalComments);
      success('Part request approved successfully');
      setShowApproveModal(false);
      setShowDetailModal(false);
      loadRequests();
    } catch (err) {
      showError('Failed to approve part request');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await supervisorAPI.rejectPartRequest(selectedRequest._id, rejectionReason);
      success('Part request rejected');
      setShowRejectModal(false);
      setShowDetailModal(false);
      loadRequests();
    } catch (err) {
      showError('Failed to reject part request');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, any> = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'gray'
    };
    return <Badge variant={variants[urgency] || 'gray'} size="sm">{urgency.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      fulfilled: 'blue',
      cancelled: 'gray'
    };
    return <Badge variant={variants[status] || 'gray'}>{status}</Badge>;
  };

  if (loading && filteredRequests.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Part Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve technician part requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Urgency' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            className="w-40"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'fulfilled', label: 'Fulfilled' },
              { value: 'all', label: 'All Statuses' },
            ]}
            className="w-40"
          />
          <Badge variant="blue">{filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={<FiPackage className="h-16 w-16 text-gray-400" />}
          title="No requests found"
          description="No part requests match your filters"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request._id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.request_id}
                      </h3>
                      {getUrgencyBadge(request.urgency)}
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Technician: <span className="font-medium">{request.technician?.fullName || 'Unknown'}</span>
                    </p>
                    {request.site && (
                      <p className="text-sm text-gray-600">Site: {request.site}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Requested</p>
                    <p className="text-sm font-medium">{formatDate(request.createdAt)}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Requested Parts ({request.items.length})</p>
                  <div className="space-y-2">
                    {request.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.part_name || item.part?.part_name}</span>
                          <span className="text-gray-500 ml-2">({item.part_number || item.part?.part_number})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-700">Qty: <span className="font-semibold">{item.quantity}</span></span>
                          {item.part?.stock !== undefined && (
                            <Badge variant={item.part.stock >= item.quantity ? 'green' : 'red'} size="sm">
                              Stock: {item.part.stock}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {request.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notes:</p>
                    <p className="text-sm text-gray-900">{request.notes}</p>
                  </div>
                )}

                {request.photos && request.photos.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Photos: {request.photos.length}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2 border-t">
                  <Button
                    onClick={() => handleViewDetails(request)}
                    variant="secondary"
                    size="sm"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </Button>
                  {request.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleRejectClick(request)}
                        variant="danger"
                        size="sm"
                      >
                        <FiX className="mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApproveClick(request)}
                        variant="success"
                        size="sm"
                      >
                        <FiCheck className="mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Request Details - ${selectedRequest?.request_id}`}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Technician</p>
                <p className="font-medium">{selectedRequest.technician?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedRequest.technician?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Urgency</p>
                <div className="mt-1">{getUrgencyBadge(selectedRequest.urgency)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Requested Date</p>
                <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              {selectedRequest.site && (
                <div>
                  <p className="text-sm text-gray-500">Site</p>
                  <p className="font-medium">{selectedRequest.site}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Requested Parts</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedRequest.items.map((item, idx) => (
                  <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.part_name || item.part?.part_name}</p>
                        <p className="text-sm text-gray-600">Part #: {item.part_number || item.part?.part_number}</p>
                        {item.part?.category && (
                          <p className="text-sm text-gray-500">Category: {item.part.category}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="text-xl font-bold text-blue-600">{item.quantity}</p>
                        {item.part?.stock !== undefined && (
                          <Badge variant={item.part.stock >= item.quantity ? 'green' : 'red'} size="sm">
                            {item.part.stock >= item.quantity ? 'In Stock' : 'Low Stock'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <h4 className="font-semibold mb-2">Technician Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              </div>
            )}

            {selectedRequest.photos && selectedRequest.photos.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Photos ({selectedRequest.photos.length})</h4>
                <PhotoGallery
                  photos={selectedRequest.photos.map((p) => ({
                    url: (p as any).url,
                    category: (p as any).category || 'general',
                    description: (p as any).description || '',
                    uploaded_at: (p as any).uploaded_at ? new Date((p as any).uploaded_at) : new Date()
                  }) as Photo)}
                />
              </div>
            )}

            {selectedRequest.supervisor_approval && (
              <div>
                <h4 className="font-semibold mb-2">Approval Details</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Approved: {formatDate(selectedRequest.supervisor_approval.approved_at)}</p>
                  {selectedRequest.supervisor_approval.comments && (
                    <p className="text-sm mt-2">{selectedRequest.supervisor_approval.comments}</p>
                  )}
                </div>
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleRejectClick(selectedRequest);
                  }}
                  variant="danger"
                >
                  <FiX className="mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleApproveClick(selectedRequest);
                  }}
                  variant="success"
                >
                  <FiCheck className="mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Part Request"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to approve this part request from{' '}
            <span className="font-semibold">{selectedRequest?.technician?.fullName}</span>?
          </p>

          <Textarea
            label="Comments (optional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Add any comments about this approval..."
            rows={4}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowApproveModal(false)}
              variant="secondary"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              variant="success"
              loading={actionLoading}
            >
              <FiCheck className="mr-2" />
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Part Request"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Please provide a reason for rejecting this part request from{' '}
            <span className="font-semibold">{selectedRequest?.technician?.fullName}</span>.
          </p>

          <Textarea
            label="Rejection Reason *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this request is being rejected..."
            rows={4}
            required
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowRejectModal(false)}
              variant="secondary"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              variant="danger"
              loading={actionLoading}
            >
              <FiX className="mr-2" />
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PartRequestsPage;
