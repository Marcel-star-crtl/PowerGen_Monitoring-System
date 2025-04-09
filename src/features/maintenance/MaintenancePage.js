import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  fetchMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from './maintenanceSlice';
import { fetchGenerators } from '../generators/generatorSlice';
import moment from 'moment';


const { Option } = Select;
const { TextArea } = Input;

const MaintenancePage = () => {
  const dispatch = useDispatch();
  const { maintenance, loading } = useSelector((state) => state.maintenance);
  const { generators } = useSelector((state) => state.generators);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchMaintenance());
    dispatch(fetchGenerators());
  }, [dispatch]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentRecord(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      date: moment(record.date),
    });
    setCurrentRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Maintenance Record',
      content: 'Are you sure you want to delete this record?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => dispatch(deleteMaintenance(id)),
    });
  };

  const handleComplete = (id) => {
    dispatch(updateMaintenance({ id, completed: true }));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        date: values.date.toISOString(),
      };

      if (currentRecord) {
        dispatch(updateMaintenance({ id: currentRecord._id, ...payload }));
      } else {
        dispatch(createMaintenance(payload));
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'Generator',
      dataIndex: 'generator_id',
      key: 'generator',
      render: (id) => {
        const gen = generators.find((g) => g._id === id);
        return gen ? `${gen._id} - ${gen.model}` : id;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'completed',
      key: 'completed',
      render: (completed) => (
        <Tag color={completed ? 'green' : 'orange'}>
          {completed ? 'Completed' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {!record.completed && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record._id)}
            >
              Complete
            </Button>
          )}
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
    <div className="maintenance-page">
      <Card
        title="Maintenance Records"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Record
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={maintenance}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="generator_id"
            label="Generator"
            rules={[{ required: true, message: 'Please select a generator' }]}
          >
            <Select placeholder="Select generator">
              {generators.map((gen) => (
                <Option key={gen._id} value={gen._id}>
                  {gen._id} - {gen.model}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Maintenance Type"
            rules={[{ required: true, message: 'Please select maintenance type' }]}
          >
            <Select placeholder="Select type">
              <Option value="routine">Routine</Option>
              <Option value="repair">Repair</Option>
              <Option value="inspection">Inspection</Option>
              <Option value="emergency">Emergency</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="technician" label="Technician">
            <Input placeholder="Technician name" />
          </Form.Item>

          <Form.Item name="parts_replaced" label="Parts Replaced">
            <Select mode="tags" placeholder="Add parts">
              <Option value="oil_filter">Oil Filter</Option>
              <Option value="air_filter">Air Filter</Option>
              <Option value="fuel_filter">Fuel Filter</Option>
              <Option value="spark_plug">Spark Plug</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} placeholder="Maintenance notes" />
          </Form.Item>

          <Form.Item name="completed" label="Completed" valuePropName="checked">
            <Select>
              <Option value={true}>Yes</Option>
              <Option value={false}>No</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;