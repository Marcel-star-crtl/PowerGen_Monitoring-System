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
import { Select } from '@/components/common/Select';
import { formatDate, formatStatus, formatPriority } from '@/utils/formatters';
import { FiCheckSquare, FiPlay, FiCheck, FiEye } from 'react-icons/fi';

const TasksPage: React.FC = () => {
  const { user } = useAuthContext();
  const { getTasks, startTask, completeTask, loading } = useMaintenance(user?.role!);
  const { success, error: showError } = useNotification();

  const [tasks, setTasks] = useState<Maintenance[]>([]);
  const [statusFilter, setStatusFilter] = useState('approved');
  const [selectedTask, setSelectedTask] = useState<Maintenance | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      const result = await getTasks({ status: statusFilter || undefined });
      setTasks(result.data);
    } catch (err) {
      showError('Failed to load tasks');
    }
  };

  const handleStart = async (task: Maintenance) => {
    try {
      await startTask(task._id);
      success('Task started!');
      loadTasks();
    } catch (err) {
      showError('Failed to start task');
    }
  };

  const handleComplete = async () => {
    if (!selectedTask) return;

    try {
      await completeTask(selectedTask._id, completionNotes);
      success('Task marked as completed!');
      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionNotes('');
      loadTasks();
    } catch (err) {
      showError('Failed to complete task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Tasks' },
            { value: 'approved', label: 'Approved' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="w-48"
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<FiCheckSquare className="h-16 w-16 text-gray-400" />}
          title="No tasks"
          description={`No ${statusFilter || ''} tasks available`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => {
            const status = formatStatus(task.status);
            const priority = formatPriority(task.priority);

            return (
              <Card key={task._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.site_details?.Site_Name || task.site_id}
                      </h3>
                      <p className="text-sm text-gray-500">{task.site_id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={priority.color as any}>{priority.label}</Badge>
                      <Badge variant={getStatusColor(task.status) as any}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Visit Date</p>
                      <p className="font-medium">{formatDate(task.visit_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Type</p>
                      <p className="font-medium">{task.visit_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Supervisor</p>
                      <p className="font-medium">{task.supervisor.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Approved</p>
                      <p className="font-medium">
                        {task.reviewed_at ? formatDate(task.reviewed_at) : '-'}
                      </p>
                    </div>
                  </div>

                  {task.work_performed && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Work to Perform:</p>
                      <p className="text-sm text-gray-900">{task.work_performed}</p>
                    </div>
                  )}

                  {task.review_comments && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Supervisor Comments:
                      </p>
                      <p className="text-sm text-blue-800">{task.review_comments}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowDetailsModal(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </Button>

                    {task.status === 'approved' && (
                      <Button onClick={() => handleStart(task)} variant="primary" size="sm">
                        <FiPlay className="mr-1" />
                        Start Task
                      </Button>
                    )}

                    {task.status === 'in_progress' && (
                      <Button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowCompleteModal(true);
                        }}
                        variant="success"
                        size="sm"
                      >
                        <FiCheck className="mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Task Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedTask(null);
          setCompletionNotes('');
        }}
        title="Complete Task"
        size="md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Site</p>
              <p className="font-medium">{selectedTask.site_details?.Site_Name}</p>
            </div>
            <Textarea
              label="Completion Notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any additional notes about the completed work..."
              rows={4}
              fullWidth
            />
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowCompleteModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleComplete} variant="success" loading={loading}>
                Mark as Complete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTask(null);
        }}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <p className="font-medium">{selectedTask.site_details?.Site_Name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visit Type</p>
                <p className="font-medium">{selectedTask.visit_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visit Date</p>
                <p className="font-medium">{formatDate(selectedTask.visit_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                
                <Badge variant={formatPriority(selectedTask.priority).color as any}>
                  {formatPriority(selectedTask.priority).label}
                </Badge>
              </div>
            </div>

            {selectedTask.work_performed && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Work Description</p>
                <p className="text-gray-900">{selectedTask.work_performed}</p>
              </div>
            )}

            {selectedTask.parts_used && selectedTask.parts_used.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Parts Required</p>
                <div className="space-y-2">
                  {selectedTask.parts_used.map((part, idx) => (
                    <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>{part.part_name}</span>
                      <span className="font-medium">Qty: {part.quantity_used}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTask.status === 'approved' && (
              <div className="flex justify-end">
                <Button onClick={() => handleStart(selectedTask)} variant="primary">
                  Start Task
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TasksPage;