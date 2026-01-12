import React, { useEffect, useState } from 'react';
import { supervisorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import { FiCheckCircle, FiXCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { formatNumber } from '@/utils/formatters';

interface Statistics {
  period_days: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  avg_approval_time_hours: number;
  by_priority: Record<string, number>;
  by_visit_type: Record<string, number>;
}

const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const { error: showError } = useNotification();

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const data = await supervisorAPI.getMaintenanceStats(parseInt(period));
      setStats(data);
    } catch (err) {
      showError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  const priorityData = stats?.by_priority
    ? Object.entries(stats.by_priority).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const visitTypeData = stats?.by_visit_type
    ? Object.entries(stats.by_visit_type).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const statusData = stats
    ? [
        { name: 'Completed', value: stats.completed, color: '#22c55e' },
        { name: 'Approved', value: stats.approved, color: '#3b82f6' },
        { name: 'Pending', value: stats.pending, color: '#f59e0b' },
        { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
      ]
    : [];

  const totalMaintenance = stats
    ? stats.completed + stats.approved + stats.pending + stats.rejected
    : 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Statistics & Reports</h1>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: '7', label: 'Last 7 Days' },
            { value: '30', label: 'Last 30 Days' },
            { value: '90', label: 'Last 90 Days' },
            { value: '365', label: 'Last Year' },
          ]}
          className="w-48"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Maintenance"
          value={totalMaintenance}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={<FiCheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pending Approval"
          value={stats?.pending || 0}
          icon={<FiClock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Avg Approval Time"
          value={`${formatNumber(stats?.avg_approval_time_hours || 0, 1)}h`}
          icon={<FiTrendingUp className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
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
        </Card>

        {/* Visit Type Bar Chart */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Visit Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visitTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Priority Levels</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalMaintenance > 0
                    ? `${formatNumber((stats!.completed / totalMaintenance) * 100, 1)}%`
                    : '0%'}
                </p>
              </div>
              <FiCheckCircle className="h-12 w-12 text-green-500" />
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats && stats.approved + stats.rejected > 0
                    ? `${formatNumber(
                        (stats.approved / (stats.approved + stats.rejected)) * 100,
                        1
                      )}%`
                    : '0%'}
                </p>
              </div>
              <FiTrendingUp className="h-12 w-12 text-blue-500" />
            </div>

            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Rejection Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats && stats.approved + stats.rejected > 0
                    ? `${formatNumber(
                        (stats.rejected / (stats.approved + stats.rejected)) * 100,
                        1
                      )}%`
                    : '0%'}
                </p>
              </div>
              <FiXCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Maintenance
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {totalMaintenance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">100%</td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Completed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats?.completed || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {totalMaintenance > 0
                    ? `${formatNumber((stats!.completed / totalMaintenance) * 100, 1)}%`
                    : '0%'}
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Approved
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats?.approved || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {totalMaintenance > 0
                    ? `${formatNumber((stats!.approved / totalMaintenance) * 100, 1)}%`
                    : '0%'}
                </td>
              </tr>
              <tr className="bg-yellow-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Pending
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats?.pending || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {totalMaintenance > 0
                    ? `${formatNumber((stats!.pending / totalMaintenance) * 100, 1)}%`
                    : '0%'}
                </td>
              </tr>
              <tr className="bg-red-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Rejected
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats?.rejected || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {totalMaintenance > 0
                    ? `${formatNumber((stats!.rejected / totalMaintenance) * 100, 1)}%`
                    : '0%'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <div className="space-y-3">
          {stats && (
            <>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Average approval time:</strong> {formatNumber(stats.avg_approval_time_hours, 1)} hours
                  {stats.avg_approval_time_hours < 24 && ' - Excellent response time!'}
                </p>
              </div>
              {stats.pending > 10 && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="text-sm text-yellow-900">
                    <strong>Action needed:</strong> {stats.pending} maintenance requests pending approval
                  </p>
                </div>
              )}
              {stats.rejected / (stats.approved + stats.rejected) > 0.2 && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-900">
                    <strong>High rejection rate:</strong> Consider providing more guidance to technicians
                  </p>
                </div>
              )}
              {stats.completed > stats.approved && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-green-900">
                    <strong>Great progress:</strong> More tasks completed than pending!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StatisticsPage;