import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  fetchGenerators,
  createGenerator,
  updateGenerator,
  deleteGenerator,
} from './generatorSlice';
import GeneratorForm from './components/GeneratorForm';

const { Option } = Select;

const GeneratorsPage = () => {
  const dispatch = useDispatch();
  const { generators, loading } = useSelector((state) => state.generators);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentGenerator, setCurrentGenerator] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchGenerators());
  }, [dispatch]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentGenerator(null);
    setIsModalVisible(true);
  };

  const handleEdit = (generator) => {
    form.setFieldsValue(generator);
    setCurrentGenerator(generator);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Generator',
      content: 'Are you sure you want to delete this generator?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => dispatch(deleteGenerator(id)),
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (currentGenerator) {
        dispatch(updateGenerator({ id: currentGenerator._id, ...values }));
      } else {
        dispatch(createGenerator(values));
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
    },
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
        let color = '';
        switch (status) {
          case 'running':
            color = 'green';
            break;
          case 'standby':
            color = 'blue';
            break;
          case 'fault':
            color = 'red';
            break;
          default:
            color = 'gray';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Fuel Level',
      dataIndex: 'current_stats',
      key: 'fuel',
      render: (stats) => `${stats?.fuel || 0}%`,
    },
    {
      title: 'Power Output',
      dataIndex: 'current_stats',
      key: 'power',
      render: (stats) => `${stats?.power || 0} kW`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="generators-page">
      <Card
        title="Generators"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
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
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <GeneratorForm form={form} />
      </Modal>
    </div>
  );
};

export default GeneratorsPage;