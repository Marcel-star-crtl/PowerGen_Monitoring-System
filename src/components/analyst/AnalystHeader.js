import React from 'react';
import { Layout, Dropdown, Avatar, Badge } from 'antd';
import { 
  BellOutlined, 
  LogoutOutlined, 
  UserOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AnalystHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const items = [
    {
      key: '1',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/analyst/profile')
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/analyst/settings')
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];

  return (
    <Header style={{ 
      padding: 0,
      background: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
    }}>
      <div style={{ paddingLeft: 24 }}>
        <h2 style={{ color: '#1890ff', margin: 0 }}>Analyst Dashboard</h2>
      </div>
      
      <div style={{ paddingRight: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Badge count={5}>
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Badge>
        
        <Dropdown menu={{ items }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Avatar 
              size="default" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <span>{user?.fullName || 'Analyst'}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AnalystHeader;