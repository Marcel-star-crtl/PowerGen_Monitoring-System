import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  AlertOutlined,
  ToolOutlined,
  LineChartOutlined,
  ClusterOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Sider } = Layout;

const AppSider = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    // {
    //   key: '/generators',
    //   icon: <ThunderboltOutlined />,
    //   label: 'Generators',
    // },
    // {
    //   key: '/towers',
    //   icon: <ClusterOutlined />,
    //   label: 'Towers',
    // },
    {
      key: '/admin/generators',
      icon: <ThunderboltOutlined />,
      label: 'Manage Generators',
    },
    {
      key: '/admin/towers',
      icon: <ClusterOutlined />,
      label: 'Manage Towers',
    },
    {
      key: '/telemetry',
      icon: <LineChartOutlined />,
      label: 'Telemetry',
    },
    {
      key: '/maintenance',
      icon: <ToolOutlined />,
      label: 'Maintenance',
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: 'Alerts',
    },
    {
      key: '/technician',
      icon: <ToolOutlined />,
      label: 'Technician Portal',
    },
    ...(!user
      ? [
          {
            key: '/login',
            icon: <LoginOutlined />,
            label: 'Login',
          },
        ]
      : []),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={220}
      style={{
        background: colorBgContainer,
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
      }}
    >
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        }}
      >
        {collapsed ? (
          <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        ) : (
          <h1 style={{ margin: 0, color: '#1890ff', fontSize: '18px' }}>
            PowerGen Admin
          </h1>
        )}
      </div>

      <Menu
        theme="light"
        defaultSelectedKeys={[location.pathname]}
        mode="inline"
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default AppSider;