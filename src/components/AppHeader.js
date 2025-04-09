import React from 'react';
import { Layout, Dropdown, Space, Avatar, Badge } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { alerts } = useSelector((state) => state.alerts);

  const activeAlerts = alerts?.filter(alert => !alert.resolved) || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const items = [
    {
      key: '1',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
      }}
    >
      <div></div> {/* Empty div for spacing */}

      <Space size="large">
        <Badge count={activeAlerts.length}>
          <BellOutlined
            style={{ fontSize: '18px', cursor: 'pointer' }}
            onClick={() => navigate('/alerts')}
          />
        </Badge>

        <Dropdown menu={{ items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size="default"
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <span>{user?.name || 'Admin'}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;