import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataCollectorAPI } from '@/api';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { formatNumber } from '@/utils/formatters';
import { FiDatabase, FiCheckCircle, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, PieLabelRenderProps } from 'recharts';

const DataCollectorDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dataCollectorAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#22c55e', '#ef4444'];

  const visitCoverageData = dashboard ? [
    { name: 'With Visits', value: dashboard.sites.with_visits, color: '#22c55e' },
    { name: 'Needing Visits', value: dashboard.sites.needing_visits, color: '#ef4444' },
  ] : [];

  const technicianData = dashboard ? [
    { name: 'Active', value: dashboard.technicians.active, color: '#22c55e' },
    { name: 'Inactive', value: dashboard.technicians.inactive, color: '#ef4444' },
  ] : [];

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
        <h1 className="text-2xl font-bold text-gray-900">Data Collector Dashboard</h1>
        <Button onClick={() => navigate('/data-collector/exports')} variant="primary">
          <FiDownload className="mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sites"
          value={dashboard?.sites.total || 0}
          icon={<FiDatabase className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Visit Coverage"
          value={`${dashboard?.sites.visit_coverage || 0}%`}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Active Technicians"
          value={dashboard?.technicians.active || 0}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Data Quality Score"
          value={`${dashboard?.data_quality.score || 0}%`}
          icon={dashboard?.data_quality.score > 80 ? <FiCheckCircle className="h-6 w-6" /> : <FiAlertTriangle className="h-6 w-6" />}
          color={dashboard?.data_quality.score > 80 ? 'green' : 'yellow'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit Coverage Chart */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Site Visit Coverage</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={visitCoverageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                >
                {visitCoverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
               </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">With Visits</p>
              <p className="text-xl font-bold text-green-600">{dashboard?.sites.with_visits || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Need Visits</p>
              <p className="text-xl font-bold text-red-600">{dashboard?.sites.needing_visits || 0}</p>
            </div>
          </div>
        </Card>

        {/* Technician Status */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Technician Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={technicianData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {technicianData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-600">{dashboard?.technicians.active || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-xl font-bold text-gray-600">{dashboard?.technicians.inactive || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Quality Summary */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Data Quality Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Sites</p>
            <p className="text-2xl font-bold text-blue-600">
              {dashboard?.data_quality.total_sites || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Fields Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(dashboard?.data_quality.completed_fields || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Fields Checked</p>
            <p className="text-2xl font-bold text-gray-600">
              {formatNumber(dashboard?.data_quality.total_fields_checked || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Quality Score</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dashboard?.data_quality.score || 0}%
            </p>
          </div>
        </div>
      </Card>

      {/* Records Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Record Counts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Maintenance Records</span>
              <span className="font-bold text-blue-600">
                {formatNumber(dashboard?.records.maintenance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Fuel Records</span>
              <span className="font-bold text-green-600">
                {formatNumber(dashboard?.records.fuel || 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/data-collector/data-quality')}
              variant="secondary"
              fullWidth
            >
              View Data Quality Issues
            </Button>
            <Button
              onClick={() => navigate('/data-collector/missing-data')}
              variant="secondary"
              fullWidth
            >
              Check Missing Data
            </Button>
            <Button
              onClick={() => navigate('/data-collector/exports')}
              variant="secondary"
              fullWidth
            >
              Export Data to Excel
            </Button>
            <Button
              onClick={() => navigate('/data-collector/reports')}
              variant="secondary"
              fullWidth
            >
              View Reports
            </Button>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {dashboard?.sites.visit_coverage < 80 && (
        <Card>
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Low Visit Coverage</h3>
              <p className="text-sm text-gray-600 mt-1">
                Only {dashboard.sites.visit_coverage}% of sites have been visited. 
                {dashboard.sites.needing_visits} sites need attention.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataCollectorDashboard;