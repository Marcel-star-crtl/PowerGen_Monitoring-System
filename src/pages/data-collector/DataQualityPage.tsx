import React, { useEffect, useState } from 'react';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Table } from '@/components/common/Table';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

interface DataQualityIssue {
  site_id: string;
  site_name: string;
  region: string;
  missing_fields: string[];
  severity: 'low' | 'medium' | 'high';
}

const DataQualityPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useNotification();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await dataCollectorAPI.getDataQualityReport();
      setReport(data);
    } catch (err) {
      showError('Failed to load data quality report');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, any> = {
      low: 'gray',
      medium: 'yellow',
      high: 'red',
    };
    return colors[severity] || 'gray';
  };

  const columns = [
    {
      key: 'site_id',
      header: 'Site ID',
      render: (item: DataQualityIssue) => (
        <div>
          <p className="font-medium">{item.site_id}</p>
          <p className="text-sm text-gray-500">{item.site_name}</p>
        </div>
      ),
    },
    {
      key: 'region',
      header: 'Region',
    },
    {
      key: 'missing_fields',
      header: 'Missing Fields',
      render: (item: DataQualityIssue) => (
        <div className="flex flex-wrap gap-1">
          {item.missing_fields.map((field, idx) => (
            <Badge key={idx} variant="red" size="sm">
              {field}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (item: DataQualityIssue) => (
        <Badge variant={getSeverityColor(item.severity)}>
          {item.severity.toUpperCase()}
        </Badge>
      ),
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Data Quality Report</h1>
        {report && (
          <Badge variant={report.total_sites_with_issues === 0 ? 'green' : 'yellow'}>
            {report.total_sites_with_issues} Issue{report.total_sites_with_issues !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{report.total_sites_with_issues}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">High Severity</p>
              <p className="text-2xl font-bold text-red-600">{report.summary?.high_severity || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Medium Severity</p>
              <p className="text-2xl font-bold text-yellow-600">
                {report.summary?.medium_severity || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Low Severity</p>
              <p className="text-2xl font-bold text-gray-600">{report.summary?.low_severity || 0}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Issues Table */}
      <Card padding="none">
        {!report || report.issues.length === 0 ? (
          <EmptyState
            icon={<FiCheckCircle className="h-16 w-16 text-green-400" />}
            title="No data quality issues"
            description="All sites have complete data"
          />
        ) : (
          <Table
            data={report.issues}
            columns={columns}
            loading={loading}
            emptyMessage="No issues found"
          />
        )}
      </Card>

      {/* Recommendations */}
      {report && report.total_sites_with_issues > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiAlertTriangle className="mr-2 text-yellow-500" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {report.summary?.high_severity > 0 && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-900">
                  <strong>High Priority:</strong> {report.summary.high_severity} sites need immediate attention. These sites are missing critical information.
                </p>
              </div>
            )}
            {report.summary?.medium_severity > 0 && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-900">
                  <strong>Medium Priority:</strong> {report.summary.medium_severity} sites have incomplete data that should be updated soon.
                </p>
              </div>
            )}
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Contact technicians to update missing site information during their next visit.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataQualityPage;