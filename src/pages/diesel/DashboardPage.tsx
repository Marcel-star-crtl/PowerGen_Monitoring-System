import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuel } from '@/hooks/useFuel';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { FuelRequestForm } from '@/components/forms/FuelRequestForm';
import { useNotification } from '@/contexts/NotificationContext';
import { formatNumber } from '@/utils/formatters';
import { FiDroplet, FiAlertTriangle, FiTrendingUp, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DieselDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { getDashboard, getLowFuelAlerts, createFuelRequest } = useFuel();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashData, alertsData] = await Promise.all([
        getDashboard(30),
        getLowFuelAlerts(25)
      ]);
      setDashboard(dashData);
      setAlerts(alertsData.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (data: any) => {
    setSubmitting(true);
    try {
      await createFuelRequest(data);
      success('Fuel request created successfully!');
      setShowRequestModal(false);
      loadDashboard();
    } catch (error) {
      showError('Failed to create fuel request');
    } finally {
      setSubmitting(false);
    }
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

  const statusData = dashboard ? [
    { name: 'Critical (<10%)', value: alerts.filter((a: any) => a.fuel_percentage < 10).length, color: '#ef4444' },
    { name: 'Low (10-25%)', value: alerts.filter((a: any) => a.fuel_percentage >= 10 && a.fuel_percentage < 25).length, color: '#f59e0b' },
    { name: 'Medium (25-50%)', value: dashboard.critical_sites - alerts.length, color: '#3b82f6' },
    { name: 'Good (>50%)', value: 100, color: '#22c55e' },
  ].filter(item => item.value > 0) : [];

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
        <h1 className="text-2xl font-bold text-gray-900">Fuel Management Dashboard</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setShowRequestModal(true)} variant="secondary">
            <FiPlus className="mr-2" />
            Create Request
          </Button>
          <Button onClick={() => navigate('/diesel/fuel-requests')} variant="primary">
            View All Requests
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Consumption"
          value={`${formatNumber(dashboard?.total_consumption || 0)} L`}
          icon={<FiDroplet className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={dashboard?.pending_requests || 0}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Critical Sites"
          value={dashboard?.critical_sites || 0}
          icon={<FiAlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Avg Consumption"
          value={`${formatNumber(dashboard?.avg_consumption_rate || 0, 2)} L/h`}
          icon={<FiTrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Status Distribution */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Fuel Level Distribution</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No data available</p>
            </div>
          )}
        </Card>

        {/* Critical Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Critical Fuel Alerts</h2>
            {alerts.length > 0 && (
              <Badge variant="red">{alerts.length}</Badge>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiCheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
              <p>No critical alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div
                  key={alert.site_id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => navigate('/diesel/alerts')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.site_name}</p>
                      <p className="text-sm text-gray-600">{alert.region}</p>
                    </div>
                    <Badge variant="red" size="sm">
                      {alert.fuel_percentage}%
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${alert.fuel_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                onClick={() => navigate('/diesel/alerts')}
                variant="ghost"
                size="sm"
                fullWidth
              >
                View All Alerts →
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions (refueling management commented out) */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/diesel/fuel-requests')} className="cursor-pointer">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <FiCheckCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Pending Requests</p>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.pending_requests || 0}</p>
          </Card>
        </div>

        <div onClick={() => navigate('/diesel/alerts')} className="cursor-pointer">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <FiAlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Critical Sites</p>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.critical_sites || 0}</p>
          </Card>
        </div>

        <div onClick={() => navigate('/diesel/consumption')} className="cursor-pointer">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <FiDroplet className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Consumption</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboard?.total_consumption || 0)}</p>
          </Card>
        </div>

        <div onClick={() => navigate('/diesel/trends')} className="cursor-pointer">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <FiTrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Anomalies</p>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.anomaly_count || 0}</p>
          </Card>
        </div>
      </div>
      */}

      {/* Create Fuel Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => !submitting && setShowRequestModal(false)}
        title="Create Fuel Request"
        size="lg"
      >
        <FuelRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowRequestModal(false)}
          loading={submitting}
          showSiteSelector={true}
        />
      </Modal>
    </div>
  );
};

export default DieselDashboard;


