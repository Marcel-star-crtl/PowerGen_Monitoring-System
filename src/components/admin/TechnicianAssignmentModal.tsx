import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { User } from '@/types/common.types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { useNotification } from '@/contexts/NotificationContext';
import { FiSearch, FiCheck } from 'react-icons/fi';
import { Input } from '@/components/common/Input';

interface TechnicianAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    supervisor: User;
    onAssign: () => void;
}

export const TechnicianAssignmentModal: React.FC<TechnicianAssignmentModalProps> = ({
    isOpen,
    onClose,
    supervisor,
    onAssign,
}) => {
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const { success, error: showError } = useNotification();

    useEffect(() => {
        if (isOpen) {
            loadTechnicians();
            // Pre-select already assigned technicians if available in supervisor object
            if (supervisor.assignedTechnicians) {
                setSelectedIds(supervisor.assignedTechnicians);
            } else {
                setSelectedIds([]);
            }
        }
    }, [isOpen, supervisor]);

    const loadTechnicians = async () => {
        setLoading(true);
        try {
            // Fetch all technicians. In a real app, might want a specific endpoint for "available" ones
            const result = await adminAPI.getUsers({ role: 'technician', limit: 100 });
            if (result.success && result.data) {
                setTechnicians(result.data.users.map((u: any) => ({ ...u, id: u._id || u.id })));
            }
        } catch (err) {
            showError('Failed to load technicians');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.assignTechnicians(supervisor.id, selectedIds);
            success(`Technicians assigned to ${supervisor.fullName}`);
            onAssign();
            onClose();
        } catch (err) {
            showError('Failed to assign technicians');
        } finally {
            setSaving(false);
        }
    };

    const filteredTechnicians = technicians.filter(
        (t) =>
            t.fullName.toLowerCase().includes(search.toLowerCase()) ||
            t.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign Team for ${supervisor.fullName}`} size="lg">
            <div className="space-y-4">
                <Input
                    placeholder="Search technicians..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />

                <div className="border rounded-md max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Spinner size="md" />
                        </div>
                    ) : filteredTechnicians.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No technicians found.</div>
                    ) : (
                        <div className="divide-y">
                            {filteredTechnicians.map((tech) => {
                                const isSelected = selectedIds.includes(tech.id);
                                return (
                                    <div
                                        key={tech.id}
                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => handleToggle(tech.id)}
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{tech.fullName}</p>
                                            <p className="text-sm text-gray-500">{tech.email}</p>
                                        </div>
                                        {isSelected && <FiCheck className="text-blue-600 h-5 w-5" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{selectedIds.length} technicians selected</span>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <Button onClick={onClose} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="primary" loading={saving}>
                        Save Assignments
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
