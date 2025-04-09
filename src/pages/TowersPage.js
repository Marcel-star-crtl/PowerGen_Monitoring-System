import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Modal, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  fetchTowers,
  addTower,
  editTower,
  removeTower,
  createTower,
  updateTower,
  deleteTower,
} from '../features/towers/towerSlice';
import TowerForm from '../features/towers/components/TowerForm';

const TowersPage = () => {
  const dispatch = useDispatch();
  const { towers, loading } = useSelector((state) => state.towers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTower, setCurrentTower] = useState(null);

  useEffect(() => {
    dispatch(fetchTowers());
  }, [dispatch]);

  const handleCreate = () => {
    setCurrentTower(null);
    setIsModalVisible(true);
  };

  const handleEdit = (tower) => {
    setCurrentTower(tower);
    setIsModalVisible(true);
  };

//   const handleDelete = (id) => {
//     Modal.confirm({
//       title: 'Delete Tower',
//       content: 'Are you sure you want to delete this tower?',
//       onOk: () => dispatch(deleteTower(id)),
//     });
//   };

  // Update handlers
const handleDelete = (id) => {
    dispatch(removeTower(id));
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Generators',
      dataIndex: 'generators',
      key: 'generators',
      render: (generators) => generators.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="towers-page">
      <Card
        title="Towers"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Tower
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={towers}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentTower ? 'Edit Tower' : 'Add Tower'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <TowerForm
          initialValues={currentTower}
          onSubmit={(values) => {
            // if (currentTower) {
            //   dispatch(updateTower({ id: currentTower._id, ...values }));
            // } else {
            //   dispatch(createTower(values));
            // }

            // In form submission:
            if (currentTower) {
                dispatch(editTower({ id: currentTower._id, ...values }));
            } else {
                dispatch(addTower(values));
            }
            setIsModalVisible(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default TowersPage;