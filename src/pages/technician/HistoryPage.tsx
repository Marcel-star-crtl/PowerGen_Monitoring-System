import React, { useEffect, useState } from 'react';
import { technicianAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Table } from '@/components/common/Table';
import { VisitDetailsModal } from '@/components/technician/VisitDetailsModal';
import { formatDate, formatStatus } from '@/utils/formatters';
import { FiCalendar, FiFilter, FiDownload, FiEye, FiEdit2 } from 'react-icons/fi';
import { STATUS_OPTIONS, VISIT_TYPES } from '@/utils/constants';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    visit_type: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { error: showError } = useNotification();

  useEffect(() => {
    loadHistory();
  }, [pagination.current, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await technicianAPI.getVisitHistory({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });
      setHistory(result.data);
      setPagination(result.pagination);
    } catch (err) {
      showError('Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      status: '',
      visit_type: '',
    });
  };

  const exportToCSV = () => {
    // Simple CSV export
    const headers = ['Date', 'Site', 'Visit Type', 'Status'];
    const rows = history.map((visit) => [
      formatDate(visit.Actual_Date_Visit),
      visit.Site_Name || visit.site_id,
      visit.Type_of_Visit,
      visit.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visit_history_${Date.now()}.csv`;
    link.click();
  };

  const columns = [
    {
      key: 'Actual_Date_Visit',
      header: 'Date',
      render: (item: any) => formatDate(item.Actual_Date_Visit),
    },
    {
      key: 'Site_Name',
      header: 'Site',
      render: (item: any) => (
        <div>
          <p className="font-medium">{item.Site_Name || 'Unknown'}</p>
          <p className="text-sm text-gray-500">{item.site_id}</p>
        </div>
      ),
    },
    {
      key: 'Type_of_Visit',
      header: 'Visit Type',
      render: (item: any) => <Badge variant="blue">{item.Type_of_Visit}</Badge>,
    },
    {
      key: 'Region',
      header: 'Region',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const status = formatStatus(item.status);
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      },
    },
    {
      key: 'photos',
      header: 'Photos',
      render: (item: any) => (
        <span className="text-sm text-gray-600">{item.photos?.length || 0}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => {
        const canEdit = item.status === 'draft' || item.status === 'rejected';
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                setSelectedVisit(item);
                setShowDetailsModal(true);
              }}
              variant="ghost"
              size="sm"
              title="View Details"
            >
              <FiEye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  setSelectedVisit(item);
                  setShowDetailsModal(true);
                }}
                variant="ghost"
                size="sm"
                title="Edit"
              >
                <FiEdit2 className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
        <Button onClick={exportToCSV} variant="secondary" size="sm">
          <FiDownload className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              fullWidth
            />
            <Input
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              fullWidth
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
              fullWidth
            />
            <Select
              label="Visit Type"
              value={filters.visit_type}
              onChange={(e) => handleFilterChange('visit_type', e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...VISIT_TYPES]}
              fullWidth
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={<FiCalendar className="h-16 w-16 text-gray-400" />}
            title="No visit history"
            description="No visits found matching your filters"
          />
        ) : (
          <>
            <Table
              data={history}
              columns={columns}
              loading={loading}
              emptyMessage="No visits found"
            />
            <Pagination
              currentPage={pagination.current}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, current: page }))}
            />
          </>
        )}
      </Card>

      {/* Statistics Summary */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {history.filter((v) => v.status === 'completed').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {history.filter((v) => v.status === 'pending_approval').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Photos</p>
              <p className="text-2xl font-bold text-blue-600">
                {history.reduce((sum, v) => sum + (v.photos?.length || 0), 0)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Visit Details Modal */}
      <VisitDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVisit(null);
        }}
        visit={selectedVisit}
        onUpdate={loadHistory}
      />
    </div>
  );
};

export default HistoryPage;