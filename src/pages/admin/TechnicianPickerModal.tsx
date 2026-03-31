import React, { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiX, FiCheck, FiUser, FiLoader } from 'react-icons/fi';
import { adminAPI } from '@/api/endpoints/admin';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface Technician {
  id: string;
  fullName: string;
  email: string;
  isActive?: boolean;
  phone?: string;
}

interface TechnicianPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  /** IDs already assigned to this cluster — shown as pre-checked & disabled */
  assignedIds: string[];
  onAssign: (technicianId: string) => Promise<void>;
}

const TechnicianPickerModal: React.FC<TechnicianPickerModalProps> = ({
  isOpen,
  onClose,
  clusterName,
  assignedIds,
  onAssign,
}) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null); // techId being assigned right now

  // Fetch all technicians when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSearch('');
    adminAPI
      .getUsers({ role: 'technician', limit: 200 })
      .then((result: any) => {
        if (result.success && result.data?.users) {
          setTechnicians(
            result.data.users.map((u: any) => ({
              id: u._id || u.id,
              fullName: u.fullName || '(no name)',
              email: u.email || '',
              isActive: u.isActive,
              phone: u.phone || '',
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return technicians;
    return technicians.filter(
      t =>
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.phone && t.phone.includes(q))
    );
  }, [technicians, search]);

  const handleAssign = async (techId: string) => {
    setAssigning(techId);
    try {
      await onAssign(techId);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Technician — ${clusterName}`}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Search bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Summary counts */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{technicians.length} total technicians</span>
          <span>·</span>
          <span className="text-blue-600 font-medium">{assignedIds.length} already assigned</span>
          {search && (
            <>
              <span>·</span>
              <span>{filtered.length} matching</span>
            </>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-96 -mx-6 px-6 divide-y divide-gray-100">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <FiLoader className="animate-spin h-5 w-5" />
              <span className="text-sm">Loading technicians…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {search ? `No technicians matching "${search}"` : 'No technicians found'}
            </div>
          )}

          {!loading &&
            filtered.map(tech => {
              const isAssigned = assignedIds.includes(tech.id);
              const isBeingAssigned = assigning === tech.id;

              return (
                <div
                  key={tech.id}
                  className={`flex items-center justify-between py-3 gap-3
                    ${isAssigned ? 'opacity-60' : ''}`}
                >
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                      ${isAssigned
                        ? 'bg-blue-100 text-blue-600'
                        : tech.isActive
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-50 text-red-400'
                      }`}
                    >
                      {tech.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{tech.fullName}</p>
                        {!tech.isActive && (
                          <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{tech.email}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  {isAssigned ? (
                    <span className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <FiCheck className="h-3.5 w-3.5" />
                      Assigned
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssign(tech.id)}
                      disabled={isBeingAssigned}
                    >
                      {isBeingAssigned ? (
                        <FiLoader className="animate-spin h-3.5 w-3.5" />
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TechnicianPickerModal;