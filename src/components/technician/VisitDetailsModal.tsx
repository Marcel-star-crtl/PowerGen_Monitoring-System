import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PhotoGallery } from '@/components/common/PhotoGallery';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { technicianAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate, formatStatus } from '@/utils/formatters';
import { VISIT_TYPES } from '@/utils/constants';
import { FiEdit2, FiSave, FiX, FiMapPin, FiCalendar, FiUser } from 'react-icons/fi';

interface VisitDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: any;
    onUpdate?: () => void;
}

export const VisitDetailsModal: React.FC<VisitDetailsModalProps> = ({
    isOpen,
    onClose,
    visit,
    onUpdate,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const { success, error: showError } = useNotification();

    if (!visit) return null;

    const canEdit = visit.status === 'draft' || visit.status === 'rejected';

    const handleStartEdit = () => {
        setEditData({
            Type_of_Visit: visit.Type_of_Visit || visit.visit_type,
            Visit_Comments: visit.Visit_Comments || visit.work_performed || '',
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const maintenanceId = visit._id || visit.maintenance_id;
            await technicianAPI.updateDraft(maintenanceId, editData, [], false);
            success('Visit updated successfully!');
            setIsEditing(false);
            onUpdate?.();
        } catch (err) {
            showError('Failed to update visit');
        } finally {
            setSaving(false);
        }
    };

    const status = formatStatus(visit.status);
    const photos = visit.photos || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Visit Details"
            size="xl"
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {visit.Site_Name || visit.site_name || 'Unknown Site'}
                        </h3>
                        <p className="text-sm text-gray-500">{visit.site_id || visit.IHS_ID_SITE}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge variant={status.color as any}>{status.label}</Badge>
                        {canEdit && !isEditing && (
                            <Button onClick={handleStartEdit} variant="secondary" size="sm">
                                <FiEdit2 className="mr-1" /> Edit
                            </Button>
                        )}
                    </div>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <FiCalendar className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Visit Date</p>
                            <p className="font-medium">{formatDate(visit.Actual_Date_Visit || visit.visit_date)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FiMapPin className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Region</p>
                            <p className="font-medium">{visit.Region || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FiUser className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Technician</p>
                            <p className="font-medium">{visit.technician_name || visit.technician?.fullName || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Visit Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                    {isEditing ? (
                        <Select
                            value={editData.Type_of_Visit || ''}
                            onChange={(e) => setEditData({ ...editData, Type_of_Visit: e.target.value })}
                            options={VISIT_TYPES}
                            fullWidth
                        />
                    ) : (
                        <Badge variant="blue">{visit.Type_of_Visit || visit.visit_type}</Badge>
                    )}
                </div>

                {/* Work Performed / Comments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Performed / Comments</label>
                    {isEditing ? (
                        <Textarea
                            value={editData.Visit_Comments || ''}
                            onChange={(e) => setEditData({ ...editData, Visit_Comments: e.target.value })}
                            rows={4}
                            fullWidth
                        />
                    ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {visit.Visit_Comments || visit.work_performed || 'No comments provided'}
                        </p>
                    )}
                </div>

                {/* Issues Found */}
                {visit.Issues_Found && Object.keys(visit.Issues_Found).some(k => visit.Issues_Found[k]) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issues Found</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(visit.Issues_Found).map(([key, value]) => (
                                value ? (
                                    <div key={key} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                                        <span className="text-red-700">{String(value)}</span>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}

                {/* Parts Used */}
                {visit.Parts_Used_During_Visit?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parts Used</label>
                        <div className="flex flex-wrap gap-2">
                            {visit.Parts_Used_During_Visit.map((part: any, idx: number) => (
                                <Badge key={idx} variant="blue">
                                    {part.part_name} (x{part.quantity_used})
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos ({photos.length})
                    </label>
                    {photos.length > 0 ? (
                        <PhotoGallery photos={photos} />
                    ) : (
                        <p className="text-gray-500 italic">No photos uploaded</p>
                    )}
                </div>

                {/* Rejection Reason */}
                {visit.status === 'rejected' && visit.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-red-700">{visit.rejection_reason}</p>
                    </div>
                )}

                {/* Edit Actions */}
                {isEditing && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button onClick={handleCancelEdit} variant="secondary" disabled={saving}>
                            <FiX className="mr-1" /> Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} variant="primary" loading={saving}>
                            <FiSave className="mr-1" /> Save Changes
                        </Button>
                    </div>
                )}

                {/* Close Button (when not editing) */}
                {!isEditing && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onClose} variant="secondary">
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
