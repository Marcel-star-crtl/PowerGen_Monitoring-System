import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/common/Spinner';
import { Badge } from '@/components/common/Badge';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';

const TechnicianAuditsPage: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      setError(null);
      try {
        const { technicianAPI } = await import('@/api');
        const result = await technicianAPI.listAudits();
        setAudits(result.data || result);
      } catch (err) {
        setError('Failed to load site audits');
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Technician Site Audits</h1>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : audits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No site audits found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Site Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Technician</th>
                <th className="px-4 py-2 text-left">Submitted</th>
                <th className="px-4 py-2 text-left">Comments</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit._id} className="border-t">
                  <td className="px-4 py-2">{audit.name_site || audit.site_id_ihs || 'Unknown Site'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={audit.status === 'submitted' ? 'green' : 'gray'} size="sm">
                      {audit.status || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{audit.technician?.fullName || audit.created_by || 'N/A'}</td>
                  <td className="px-4 py-2">{audit.createdAt ? formatRelativeTime(audit.createdAt) : 'N/A'}</td>
                  <td className="px-4 py-2">{audit.comments || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TechnicianAuditsPage;
