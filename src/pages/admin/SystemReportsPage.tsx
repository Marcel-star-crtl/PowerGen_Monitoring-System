import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps
} from 'recharts';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const SystemReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getSystemReports(parseInt(period));
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
        <div className="flex items-center space-x-4">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: '7', label: 'Last 7 Days' },
              { value: '30', label: 'Last 30 Days' },
              { value: '90', label: 'Last 90 Days' },
            ]}
            className="w-48"
          />
          <Button onClick={loadReports} variant="secondary">
            <FiRefreshCw className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={reports?.total_users || 0}
          color="blue"
        />
        <StatCard
          title="Total Sites"
          value={reports?.total_sites || 0}
          color="green"
        />
        <StatCard
          title="Total Maintenance"
          value={reports?.total_maintenance || 0}
          color="yellow"
        />
        <StatCard
          title="Completion Rate"
          value={`${reports?.completion_rate || 0}%`}
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">User Distribution by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reports?.users_by_role || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(reports?.users_by_role || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Maintenance Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports?.maintenance_by_status || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Sites by Region</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports?.sites_by_region || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Daily Activity Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reports?.daily_activity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#3b82f6" name="Visits" />
              <Line type="monotone" dataKey="maintenance" stroke="#22c55e" name="Maintenance" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Export Button */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Export Report</h3>
            <p className="text-sm text-gray-600">Download comprehensive system report</p>
          </div>
          <Button variant="primary">
            <FiDownload className="mr-2" />
            Export PDF
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SystemReportsPage;