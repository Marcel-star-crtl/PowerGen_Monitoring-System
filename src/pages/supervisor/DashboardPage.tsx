import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supervisorAPI } from '@/api';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiUsers, FiAlertCircle, FiPlus } from 'react-icons/fi';

const SupervisorDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashData, pendingData] = await Promise.all([
        supervisorAPI.getDashboard(),
        supervisorAPI.getPendingMaintenance({ page: 1, limit: 5 })
      ]);
      setDashboard(dashData);
      setRecentItems(pendingData.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = async (data: any) => {
    setScheduling(true);
    try {
      await supervisorAPI.scheduleMaintenance(data);
      success('Maintenance scheduled successfully!');
      setShowScheduleModal(false);
      loadDashboard(); // Refresh dashboard
    } catch (error) {
      showError('Failed to schedule maintenance');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowScheduleModal(true)} 
            variant="secondary"
          >
            <FiPlus className="mr-2" />
            Schedule Maintenance
          </Button>
          <Button onClick={() => navigate('/supervisor/approvals')} variant="primary">
            View All Approvals
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approval"
          value={dashboard?.pending || 0}
          icon={<FiClock className="h-6 w-6" />}
          color="yellow"
          trend={dashboard?.pending > 10 ? { value: dashboard.pending, isPositive: false } : undefined}
        />
        <StatCard
          title="Approved"
          value={dashboard?.approved || 0}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Rejected"
          value={dashboard?.rejected || 0}
          icon={<FiXCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Completed"
          value={dashboard?.completed || 0}
          icon={<FiTrendingUp className="h-6 w-6" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Approvals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Pending Approvals</h2>
            {recentItems.length > 0 && (
              <Badge variant="yellow">{recentItems.length}</Badge>
            )}
          </div>
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiCheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate('/supervisor/approvals')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.site_details?.Site_Name || item.site_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.technician?.fullName} • {item.visit_type}
                      </p>
                    </div>
                    <Badge variant="yellow" size="sm">
                      {item.days_pending || 0}d
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted {formatRelativeTime(item.submitted_at)}
                  </p>
                </div>
              ))}
              <Button
                onClick={() => navigate('/supervisor/approvals')}
                variant="ghost"
                size="sm"
                fullWidth
              >
                View All →
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions & Stats */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/supervisor/approvals')}
              variant="primary"
              fullWidth
            >
              <FiClock className="mr-2" />
              Review Pending ({dashboard?.pending || 0})
            </Button>
            <Button
              onClick={() => navigate('/supervisor/scheduled')}
              variant="secondary"
              fullWidth
            >
              <FiCheckCircle className="mr-2" />
              View Scheduled ({dashboard?.approved || 0})
            </Button>
            <Button
              onClick={() => setShowScheduleModal(true)}
              variant="secondary"
              fullWidth
            >
              <FiPlus className="mr-2" />
              Schedule New Maintenance
            </Button>
            <Button
              onClick={() => navigate('/supervisor/technicians')}
              variant="secondary"
              fullWidth
            >
              <FiUsers className="mr-2" />
              Manage Technicians
            </Button>
            <Button
              onClick={() => navigate('/supervisor/statistics')}
              variant="secondary"
              fullWidth
            >
              <FiTrendingUp className="mr-2" />
              View Statistics
            </Button>
          </div>

          {dashboard?.avg_approval_time_hours !== undefined && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Approval Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboard.avg_approval_time_hours.toFixed(1)}h
                  </p>
                </div>
                <FiTrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Alerts */}
      {dashboard?.pending > 10 && (
        <Card>
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Action Required</h3>
              <p className="text-sm text-gray-600 mt-1">
                You have {dashboard.pending} maintenance requests awaiting approval. 
                Please review them to keep operations running smoothly.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => !scheduling && setShowScheduleModal(false)}
        title="Schedule Maintenance"
        size="lg"
      >
        <MaintenanceForm
          onSubmit={handleScheduleMaintenance}
          onCancel={() => setShowScheduleModal(false)}
          loading={scheduling}
        />
      </Modal>
    </div>
  );
};

export default SupervisorDashboard;



