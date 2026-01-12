import React, { useEffect, useState } from 'react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Maintenance } from '@/types/maintenance.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { PhotoGallery } from '@/components/common/PhotoGallery';
import { formatDate, formatStatus, formatPriority } from '@/utils/formatters';
import { FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

const ApprovalsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { getTasks, approveMaintenance, rejectMaintenance, loading } = useMaintenance(user?.role!);
  const { success, error: showError } = useNotification();

  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);
  const [selectedItem, setSelectedItem] = useState<Maintenance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'view'>('view');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const result = await getTasks({ status: 'pending_approval' });
      setMaintenanceList(result.data);
    } catch (err) {
      showError('Failed to load pending maintenance');
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    try {
      await approveMaintenance(selectedItem._id, comments);
      success('Maintenance approved successfully!');
      setShowModal(false);
      setSelectedItem(null);
      setComments('');
      loadPending();
    } catch (err) {
      showError('Failed to approve maintenance');
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    try {
      await rejectMaintenance(selectedItem._id, rejectionReason);
      success('Maintenance rejected');
      setShowModal(false);
      setSelectedItem(null);
      setRejectionReason('');
      loadPending();
    } catch (err) {
      showError('Failed to reject maintenance');
    }
  };

  const openModal = (item: Maintenance, type: 'approve' | 'reject' | 'view') => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
  };

  if (loading && maintenanceList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <Badge variant="yellow">{maintenanceList.length} Pending</Badge>
      </div>

      {maintenanceList.length === 0 ? (
        <EmptyState
          icon={<FiCheckCircle className="h-16 w-16 text-gray-400" />}
          title="No pending approvals"
          description="All maintenance has been reviewed"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {maintenanceList.map((item) => {
            const status = formatStatus(item.status);
            const priority = formatPriority(item.priority);

            return (
              <Card key={item._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.site_details?.Site_Name || item.site_id}
                      </h3>
                      <p className="text-sm text-gray-500">{item.site_id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={priority.color as any}>{priority.label}</Badge>
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Technician</p>
                      <p className="font-medium">{item.technician.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Date</p>
                      <p className="font-medium">{formatDate(item.visit_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Type</p>
                      <p className="font-medium">{item.visit_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days Pending</p>
                      <p className="font-medium">{item.days_pending || 0} days</p>
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
                        {item.parts_used.map((part, idx) => (
                          <Badge key={idx} variant="blue" size="sm">
                            {part.part_name} (x{part.quantity_used})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => openModal(item, 'view')}
                      variant="ghost"
                      size="sm"
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => openModal(item, 'reject')}
                      variant="danger"
                      size="sm"
                    >
                      <FiXCircle className="mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => openModal(item, 'approve')}
                      variant="success"
                      size="sm"
                    >
                      <FiCheckCircle className="mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedItem && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
            setComments('');
            setRejectionReason('');
          }}
          title={
            modalType === 'approve'
              ? 'Approve Maintenance'
              : modalType === 'reject'
              ? 'Reject Maintenance'
              : 'Maintenance Details'
          }
          size="lg"
        >
          <div className="space-y-4">
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

            {modalType === 'view' && (
              <>
                {selectedItem.photos && selectedItem.photos.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Photos</p>
                    <PhotoGallery photos={selectedItem.photos} />
                  </div>
                )}
                <div className="flex space-x-3">
                  <Button onClick={() => setModalType('reject')} variant="danger" fullWidth>
                    Reject
                  </Button>
                  <Button onClick={() => setModalType('approve')} variant="success" fullWidth>
                    Approve
                  </Button>
                </div>
              </>
            )}

            {modalType === 'approve' && (
              <>
                <Textarea
                  label="Comments (optional)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add approval comments..."
                  rows={4}
                  fullWidth
                />
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => setShowModal(false)} variant="secondary">
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} variant="success" loading={loading}>
                    Approve
                  </Button>
                </div>
              </>
            )}

            {modalType === 'reject' && (
              <>
                <Textarea
                  label="Rejection Reason *"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this is being rejected..."
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
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ApprovalsPage;
