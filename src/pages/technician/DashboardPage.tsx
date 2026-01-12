import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { technicianAPI } from '@/api';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { VisitForm } from '@/components/forms/VisitForm';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSites } from '@/hooks/useSites';
import { FiFileText, FiClock, FiCheckSquare, FiCheckCircle, FiMapPin, FiPlus } from 'react-icons/fi';

const TechnicianDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentSites, setRecentSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickSubmitModal, setShowQuickSubmitModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();
  const { submitVisit } = useSites();

  useEffect(() => {
    loadDashboard();
    loadRecentSites();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await technicianAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSites = async () => {
    try {
      const { data } = await technicianAPI.getAssignedSites();
      // Get sites that need visits or have recent activity
      const needsVisit = data.filter((site: any) => site.needs_visit).slice(0, 5);
      setRecentSites(needsVisit);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const handleQuickSubmit = async (formData: any, photos: any[], submitNow: boolean) => {
    if (!selectedSite) return;

    try {
      await submitVisit(selectedSite.IHS_ID_SITE, formData, photos, submitNow);
      
      if (submitNow) {
        success('Visit submitted for approval!');
      } else {
        success('Draft saved successfully!');
      }
      
      setShowQuickSubmitModal(false);
      setSelectedSite(null);
      loadDashboard(); // Refresh stats
    } catch (err) {
      showError('Failed to submit visit');
    }
  };

  const openQuickSubmit = (site: any) => {
    setSelectedSite(site);
    setShowQuickSubmitModal(true);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.fullName}</p>
        </div>
        <Button onClick={() => navigate('/technician/sites')} variant="primary">
          <FiPlus className="mr-2" />
          Submit Site Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Drafts"
          value={dashboard?.drafts || 0}
          icon={<FiFileText className="h-6 w-6" />}
          color="gray"
        />
        <StatCard
          title="Pending Approval"
          value={dashboard?.pending_approval || 0}
          icon={<FiClock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Approved Tasks"
          value={dashboard?.approved_tasks || 0}
          icon={<FiCheckSquare className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Completed This Month"
          value={dashboard?.completed_this_month || 0}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/technician/sites')}
              variant="primary"
              fullWidth
            >
              <FiMapPin className="mr-2" />
              View My Sites ({dashboard?.assigned_sites || 0})
            </Button>
            <Button
              onClick={() => navigate('/technician/drafts')}
              variant="secondary"
              fullWidth
            >
              <FiFileText className="mr-2" />
              Continue Draft ({dashboard?.drafts || 0})
            </Button>
            <Button
              onClick={() => navigate('/technician/tasks')}
              variant="secondary"
              fullWidth
            >
              <FiCheckSquare className="mr-2" />
              View My Tasks ({dashboard?.approved_tasks || 0})
            </Button>
            <Button
              onClick={() => navigate('/technician/history')}
              variant="secondary"
              fullWidth
            >
              <FiClock className="mr-2" />
              Visit History
            </Button>
          </div>
        </Card>

        {/* Sites Needing Visit */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sites Needing Visit</h2>
            <Badge variant="red">{recentSites.length}</Badge>
          </div>
          
          {recentSites.length === 0 ? (
            <p className="text-sm text-gray-600">All sites up to date! 🎉</p>
          ) : (
            <div className="space-y-3">
              {recentSites.map((site) => (
                <div
                  key={site.IHS_ID_SITE}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{site.Site_Name}</p>
                      <p className="text-sm text-gray-500">{site.IHS_ID_SITE}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {site.Region} • {site.days_since_last_visit || '90+'} days ago
                      </p>
                    </div>
                    <Button
                      onClick={() => openQuickSubmit(site)}
                      variant="primary"
                      size="sm"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ))}
              
              {recentSites.length > 0 && (
                <Button
                  onClick={() => navigate('/technician/sites')}
                  variant="ghost"
                  fullWidth
                  size="sm"
                >
                  View All Sites
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Sites Assigned</p>
            <p className="text-2xl font-bold text-blue-600">{dashboard?.assigned_sites || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {dashboard?.completed_this_month || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dashboard?.pending_approval || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-2xl font-bold text-gray-600">{dashboard?.drafts || 0}</p>
          </div>
        </div>
      </Card>

      {/* Quick Submit Modal */}
      <Modal
        isOpen={showQuickSubmitModal}
        onClose={() => {
          setShowQuickSubmitModal(false);
          setSelectedSite(null);
        }}
        title={`Submit Visit - ${selectedSite?.Site_Name || selectedSite?.IHS_ID_SITE}`}
        size="xl"
      >
        {selectedSite && (
          <VisitForm
            initialData={{
              technician_id: user?.id || '',
              technician_name: user?.fullName || '',
              Actual_Date_Visit: new Date().toISOString().split('T')[0],
              Type_of_Visit: 'PM',
              priority: 'medium',
            }}
            onSubmit={handleQuickSubmit}
            loading={loading}
          />
        )}
      </Modal>
    </div>
  );
};

export default TechnicianDashboard;


