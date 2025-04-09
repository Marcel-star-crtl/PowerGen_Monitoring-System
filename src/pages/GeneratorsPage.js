import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Modal, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  fetchGenerators,
  createGenerator,
  updateGenerator,
  deleteGenerator,
  editGenerator,
  removeGenerator,
  addGenerator,
} from '../features/generators/generatorSlice';
import GeneratorForm from '../features/generators/components/GeneratorForm';

const GeneratorsPage = () => {
  const dispatch = useDispatch();
  const { generators, loading } = useSelector((state) => state.generators);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentGenerator, setCurrentGenerator] = useState(null);

  useEffect(() => {
    dispatch(fetchGenerators());
  }, [dispatch]);

  const handleCreate = () => {
    setCurrentGenerator(null);
    setIsModalVisible(true);
  };

  const handleEdit = (generator) => {
    setCurrentGenerator(generator);
    setIsModalVisible(true);
  };

//   const handleDelete = (id) => {
//     Modal.confirm({
//       title: 'Delete Generator',
//       content: 'Are you sure you want to delete this generator?',
//       onOk: () => dispatch(deleteGenerator(id)),
//     });
//   };

// Update the handler functions
const handleDelete = (id) => {
    dispatch(removeGenerator(id));
  };

  const columns = [
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'running' ? 'green' : status === 'standby' ? 'blue' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Fuel Level',
      dataIndex: 'current_stats',
      key: 'fuel',
      render: (stats) => `${stats?.fuel_level || 0}%`,
    },
    {
      title: 'Power Output',
      dataIndex: 'current_stats',
      key: 'power',
      render: (stats) => `${stats?.power_output || 0} kW`,
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
    <div className="generators-page">
      <Card
        title="Generators"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Generator
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={generators}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentGenerator ? 'Edit Generator' : 'Add Generator'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <GeneratorForm
          initialValues={currentGenerator}
          onSubmit={(values) => {
            // if (currentGenerator) {
            //   dispatch(updateGenerator({ id: currentGenerator._id, ...values }));
            // } else {
            //   dispatch(createGenerator(values));
            // }
            if (currentGenerator) {
                dispatch(editGenerator({ id: currentGenerator._id, ...values }));
              } else {
                dispatch(addGenerator(values));
              }
            setIsModalVisible(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default GeneratorsPage;