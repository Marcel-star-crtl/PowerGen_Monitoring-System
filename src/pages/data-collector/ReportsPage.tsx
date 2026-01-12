import React, { useEffect, useState } from 'react';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { formatNumber } from '@/utils/formatters';
import { FiActivity, FiMapPin } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportsPage: React.FC = () => {
  const [activityReport, setActivityReport] = useState<any>(null);
  const [coverageReport, setCoverageReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [groupBy, setGroupBy] = useState('region');
  const { error: showError } = useNotification();

  useEffect(() => {
    loadReports();
  }, [period, groupBy]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [activity, coverage] = await Promise.all([
        dataCollectorAPI.getTechnicianActivityReport(parseInt(period)),
        dataCollectorAPI.getVisitCoverageReport(groupBy as 'region' | 'cluster'),
      ]);
      setActivityReport(activity);
      setCoverageReport(coverage);
    } catch (err) {
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    {
      key: 'technician_name',
      header: 'Technician',
      render: (item: any) => (
        <div>
          <p className="font-medium">{item.technician_name}</p>
          <p className="text-sm text-gray-500">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'sites_assigned',
      header: 'Sites',
      render: (item: any) => <Badge variant="blue">{item.sites_assigned}</Badge>,
    },
    {
      key: 'visits_submitted',
      header: 'Visits',
      render: (item: any) => <Badge variant="green">{item.visits_submitted}</Badge>,
    },
    {
      key: 'maintenance_completed',
      header: 'Completed',
      render: (item: any) => <Badge variant="green">{item.maintenance_completed}</Badge>,
    },
    {
      key: 'activity_score',
      header: 'Activity Score',
      render: (item: any) => (
        <div className="text-center">
          <span className="font-bold text-gray-900">{item.activity_score}</span>
        </div>
      ),
    },
  ];

  const coverageChartData = coverageReport?.coverage?.map((item: any) => ({
    name: item._id || 'Unknown',
    total: item.total_sites,
    visited: item.sites_with_visits,
    coverage: item.coverage_percentage,
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* Technician Activity Report */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiActivity className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Technician Activity Report</h2>
          </div>
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

        {activityReport && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Technicians</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activityReport.summary?.total_technicians || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activityReport.summary?.active || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {activityReport.summary?.inactive || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Visits</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatNumber(activityReport.summary?.avg_visits || 0, 1)}
                </p>
              </div>
            </div>

            <Table
              data={activityReport.technicians || []}
              columns={activityColumns}
              loading={loading}
              emptyMessage="No activity data"
            />
          </>
        )}
      </Card>

      {/* Visit Coverage Report */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiMapPin className="h-5 w-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold">Visit Coverage Report</h2>
          </div>
          <Select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            options={[
              { value: 'region', label: 'By Region' },
              { value: 'cluster', label: 'By Cluster' },
            ]}
            className="w-48"
          />
        </div>

        {coverageReport && (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="Total Sites" />
                <Bar yAxisId="left" dataKey="visited" fill="#22c55e" name="Visited Sites" />
                <Bar yAxisId="right" dataKey="coverage" fill="#f59e0b" name="Coverage %" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {groupBy === 'region' ? 'Region' : 'Cluster'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Sites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      With Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recent Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Coverage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recent Coverage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coverageReport.coverage?.map((item: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {item._id || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.total_sites}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.sites_with_visits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.recent_visits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            item.coverage_percentage > 80 ? 'green' :
                            item.coverage_percentage > 60 ? 'blue' :
                            item.coverage_percentage > 40 ? 'yellow' : 'red'
                          }
                        >
                          {formatNumber(item.coverage_percentage, 1)}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            item.recent_coverage_percentage > 80 ? 'green' :
                            item.recent_coverage_percentage > 60 ? 'blue' :
                            item.recent_coverage_percentage > 40 ? 'yellow' : 'red'
                          }
                        >
                          {formatNumber(item.recent_coverage_percentage, 1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Insights */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <div className="space-y-3">
          {activityReport?.summary?.inactive > 0 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-yellow-900">
                <strong>Inactive Technicians:</strong> {activityReport.summary.inactive} technician
                {activityReport.summary.inactive !== 1 ? 's' : ''} have no activity in the selected period.
              </p>
            </div>
          )}

          {coverageReport?.coverage?.some((item: any) => item.coverage_percentage < 50) && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-900">
                <strong>Low Coverage Alert:</strong> Some {groupBy}s have less than 50% visit coverage. 
                Consider reassigning sites or scheduling more visits.
              </p>
            </div>
          )}

          {activityReport?.summary?.avg_visits > 10 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm text-green-900">
                <strong>High Activity:</strong> Average of {formatNumber(activityReport.summary.avg_visits, 1)} visits 
                per technician. Team is performing well!
              </p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">
              <strong>Data Period:</strong> This report covers the last {period} days of activity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;