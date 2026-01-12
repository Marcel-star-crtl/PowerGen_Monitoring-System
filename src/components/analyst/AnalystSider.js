import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  ClusterOutlined,
  AlertOutlined,
  CalculatorOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const AnalystSider = () => {
  const navigate = useNavigate();

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/analyst/dashboard')
    },
    {
      key: 'upload',
      icon: <FileExcelOutlined />,
      label: 'Upload Data',
      onClick: () => navigate('/analyst/upload')
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      onClick: () => navigate('/analyst/reports')
    },
    {
      key: 'clusters',
      icon: <ClusterOutlined />,
      label: 'Cluster Analysis',
      onClick: () => navigate('/analyst/clusters')
    },
    {
      key: 'penalties',
      icon: <CalculatorOutlined />,
      label: 'Penalty Calculator',
      onClick: () => navigate('/analyst/penalties')
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/analyst/profile')
    }
  ];

  return (
    <Sider 
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#fff',
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)'
      }}
    >
      <div style={{ 
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <h2 style={{ color: '#1890ff', margin: 0 }}>Analyst Portal</h2>
      </div>
      
      <Menu
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={{ borderRight: 0 }}
        items={items}
      />
    </Sider>
  );
};

export default AnalystSider;