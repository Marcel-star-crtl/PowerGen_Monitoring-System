import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { REGIONS } from '@/utils/constants';
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi';

const SitesManagementPage: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });
  const [formData, setFormData] = useState({
    IHS_ID_SITE: '',
    Site_Name: '',
    Region: '',
    GRATO_Cluster: '',
    Latitude: '',
    Longitude: '',
    Technician_Name: '',
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadSites();
  }, [pagination.current, searchQuery, regionFilter]);

  const loadSites = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAllSites({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
        region: regionFilter || undefined,
      });
      if (result.success && result.data) {
        setSites(result.data.sites);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      showError('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await adminAPI.createSite(formData);
      success('Site created successfully!');
      setShowModal(false);
      resetForm();
      loadSites();
    } catch (err) {
      showError('Failed to create site');
    }
  };

  const handleUpdate = async () => {
    if (!selectedSite) return;

    try {
      await adminAPI.updateSite(selectedSite.IHS_ID_SITE, formData);
      success('Site updated successfully!');
      setShowModal(false);
      resetForm();
      loadSites();
    } catch (err) {
      showError('Failed to update site');
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;

    try {
      await adminAPI.deleteSite(siteId);
      success('Site deleted successfully!');
      loadSites();
    } catch (err) {
      showError('Failed to delete site');
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setSelectedSite(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (site: any) => {
    setModalType('edit');
    setSelectedSite(site);
    setFormData({
      IHS_ID_SITE: site.IHS_ID_SITE,
      Site_Name: site.Site_Name || '',
      Region: site.Region || '',
      GRATO_Cluster: site.GRATO_Cluster || '',
      Latitude: site.Latitude?.toString() || '',
      Longitude: site.Longitude?.toString() || '',
      Technician_Name: site.Technician_Name || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      IHS_ID_SITE: '',
      Site_Name: '',
      Region: '',
      GRATO_Cluster: '',
      Latitude: '',
      Longitude: '',
      Technician_Name: '',
    });
  };

  const columns = [
    {
      key: 'IHS_ID_SITE',
      header: 'Site ID',
      render: (site: any) => (
        <div>
          <p className="font-medium text-gray-900">{site.IHS_ID_SITE}</p>
          <p className="text-sm text-gray-500">{site.Site_Name}</p>
        </div>
      ),
    },
    {
      key: 'Region',
      header: 'Region',
      render: (site: any) => site.Region || '-',
    },
    {
      key: 'GRATO_Cluster',
      header: 'Cluster',
      render: (site: any) => (
        <Badge variant="blue">{site.GRATO_Cluster || 'N/A'}</Badge>
      ),
    },
    {
      key: 'Technician_Name',
      header: 'Technician',
      render: (site: any) => site.Technician_Name || <span className="text-gray-400">Unassigned</span>,
    },
    {
      key: 'coordinates',
      header: 'Coordinates',
      render: (site: any) =>
        site.Latitude && site.Longitude
          ? `${site.Latitude.toFixed(4)}, ${site.Longitude.toFixed(4)}`
          : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (site: any) => (
        <div className="flex space-x-2">
          <Button onClick={() => openEditModal(site)} variant="ghost" size="sm">
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDelete(site.IHS_ID_SITE)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sites Management</h1>
        <Button onClick={openCreateModal} variant="primary">
          <FiPlus className="mr-2" />
          Add Site
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by site ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={[{ value: '', label: 'All Regions' }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
            fullWidth
          />
        </div>
      </Card>

      {/* Sites Table */}
      <Card padding="none">
        <Table data={sites} columns={columns} loading={loading} />
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          onPageChange={(page) => setPagination({ ...pagination, current: page })}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'create' ? 'Create New Site' : 'Edit Site'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Site ID"
            value={formData.IHS_ID_SITE}
            onChange={(e) => setFormData({ ...formData, IHS_ID_SITE: e.target.value })}
            required
            disabled={modalType === 'edit'}
            fullWidth
          />
          <Input
            label="Site Name"
            value={formData.Site_Name}
            onChange={(e) => setFormData({ ...formData, Site_Name: e.target.value })}
            required
            fullWidth
          />
          <Select
            label="Region"
            value={formData.Region}
            onChange={(e) => setFormData({ ...formData, Region: e.target.value })}
            options={REGIONS.map((r) => ({ value: r, label: r }))}
            required
            fullWidth
          />
          <Input
            label="Cluster"
            value={formData.GRATO_Cluster}
            onChange={(e) => setFormData({ ...formData, GRATO_Cluster: e.target.value })}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.000001"
              value={formData.Latitude}
              onChange={(e) => setFormData({ ...formData, Latitude: e.target.value })}
              fullWidth
            />
            <Input
              label="Longitude"
              type="number"
              step="0.000001"
              value={formData.Longitude}
              onChange={(e) => setFormData({ ...formData, Longitude: e.target.value })}
              fullWidth
            />
          </div>
          <Input
            label="Technician Name"
            value={formData.Technician_Name}
            onChange={(e) => setFormData({ ...formData, Technician_Name: e.target.value })}
            fullWidth
          />

          <div className="flex justify-end space-x-3">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={modalType === 'create' ? handleCreate : handleUpdate}
              variant="primary"
            >
              {modalType === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SitesManagementPage;