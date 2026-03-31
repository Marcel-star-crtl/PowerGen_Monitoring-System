import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { operationsAPI } from '@/api';
import { FiClipboard, FiCheckCircle, FiFileText } from 'react-icons/fi';

const OperationsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, submitted: 0, drafts: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const total = await operationsAPI.listAudits({ limit: 1 });
        const submitted = await operationsAPI.listAudits({ status: 'submitted', limit: 1 });
        const drafts = await operationsAPI.listAudits({ status: 'draft', limit: 1 });

        setStats({
          total: total.pagination?.total || 0,
          submitted: submitted.pagination?.total || 0,
          drafts: drafts.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Operations dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <Button onClick={() => navigate('/operations/audits')} variant="primary">
          <FiClipboard className="mr-2" />
          View Audits
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Audits" value={stats.total} icon={<FiClipboard className="h-6 w-6" />} color="blue" />
        <StatCard title="Submitted" value={stats.submitted} icon={<FiCheckCircle className="h-6 w-6" />} color="green" />
        <StatCard title="Drafts" value={stats.drafts} icon={<FiFileText className="h-6 w-6" />} color="yellow" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/operations/audits')} variant="secondary">
            Review Submitted Audits
          </Button>
          <Button onClick={() => navigate('/operations/audits?status=draft')} variant="secondary">
            Review Drafts
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OperationsDashboard;
