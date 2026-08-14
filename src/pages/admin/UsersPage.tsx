import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { User } from '@/types/common.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { FiPlus, FiEdit, FiTrash2, FiLock, FiToggleLeft, FiToggleRight, FiUsers } from 'react-icons/fi';
import { TechnicianAssignmentModal } from '@/components/admin/TechnicianAssignmentModal';

// Was a locally-duplicated, narrower type missing 3 real system roles
// (finance, head_of_business, ceo) — an admin literally could not assign
// those roles through this page's UI. Now derived from the canonical
// User['role'] type so it can't drift out of sync again.
type UserRole = User['role'];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    password: string;
    isActive: boolean;
  }>({
    fullName: '',
    email: '',
    phone: '',
    role: 'technician',
    password: '',
    isActive: true,
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadUsers();
  }, [pagination.current, searchQuery, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
        role: roleFilter || undefined,
      });
      if (result.success && result.data) {
        setUsers(result.data.users.map((u: any) => ({ ...u, id: u._id || u.id })));
        setPagination(result.data.pagination);
      }
    } catch (err) {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await adminAPI.createUser(formData);
      success('User created successfully!');
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      showError('Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      await adminAPI.updateUser(selectedUser.id, formData);
      success('User updated successfully!');
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      showError('Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminAPI.deleteUser(userId);
      success('User deleted successfully!');
      loadUsers();
    } catch (err) {
      showError('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      success('User status updated!');
      loadUsers();
    } catch (err) {
      showError('Failed to update user status');
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setSelectedUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'technician',
      password: '',
      isActive: true,
    });
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      render: (user: User) => (
        <div>
          <p className="font-medium text-gray-900">{user.fullName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user: User) => user.phone || '-',
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Badge variant="blue">{user.role.replace('_', ' ').toUpperCase()}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: User) => (
        <Badge variant={user.isActive ? 'green' : 'gray'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex space-x-2">
          <Button onClick={() => openEditModal(user)} variant="ghost" size="sm">
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleToggleStatus(user.id)}
            variant="ghost"
            size="sm"
          >
            {user.isActive ? (
              <FiToggleRight className="h-4 w-4 text-green-600" />
            ) : (
              <FiToggleLeft className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <Button onClick={() => handleDelete(user.id)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </Button>
          {user.role === 'supervisor' && (
            <Button
              onClick={() => {
                setSelectedSupervisor(user);
                setShowAssignmentModal(true);
              }}
              variant="ghost"
              size="sm"
              title="Assign Team"
            >
              <FiUsers className="h-4 w-4 text-blue-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={openCreateModal} variant="primary">
          <FiPlus className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          {/* <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'technician', label: 'Technician' },
              { value: 'ac', label: 'AC Technician' },
              { value: 'diesel_manager', label: 'Diesel Manager' },
              { value: 'data_collector', label: 'Data Collector' },
              { value: 'analyst', label: 'Analyst' },
              { value: 'operations', label: 'Operations' },
            ]}
            fullWidth
          /> */}

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'technician', label: 'Technician' },
              { value: 'ac', label: 'AC Technician' },
              { value: 'fuel', label: 'Fuel Technician' },
              { value: 'diesel_manager', label: 'Diesel Admin' },
              { value: 'data_collector', label: 'Data Collector' },
              { value: 'analyst', label: 'Analyst' },
              { value: 'operations', label: 'Operations' },
              { value: 'finance', label: 'Finance' },
              { value: 'head_of_business', label: 'Head of Business' },
              { value: 'ceo', label: 'CEO' },
            ]}
            fullWidth
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <Table data={users} columns={columns} loading={loading} />
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
        title={modalType === 'create' ? 'Create New User' : 'Edit User'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />
          {/* <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={[
              { value: 'technician', label: 'Technician' },
              { value: 'ac', label: 'AC Technician' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'diesel_manager', label: 'Diesel Manager' },
              { value: 'data_collector', label: 'Data Collector' },
              { value: 'analyst', label: 'Analyst' },
              { value: 'operations', label: 'Operations' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
            fullWidth
          /> */}
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={[
              { value: 'technician', label: 'Technician' },
              { value: 'ac', label: 'AC Technician' },
              { value: 'fuel', label: 'Fuel Technician' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'diesel_manager', label: 'Diesel Admin' },
              { value: 'data_collector', label: 'Data Collector' },
              { value: 'analyst', label: 'Analyst' },
              { value: 'operations', label: 'Operations' },
              { value: 'finance', label: 'Finance' },
              { value: 'head_of_business', label: 'Head of Business' },
              { value: 'ceo', label: 'CEO' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
            fullWidth
          />
          {modalType === 'create' && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />
          )}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active User
            </label>
          </div>

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

      {selectedSupervisor && (
        <TechnicianAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedSupervisor(null);
          }}
          supervisor={selectedSupervisor}
          onAssign={loadUsers}
        />
      )
      }
    </div >
  );
};

export default UsersPage;



