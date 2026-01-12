import React, { useEffect, useState } from 'react';
import { supervisorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Table } from '@/components/common/Table';
import { formatPhoneNumber } from '@/utils/formatters';
import { FiUsers, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const TechniciansPage: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { error: showError } = useNotification();

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = technicians.filter(
        (tech) =>
          tech.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.phone?.includes(searchQuery)
      );
      setFilteredTechnicians(filtered);
    } else {
      setFilteredTechnicians(technicians);
    }
  }, [searchQuery, technicians]);

  const loadTechnicians = async () => {
    try {
      const result = await supervisorAPI.getTechnicians();
      setTechnicians(result.data);
      setFilteredTechnicians(result.data);
    } catch (err) {
      showError('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      render: (tech: any) => (
        <div>
          <p className="font-medium text-gray-900">{tech.fullName}</p>
          <p className="text-sm text-gray-500">{tech.role}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (tech: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <FiMail className="mr-2 h-4 w-4" />
            {tech.email}
          </div>
          {tech.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <FiPhone className="mr-2 h-4 w-4" />
              {formatPhoneNumber(tech.phone)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'sites_assigned',
      header: 'Sites Assigned',
      render: (tech: any) => (
        <div className="text-center">
          <Badge variant="blue">{tech.sites_assigned || 0}</Badge>
        </div>
      ),
    },
    {
      key: 'completed_tasks',
      header: 'Completed Tasks',
      render: (tech: any) => (
        <div className="text-center">
          <Badge variant="green">{tech.completed_tasks || 0}</Badge>
        </div>
      ),
    },
    {
      key: 'pending_tasks',
      header: 'Pending Tasks',
      render: (tech: any) => (
        <div className="text-center">
          <Badge variant="yellow">{tech.pending_tasks || 0}</Badge>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (tech: any) => (
        <Badge variant={tech.isActive ? 'green' : 'gray'}>
          {tech.isActive ? 'Active' : 'Inactive'}
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
        <h1 className="text-2xl font-bold text-gray-900">My Technicians</h1>
        <Badge variant="blue">{filteredTechnicians.length} Technician{filteredTechnicians.length !== 1 ? 's' : ''}</Badge>
      </div>

      <Card>
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          className="max-w-md"
        />
      </Card>

      <Card padding="none">
        {filteredTechnicians.length === 0 ? (
          <EmptyState
            icon={<FiUsers className="h-16 w-16 text-gray-400" />}
            title="No technicians found"
            description={searchQuery ? 'Try adjusting your search query' : 'No technicians assigned to you'}
          />
        ) : (
          <Table
            data={filteredTechnicians}
            columns={columns}
            loading={loading}
            emptyMessage="No technicians found"
          />
        )}
      </Card>

      {/* Summary Stats */}
      {filteredTechnicians.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Technicians</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTechnicians.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredTechnicians.filter((t) => t.isActive).length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Sites</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredTechnicians.reduce((sum, t) => sum + (t.sites_assigned || 0), 0)}
              </p>
            </div>
          </Card>
          {/* <Card></Card> */}
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredTechnicians.reduce((sum, t) => sum + (t.completed_tasks || 0), 0)}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TechniciansPage;