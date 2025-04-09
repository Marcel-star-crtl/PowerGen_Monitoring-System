import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Card, Tag, Descriptions, Spin, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import api from '../services/api';

const GeneratorHistory = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [generator, setGenerator] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/maintenance/generator/${id}`);
        setGenerator(response.data.generator);
        setHistory(response.data.maintenanceHistory);
      } catch (err) {
        message.error('Failed to load maintenance history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={
          type === 'routine' ? 'blue' : 
          type === 'repair' ? 'red' : 
          type === 'inspection' ? 'green' : 'orange'
        }>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'completed',
      key: 'completed',
      render: completed => (
        <Tag color={completed ? 'green' : 'orange'}>
          {completed ? 'COMPLETED' : 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Technician',
      dataIndex: 'technician',
      key: 'technician',
    },
    {
      title: 'Parts Replaced',
      dataIndex: 'parts_replaced',
      key: 'parts',
      render: parts => parts.map(p => typeof p === 'string' ? p : p.name).join(', '),
    },
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="generator-history">
      <Card
        title={
          <span>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            Maintenance History for {generator?.model || 'Generator'}
          </span>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Generator ID">{generator?.id}</Descriptions.Item>
          <Descriptions.Item label="Model">{generator?.model}</Descriptions.Item>
          <Descriptions.Item label="Location">{generator?.location}</Descriptions.Item>
        </Descriptions>

        <Table
          columns={columns}
          dataSource={history}
          rowKey="_id"
          style={{ marginTop: 16 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default GeneratorHistory;