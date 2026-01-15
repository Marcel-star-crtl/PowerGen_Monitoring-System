import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { FiPlus, FiEdit, FiTrash2, FiPackage } from 'react-icons/fi';

const PartsManagementPage: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    category: 'electrical',
    description: '',
    unit_price: '',
    stock: '',
    minimum_stock: '',
    supplier: '',
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadParts();
  }, [pagination.current, categoryFilter]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAllParts({
        page: pagination.current,
        limit: pagination.pageSize,
        category: categoryFilter || undefined,
      });
      if (result.success && result.data) {
        setParts(result.data.parts);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      showError('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await adminAPI.createPart(formData);
      success('Part created successfully!');
      setShowModal(false);
      resetForm();
      loadParts();
    } catch (err) {
      showError('Failed to create part');
    }
  };

  const handleUpdate = async () => {
    if (!selectedPart) return;

    try {
      await adminAPI.updatePart(selectedPart._id, formData);
      success('Part updated successfully!');
      setShowModal(false);
      resetForm();
      loadParts();
    } catch (err) {
      showError('Failed to update part');
    }
  };

  const handleDelete = async (partId: string) => {
    if (!window.confirm('Are you sure you want to delete this part?')) return;

    try {
      await adminAPI.deletePart(partId);
      success('Part deleted successfully!');
      loadParts();
    } catch (err) {
      showError('Failed to delete part');
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setSelectedPart(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (part: any) => {
    setModalType('edit');
    setSelectedPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number || '',
      category: part.category,
      description: part.description || '',
      unit_price: part.unit_price?.toString() || '',
      stock: part.stock?.toString() || '',
      minimum_stock: part.minimum_stock?.toString() || '',
      supplier: part.supplier || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      part_number: '',
      category: 'electrical',
      description: '',
      unit_price: '',
      stock: '',
      minimum_stock: '',
      supplier: '',
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Part Name',
      render: (part: any) => (
        <div>
          <p className="font-medium text-gray-900">{part.name}</p>
          <p className="text-sm text-gray-500">{part.part_number}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (part: any) => <Badge variant="blue">{part.category}</Badge>,
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (part: any) => {
        const isLow = part.stock <= part.minimum_stock;
        return (
          <Badge variant={isLow ? 'red' : 'green'}>
            {part.stock || 0} / {part.minimum_stock || 0}
          </Badge>
        );
      },
    },
    {
      key: 'unit_price',
      header: 'Price',
      render: (part: any) => `${part.unit_price || 0} FCFA`,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (part: any) => part.supplier || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (part: any) => (
        <div className="flex space-x-2">
          <Button onClick={() => openEditModal(part)} variant="ghost" size="sm">
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDelete(part._id)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parts Management</h1>
        <Button onClick={openCreateModal} variant="primary">
          <FiPlus className="mr-2" />
          Add Part
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            { value: 'electrical', label: 'Electrical' },
            { value: 'mechanical', label: 'Mechanical' },
            { value: 'fuel_system', label: 'Fuel System' },
            { value: 'cooling_system', label: 'Cooling System' },
            { value: 'safety', label: 'Safety' },
            { value: 'other', label: 'Other' },
          ]}
          className="w-64"
        />
      </Card>

      {/* Parts Table */}
      <Card padding="none">
        <Table data={parts} columns={columns} loading={loading} />
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
        title={modalType === 'create' ? 'Create New Part' : 'Edit Part'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Part Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Part Number"
            value={formData.part_number}
            onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
            fullWidth
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'electrical', label: 'Electrical' },
              { value: 'mechanical', label: 'Mechanical' },
              { value: 'fuel_system', label: 'Fuel System' },
              { value: 'cooling_system', label: 'Cooling System' },
              { value: 'safety', label: 'Safety' },
              { value: 'other', label: 'Other' },
            ]}
            required
            fullWidth
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Price (FCFA)"
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              fullWidth
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              fullWidth
            />
          </div>
          <Input
            label="Minimum Stock Level"
            type="number"
            value={formData.minimum_stock}
            onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
            fullWidth
          />
          <Input
            label="Supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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

export default PartsManagementPage;