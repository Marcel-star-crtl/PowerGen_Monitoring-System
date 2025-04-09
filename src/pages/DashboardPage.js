import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ThunderboltOutlined,
  AlertOutlined,
  ToolOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { fetchDashboardStats } from '../features/dashboard/dashboardSlice';
import GeneratorStatusChart from '../features/dashboard/components/GeneratorStatusChart';
import FuelLevelChart from '../features/dashboard/components/FuelLevelChart';

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
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Generators"
              value={stats?.active_generators || 0}
              prefix={<DashboardOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={stats?.active_alerts || 0}
              prefix={<AlertOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Maintenance Due"
              value={stats?.maintenance_due || 0}
              prefix={<ToolOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Generator Status Distribution" loading={loading}>
            <GeneratorStatusChart data={stats?.status_distribution || []} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Fuel Levels Overview" loading={loading}>
            <FuelLevelChart data={stats?.fuel_levels || []} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;









// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Row, Col, Card, Statistic, Select, Divider, Tag } from 'antd';
// import {
//   ThunderboltOutlined,
//   AlertOutlined,
//   ToolOutlined,
//   DashboardOutlined,
//   ExperimentOutlined
// } from '@ant-design/icons';
// import { fetchDashboardStats, setDataSource } from '../features/dashboard/dashboardSlice';
// import GeneratorStatusChart from '../features/dashboard/components/GeneratorStatusChart';
// import FuelLevelChart from '../features/dashboard/components/FuelLevelChart';

// const { Option } = Select;

// const DashboardPage = () => {
//   const dispatch = useDispatch();
//   const { stats, loading, dataSource } = useSelector((state) => state.dashboard);

//   useEffect(() => {
//     dispatch(fetchDashboardStats());
//   }, [dispatch, dataSource]);

//   const handleDataSourceChange = (value) => {
//     dispatch(setDataSource(value));
//   };

//   const getStatValue = (key) => {
//     if (!stats) return 0;
    
//     if (dataSource === 'real') {
//       return stats[key] || 0;
//     }
    
//     if (dataSource === 'simulated') {
//       return stats[`simulated_${key}`] || 0;
//     }
    
//     // Combined view
//     return (stats[key] || 0) + (stats[`simulated_${key}`] || 0);
//   };

//   return (
//     <div className="dashboard-page">
//       <Card style={{ marginBottom: 16 }}>
//         <Row gutter={16} align="middle">
//           <Col>
//             <span style={{ marginRight: 8 }}>Data Source:</span>
//             <Select
//               value={dataSource}
//               onChange={handleDataSourceChange}
//               style={{ width: 150 }}
//             >
//               <Option value="combined">Combined View</Option>
//               <Option value="real">Real Data Only</Option>
//               <Option value="simulated">Simulation Only</Option>
//             </Select>
//           </Col>
//           {dataSource === 'simulated' && (
//             <Col>
//               <Tag icon={<ExperimentOutlined />} color="purple">
//                 Simulation Mode
//               </Tag>
//             </Col>
//           )}
//         </Row>
//       </Card>

//       <Row gutter={[16, 16]}>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Generators"
//               value={getStatValue('total_generators')}
//               prefix={<ThunderboltOutlined />}
//               loading={loading}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Active Generators"
//               value={getStatValue('active_generators')}
//               prefix={<DashboardOutlined />}
//               loading={loading}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Active Alerts"
//               value={getStatValue('active_alerts')}
//               prefix={<AlertOutlined />}
//               loading={loading}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Maintenance Due"
//               value={getStatValue('maintenance_due')}
//               prefix={<ToolOutlined />}
//               loading={loading}
//             />
//           </Card>
//         </Col>
//       </Row>

//       <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//         <Col xs={24} md={12}>
//           <Card 
//             title={
//               <>
//                 Generator Status Distribution
//                 {dataSource === 'simulated' && (
//                   <Tag color="purple" style={{ marginLeft: 8 }}>Simulation</Tag>
//                 )}
//               </>
//             } 
//             loading={loading}
//           >
//             <GeneratorStatusChart 
//               data={stats?.status_distribution || []} 
//               isSimulated={dataSource === 'simulated'}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} md={12}>
//           <Card 
//             title={
//               <>
//                 Fuel Levels Overview
//                 {dataSource === 'simulated' && (
//                   <Tag color="purple" style={{ marginLeft: 8 }}>Simulation</Tag>
//                 )}
//               </>
//             }
//             loading={loading}
//           >
//             <FuelLevelChart 
//               data={stats?.fuel_levels || []} 
//               isSimulated={dataSource === 'simulated'}
//             />
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default DashboardPage;