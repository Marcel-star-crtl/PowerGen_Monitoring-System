import React, { useEffect, useState } from 'react';
import { dieselManagerAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { formatNumber } from '@/utils/formatters';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendsPage: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const { error: showError } = useNotification();

  useEffect(() => {
    loadTrends();
  }, [period]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const data = await dieselManagerAPI.getConsumptionTrends(parseInt(period));
      setTrends(data.trends || []);
    } catch (err) {
      showError('Failed to load consumption trends');
    } finally {
      setLoading(false);
    }
  };

  const chartData = trends.map((item) => ({
    date: `${item._id.month}/${item._id.day}`,
    consumed: item.total_consumed,
    runtime: item.total_runtime,
    efficiency: item.avg_efficiency,
    sites: item.record_count,
  }));

  const totalConsumed = trends.reduce((sum, item) => sum + item.total_consumed, 0);
  const totalRuntime = trends.reduce((sum, item) => sum + item.total_runtime, 0);
  const avgEfficiency = trends.length > 0
    ? trends.reduce((sum, item) => sum + item.avg_efficiency, 0) / trends.length
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
        <h1 className="text-2xl font-bold text-gray-900">Consumption Trends</h1>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Consumption</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalConsumed, 1)} L
              </p>
            </div>
            <FiTrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Runtime</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalRuntime, 1)} h
              </p>
            </div>
            <FiActivity className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(avgEfficiency, 2)} L/h
              </p>
            </div>
            <FiTrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Consumption Trend Chart */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Daily Consumption</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="consumed"
              stroke="#3b82f6"
              name="Consumed (L)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Runtime vs Consumption */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Runtime vs Consumption</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="consumed" fill="#3b82f6" name="Consumed (L)" />
            <Bar yAxisId="right" dataKey="runtime" fill="#22c55e" name="Runtime (h)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Efficiency Trend */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Efficiency Trend (L/h)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#f59e0b"
              name="Efficiency (L/h)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <div className="space-y-3">
          {avgEfficiency > 0.35 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-yellow-900">
                <strong>High consumption rate detected:</strong> Average efficiency is{' '}
                {formatNumber(avgEfficiency, 2)} L/h. Consider investigating potential issues.
              </p>
            </div>
          )}
          {avgEfficiency < 0.25 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm text-green-900">
                <strong>Excellent efficiency:</strong> Average consumption rate is{' '}
                {formatNumber(avgEfficiency, 2)} L/h. Generators are operating efficiently.
              </p>
            </div>
          )}
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">
              <strong>Period Summary:</strong> {formatNumber(totalConsumed, 1)}L consumed over{' '}
              {formatNumber(totalRuntime, 1)} hours across {trends.length} days.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrendsPage;