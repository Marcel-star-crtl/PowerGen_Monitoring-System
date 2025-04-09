import React from 'react';
import { Layout } from 'antd';
import AppHeader from './AppHeader';

const { Content } = Layout;

const TechnicianLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default TechnicianLayout;