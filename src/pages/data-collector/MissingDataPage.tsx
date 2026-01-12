import React, { useEffect, useState } from 'react';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { FiFileText } from 'react-icons/fi';

const MissingDataPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useNotification();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await dataCollectorAPI.getMissingDataReport();
      setReport(data);
    } catch (err) {
      showError('Failed to load missing data report');
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
      <h1 className="text-2xl font-bold text-gray-900">Missing Data Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sites Without Visits */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sites Without Visits</h3>
            <Badge variant="red">{report?.sites_without_visits?.count || 0}</Badge>
          </div>
          {report?.sites_without_visits?.samples?.length > 0 ? (
            <div className="space-y-2">
              {report.sites_without_visits.samples.slice(0, 5).map((site: any) => (
                <div key={site.IHS_ID_SITE} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{site.Site_Name || site.IHS_ID_SITE}</p>
                  <p className="text-gray-500 text-xs">{site.Region}</p>
                </div>
              ))}
              {report.sites_without_visits.count > 5 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  +{report.sites_without_visits.count - 5} more
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText className="h-8 w-8 text-gray-400" />}
              title="All sites have visits"
            />
          )}
        </Card>

        {/* Sites Without Technicians */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sites Without Technicians</h3>
            <Badge variant="orange">{report?.sites_without_technicians?.count || 0}</Badge>
          </div>
          {report?.sites_without_technicians?.samples?.length > 0 ? (
            <div className="space-y-2">
              {report.sites_without_technicians.samples.slice(0, 5).map((site: any) => (
                <div key={site.IHS_ID_SITE} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{site.Site_Name || site.IHS_ID_SITE}</p>
                  <p className="text-gray-500 text-xs">{site.Region}</p>
                </div>
              ))}
              {report.sites_without_technicians.count > 5 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  +{report.sites_without_technicians.count - 5} more
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText className="h-8 w-8 text-gray-400" />}
              title="All sites assigned"
            />
          )}
        </Card>

        {/* Sites Without Clusters */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sites Without Clusters</h3>
            <Badge variant="yellow">{report?.sites_without_clusters?.count || 0}</Badge>
          </div>
          {report?.sites_without_clusters?.samples?.length > 0 ? (
            <div className="space-y-2">
              {report.sites_without_clusters.samples.slice(0, 5).map((site: any) => (
                <div key={site.IHS_ID_SITE} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{site.Site_Name || site.IHS_ID_SITE}</p>
                  <p className="text-gray-500 text-xs">{site.Region}</p>
                </div>
              ))}
              {report.sites_without_clusters.count > 5 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  +{report.sites_without_clusters.count - 5} more
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText className="h-8 w-8 text-gray-400" />}
              title="All sites have clusters"
            />
          )}
        </Card>

        {/* Sites Without Coordinates */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sites Without Coordinates</h3>
            <Badge variant="blue">{report?.sites_without_coordinates?.count || 0}</Badge>
          </div>
          {report?.sites_without_coordinates?.samples?.length > 0 ? (
            <div className="space-y-2">
              {report.sites_without_coordinates.samples.slice(0, 5).map((site: any) => (
                <div key={site.IHS_ID_SITE} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{site.Site_Name || site.IHS_ID_SITE}</p>
                  <p className="text-gray-500 text-xs">{site.Region}</p>
                </div>
              ))}
              {report.sites_without_coordinates.count > 5 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  +{report.sites_without_coordinates.count - 5} more
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText className="h-8 w-8 text-gray-400" />}
              title="All sites have coordinates"
            />
          )}
        </Card>

        {/* Technicians Without Sites */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Technicians Without Sites</h3>
            <Badge variant="gray">{report?.technicians_without_sites?.count || 0}</Badge>
          </div>
          {report?.technicians_without_sites?.list?.length > 0 ? (
            <div className="space-y-2">
              {report.technicians_without_sites.list.map((tech: any) => (
                <div key={tech._id} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{tech.fullName}</p>
                  <p className="text-gray-500 text-xs">{tech.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText className="h-8 w-8 text-gray-400" />}
              title="All technicians assigned"
            />
          )}
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">No Visits</p>
            <p className="text-2xl font-bold text-red-600">
              {report?.sites_without_visits?.count || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">No Technician</p>
            <p className="text-2xl font-bold text-orange-600">
              {report?.sites_without_technicians?.count || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">No Cluster</p>
            <p className="text-2xl font-bold text-yellow-600">
              {report?.sites_without_clusters?.count || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">No Coordinates</p>
            <p className="text-2xl font-bold text-blue-600">
              {report?.sites_without_coordinates?.count || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Unassigned Techs</p>
            <p className="text-2xl font-bold text-gray-600">
              {report?.technicians_without_sites?.count || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MissingDataPage;