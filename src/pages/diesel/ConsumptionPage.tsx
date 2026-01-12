import React, { useState, useEffect } from 'react';
import { useFuel } from '@/hooks/useFuel';
import { sitesAPI } from '@/api';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Table } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { formatDate, formatNumber, formatFuelLevel } from '@/utils/formatters';
import { FiDroplet, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ConsumptionPage: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [consumption, setConsumption] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const { getFuelConsumption } = useFuel();

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadConsumption();
    }
  }, [selectedSite, dateRange]);

  const loadSites = async () => {
    try {
      const result = await sitesAPI.getSites({ limit: 1000 });
      setSites(result.data || []);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadConsumption = async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const result = await getFuelConsumption(selectedSite, {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      setConsumption(result.data.records || []);
      
      // Calculate summary
      const totalConsumed = result.data.records.reduce((sum: number, r: any) => 
        sum + (r.fuel_data?.fuel_consumed || 0), 0);
      const avgRate = result.data.records.reduce((sum: number, r: any) => 
        sum + (r.metrics?.consumption_rate || 0), 0) / (result.data.records.length || 1);
      
      setSummary({
        totalConsumed,
        avgRate,
        recordCount: result.data.records.length,
      });
    } catch (error) {
      console.error('Failed to load consumption:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = consumption.map((record) => ({
    date: formatDate(record.record_date),
    consumed: record.fuel_data?.fuel_consumed || 0,
    rate: record.metrics?.consumption_rate || 0,
  }));

  const columns = [
    {
      key: 'record_date',
      header: 'Date',
      render: (item: any) => formatDate(item.record_date),
    },
    {
      key: 'fuel_consumed',
      header: 'Consumed (L)',
      render: (item: any) => formatNumber(item.fuel_data?.fuel_consumed || 0, 1),
    },
    {
      key: 'fuel_level',
      header: 'Fuel Level',
      render: (item: any) => {
        const level = formatFuelLevel(
          item.fuel_data?.closing_level,
          item.fuel_data?.tank_capacity
        );
        return (
          <div>
            <div className="text-sm">{level.text}</div>
            <div className="h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full ${
                  level.color === 'red' ? 'bg-red-500' :
                  level.color === 'orange' ? 'bg-orange-500' :
                  level.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${level.percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'consumption_rate',
      header: 'Rate (L/h)',
      render: (item: any) => (
        <div className="flex items-center">
          <span>{formatNumber(item.metrics?.consumption_rate || 0, 2)}</span>
          {item.metrics?.efficiency_rating && (
            <Badge
              variant={
                item.metrics.efficiency_rating === 'excellent' ? 'green' :
                item.metrics.efficiency_rating === 'good' ? 'blue' :
                item.metrics.efficiency_rating === 'fair' ? 'yellow' : 'red'
              }
              size="sm"
              className="ml-2"
            >
              {item.metrics.efficiency_rating}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'runtime',
      header: 'Runtime (h)',
      render: (item: any) => formatNumber(item.runtime_data?.runtime_hours || 0, 1),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fuel Consumption Analysis</h1>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Select Site"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            options={[
              { value: '', label: 'Select a site...' },
              ...sites.map((site) => ({
                value: site.IHS_ID_SITE,
                label: `${site.Site_Name || site.IHS_ID_SITE} (${site.Region})`,
              })),
            ]}
            fullWidth
          />
          <Input
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            fullWidth
          />
          <Input
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            fullWidth
          />
        </div>
      </Card>

      {!selectedSite ? (
        <EmptyState
          icon={<FiDroplet className="h-16 w-16 text-gray-400" />}
          title="Select a site"
          description="Choose a site to view fuel consumption data"
        />
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Consumed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(summary.totalConsumed, 1)} L
                    </p>
                  </div>
                  <FiDroplet className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(summary.avgRate, 2)} L/h
                    </p>
                  </div>
                  <FiTrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Records</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.recordCount}</p>
                  </div>
                  <FiTrendingDown className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Consumption Chart */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Consumption Trend</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="consumed"
                    stroke="#3b82f6"
                    name="Consumed (L)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rate"
                    stroke="#22c55e"
                    name="Rate (L/h)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={<FiDroplet className="h-12 w-12 text-gray-400" />}
                title="No data"
                description="No consumption data for selected period"
              />
            )}
          </Card>

          {/* Consumption Table */}
          <Card padding="none">
            <Table
              data={consumption}
              columns={columns}
              loading={loading}
              emptyMessage="No consumption records found"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ConsumptionPage;