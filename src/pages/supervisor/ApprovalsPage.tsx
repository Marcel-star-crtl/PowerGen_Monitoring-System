import React, { useEffect, useState } from 'react';
import { supervisorAPI } from '@/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { PhotoGallery } from '@/components/common/PhotoGallery';
import { formatDate, formatStatus } from '@/utils/formatters';
import { FiCheckCircle, FiXCircle, FiEye, FiFilter } from 'react-icons/fi';
import { Select } from '@/components/common/Select';

const ApprovalsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();

  // These are unified task/visit records
  const [visitsList, setVisitsList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'view'>('view');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      const result = await supervisorAPI.getTechnicianVisits(user.id);
      setVisitsList(result.data || []);
      setFilteredList(result.data || []);
    } catch (err) {
      showError('Failed to load technician visits');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      // Note: visit_history items from Site don't have _id, we need to implement approval differently
      // For now, show that this visit is from the site visit history
      success('Visit review noted!');
      setShowModal(false);
      setSelectedItem(null);
      setComments('');
      loadVisits();
    } catch (err) {
      showError('Failed to approve visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      success('Visit rejection noted');
      setShowModal(false);
      setSelectedItem(null);
      setRejectionReason('');
      loadVisits();
    } catch (err) {
      showError('Failed to reject visit');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (item: any, type: 'approve' | 'reject' | 'view') => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
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
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
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
            const status = formatStatus(item.status || 'submitted');

            return (
              <Card key={item.visit_id || index} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.Site_Name || item.IHS_ID_SITE}
                      </h3>
                      <p className="text-sm text-gray-500">{item.IHS_ID_SITE}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Technician</p>
                      <p className="font-medium">{item.technician_name || item.Technician_Name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Date</p>
                      <p className="font-medium">{formatDate(item.Actual_Date_Visit)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Type</p>
                      <p className="font-medium">{item.Type_of_Visit}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Region</p>
                      <p className="font-medium">{item.Region || 'N/A'}</p>
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
