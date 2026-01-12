import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const ClustersManagementPage: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    supervisor: '',
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAllClusters();
      setClusters(result.data);
    } catch (err) {
      showError('Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await adminAPI.createCluster(formData);
      success('Cluster created successfully!');
      setShowModal(false);
      resetForm();
      loadClusters();
    } catch (err) {
      showError('Failed to create cluster');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCluster) return;

    try {
      await adminAPI.updateCluster(selectedCluster._id, formData);
      success('Cluster updated successfully!');
      setShowModal(false);
      resetForm();
      loadClusters();
    } catch (err) {
      showError('Failed to update cluster');
    }
  };

  const handleDelete = async (clusterId: string) => {
    if (!window.confirm('Are you sure you want to delete this cluster?')) return;

    try {
      await adminAPI.deleteCluster(clusterId);
      success('Cluster deleted successfully!');
      loadClusters();
    } catch (err) {
      showError('Failed to delete cluster');
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setSelectedCluster(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (cluster: any) => {
    setModalType('edit');
    setSelectedCluster(cluster);
    setFormData({
      name: cluster.name,
      region: cluster.region || '',
      supervisor: cluster.supervisor?._id || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
      supervisor: '',
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Cluster Name',
    },
    {
      key: 'region',
      header: 'Region',
    },
    {
      key: 'supervisor',
      header: 'Supervisor',
      render: (cluster: any) => cluster.supervisor?.fullName || <span className="text-gray-400">Unassigned</span>,
    },
    {
      key: 'technicians_count',
      header: 'Technicians',
      render: (cluster: any) => (
        <Badge variant="blue">{cluster.assigned_technicians?.length || 0}</Badge>
      ),
    },
    {
      key: 'sites_count',
      header: 'Sites',
      render: (cluster: any) => (
        <Badge variant="green">{cluster.sites_count || 0}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cluster: any) => (
        <div className="flex space-x-2">
          <Button onClick={() => openEditModal(cluster)} variant="ghost" size="sm">
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDelete(cluster._id)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clusters Management</h1>
        <Button onClick={openCreateModal} variant="primary">
          <FiPlus className="mr-2" />
          Add Cluster
        </Button>
      </div>

      {/* Clusters Table */}
      <Card padding="none">
        <Table data={clusters} columns={columns} loading={loading} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'create' ? 'Create New Cluster' : 'Edit Cluster'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Cluster Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            fullWidth
          />
          <Input
            label="Supervisor ID"
            value={formData.supervisor}
            onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
            helperText="Enter the supervisor's user ID"
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

export default ClustersManagementPage;
