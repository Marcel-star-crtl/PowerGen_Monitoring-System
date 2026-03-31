import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '@/api/endpoints/admin';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/common/Button';
import {
  FiUsers,
  FiMapPin,
  FiTool,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiSettings,
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button onClick={() => navigate('/admin/settings')} variant="ghost">
          <FiSettings className="mr-2" />
          System Settings
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={dashboard?.users?.total || 0}
          icon={<FiUsers className="h-6 w-6 text-primary" />}
          color="red"
        />
        <StatCard
          title="Total Sites"
          value={dashboard?.sites?.total || 0}
          icon={<FiMapPin className="h-6 w-6 text-primary" />}
          color="red"
        />
        <StatCard
          title="Active Maintenance"
          value={dashboard?.maintenance?.active || 0}
          icon={<FiTool className="h-6 w-6 text-warning" />}
          color="yellow"
        />
        <StatCard
          title="Pending Approvals"
          value={dashboard?.maintenance?.pending || 0}
          icon={<FiClock className="h-6 w-6 text-danger" />}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/admin/users')}
            variant="primary"
            fullWidth
          >
            <FiUsers className="mr-2 text-primary-light" />
            Manage Users
          </Button>
          <Button
            onClick={() => navigate('/admin/sites')}
            variant="primary"
            fullWidth
          >
            <FiMapPin className="mr-2 text-primary-light" />
            Manage Sites
          </Button>
          <Button
            onClick={() => navigate('/admin/maintenance')}
            variant="primary"
            fullWidth
          >
            <FiTool className="mr-2 text-primary-light" />
            View Maintenance
          </Button>
          <Button
            onClick={() => navigate('/admin/reports')}
            variant="primary"
            fullWidth
          >
            <FiCheckCircle className="mr-2 text-primary-light" />
            System Reports
          </Button>
        </div>
      </Card>

      {/* Statistics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard?.users?.by_role || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#e53935" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Maintenance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboard?.maintenance?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#e53935" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {dashboard?.recent_activity?.slice(0, 5).map((activity: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'user' && <FiUsers className="h-5 w-5 text-primary" />}
                  {activity.type === 'maintenance' && <FiTool className="h-5 w-5 text-success" />}
                  {activity.type === 'alert' && <FiAlertTriangle className="h-5 w-5 text-warning" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <FiCheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
            <p className="text-sm text-gray-500">System Status</p>
            <p className="text-lg font-bold text-green-600">Healthy</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <FiUsers className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-lg font-bold text-blue-600">
              {dashboard?.users?.active || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <FiAlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">System Alerts</p>
            <p className="text-lg font-bold text-yellow-600">
              {dashboard?.alerts?.count || 0}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;