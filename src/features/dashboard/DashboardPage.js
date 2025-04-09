import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ThunderboltOutlined,
  AlertOutlined,
  ToolOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { fetchDashboardStats } from './dashboardSlice';
import GeneratorStatusChart from './components/GeneratorStatusChart';
import FuelLevelChart from './components/FuelLevelChart';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  return (
    <div className="dashboard-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Generators"
              value={stats?.total_generators || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Generators"
              value={stats?.active_generators || 0}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={stats?.alerts || 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Maintenance Due"
              value={stats?.maintenance_due || 0}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Generator Status Distribution">
            <GeneratorStatusChart data={stats?.status_distribution || []} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Fuel Levels Overview">
            <FuelLevelChart data={stats?.fuel_levels || []} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;