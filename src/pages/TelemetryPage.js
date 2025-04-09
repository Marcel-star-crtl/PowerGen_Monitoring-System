import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Select, DatePicker, Tabs, Row, Col, Empty, Tag, Table } from 'antd';
import { LineChartOutlined, TableOutlined } from '@ant-design/icons';
import { fetchGeneratorTelemetry } from '../features/telemetry/telemetrySlice';
import TelemetryChart from '../features/telemetry/components/TelemetryChart';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const statusColors = {
  running: 'green',
  standby: 'blue',
  fault: 'red',
  shutdown: 'orange'
};

const TelemetryPage = () => {
  const dispatch = useDispatch();
  const { telemetry, loading } = useSelector((state) => state.telemetry);
  const { generators } = useSelector((state) => state.generators);
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [timeRange, setTimeRange] = useState([moment().subtract(1, 'day'), moment()]);
  const [activeTab, setActiveTab] = useState('chart');

  useEffect(() => {
    if (selectedGenerator) {
      dispatch(
        fetchGeneratorTelemetry({
          generatorId: selectedGenerator,
          start: timeRange[0].toISOString(),
          end: timeRange[1].toISOString(),
        })
      );
    }
  }, [dispatch, selectedGenerator, timeRange]);

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Fuel Level',
      dataIndex: 'fuel_level',
      key: 'fuel_level',
      render: (value) => `${value}%`,
      sorter: (a, b) => a.fuel_level - b.fuel_level,
    },
    {
      title: 'Power Output',
      dataIndex: 'power_output',
      key: 'power_output',
      render: (value) => `${value} kW`,
      sorter: (a, b) => a.power_output - b.power_output,
    },
    {
      title: 'Temperature',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (value) => `${value}°C`,
      sorter: (a, b) => a.temperature - b.temperature,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Running', value: 'running' },
        { text: 'Standby', value: 'standby' },
        { text: 'Fault', value: 'fault' },
        { text: 'Shutdown', value: 'shutdown' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Shutdown Reason',
      dataIndex: 'shutdown_reason',
      key: 'shutdown_reason',
      render: (reason) => reason || 'N/A',
    },
    {
      title: 'Runtime',
      dataIndex: 'runtime',
      key: 'runtime',
      render: (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      },
      sorter: (a, b) => (a.runtime || 0) - (b.runtime || 0),
    },
  ];

  return (
    <div className="telemetry-page">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Generator"
              onChange={setSelectedGenerator}
              value={selectedGenerator}
              loading={loading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {generators.map((gen) => (
                <Option key={gen._id} value={gen._id}>
                  {gen.model} ({gen._id})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={16}>
            <RangePicker
              showTime
              style={{ width: '100%' }}
              value={timeRange}
              onChange={setTimeRange}
              disabled={!selectedGenerator}
              ranges={{
                'Last Hour': [moment().subtract(1, 'hour'), moment()],
                'Last 24 Hours': [moment().subtract(1, 'day'), moment()],
                'Last Week': [moment().subtract(1, 'week'), moment()],
                'Last Month': [moment().subtract(1, 'month'), moment()],
              }}
            />
          </Col>
        </Row>

        {selectedGenerator ? (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginTop: 16 }}
          >
            <TabPane
              tab={
                <span>
                  <LineChartOutlined />
                  Chart
                </span>
              }
              key="chart"
            >
              <TelemetryChart data={telemetry} loading={loading} />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <TableOutlined />
                  Table
                </span>
              }
              key="table"
            >
              <Table
                columns={columns}
                dataSource={telemetry}
                rowKey="timestamp"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
              />
            </TabPane>
          </Tabs>
        ) : (
          <Empty
            description="Please select a generator to view telemetry data"
            style={{ margin: '40px 0' }}
          />
        )}
      </Card>
    </div>
  );
};

export default TelemetryPage;





// // updates with Proteus and arduino simulation
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Card, Select, DatePicker, Tabs, Row, Col, Empty, Table, Tag, Badge } from 'antd';
// import {
//   LineChartOutlined,
//   TableOutlined,
//   WarningOutlined,
//   ThunderboltOutlined,
//   FireOutlined
// } from '@ant-design/icons';
// import { fetchGeneratorTelemetry, fetchSimulatedTelemetry } from '../features/telemetry/telemetrySlice';
// import TelemetryChart from '../features/telemetry/components/TelemetryChart';
// import moment from 'moment';

// const { TabPane } = Tabs;
// const { Option } = Select;
// const { RangePicker } = DatePicker;

// const TelemetryPage = () => {
//   const dispatch = useDispatch();
//   const { telemetry, loading, simulatedData } = useSelector((state) => state.telemetry);
//   const { generators } = useSelector((state) => state.generators);
//   const [selectedGenerator, setSelectedGenerator] = useState(null);
//   const [timeRange, setTimeRange] = useState([moment().subtract(1, 'day'), moment()]);
//   const [activeTab, setActiveTab] = useState('chart');
//   const [dataSource, setDataSource] = useState('real'); // 'real' or 'simulated'

//   useEffect(() => {
//     if (selectedGenerator) {
//       if (dataSource === 'real') {
//         dispatch(
//           fetchGeneratorTelemetry({
//             generatorId: selectedGenerator,
//             start: timeRange[0].toISOString(),
//             end: timeRange[1].toISOString(),
//           })
//         );
//       } else {
//         dispatch(fetchSimulatedTelemetry(selectedGenerator));
//       }
//     }
//   }, [dispatch, selectedGenerator, timeRange, dataSource]);

//   const columns = [
//     {
//       title: 'Timestamp',
//       dataIndex: 'timestamp',
//       key: 'timestamp',
//       render: (date) => moment(date).format('YYYY-MM-DD HH:mm:ss'),
//     },
//     {
//       title: 'Fuel Level',
//       dataIndex: 'fuel_level',
//       key: 'fuel_level',
//       render: (value) => `${value}%`,
//     },
//     {
//       title: 'Power Output',
//       dataIndex: 'power_output',
//       key: 'power_output',
//       render: (value) => `${value} kW`,
//     },
//     {
//       title: 'Temperature',
//       dataIndex: 'temperature',
//       key: 'temperature',
//       render: (value) => `${value}°C`,
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={status === 'running' ? 'green' : 'orange'}>
//           {status.toUpperCase()}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Event',
//       dataIndex: 'event_type',
//       key: 'event_type',
//       render: (eventType) => {
//         if (eventType === 'normal') return null;
        
//         let icon, color;
//         switch (eventType) {
//           case 'low_fuel':
//             icon = <WarningOutlined />;
//             color = 'gold';
//             break;
//           case 'overheating':
//             icon = <FireOutlined />;
//             color = 'volcano';
//             break;
//           case 'mechanical_issue':
//             icon = <ThunderboltOutlined />;
//             color = 'red';
//             break;
//           default:
//             icon = <WarningOutlined />;
//             color = 'blue';
//         }
        
//         return (
//           <Tag icon={icon} color={color}>
//             {eventType.replace('_', ' ').toUpperCase()}
//           </Tag>
//         );
//       },
//     },
//   ];

//   const currentData = dataSource === 'simulated' ? simulatedData : telemetry;

//   return (
//     <div className="telemetry-page">
//       <Card>
//         <Row gutter={[16, 16]} align="middle">
//           <Col xs={24} md={8}>
//             <Select
//               style={{ width: '100%' }}
//               placeholder="Select Generator"
//               onChange={setSelectedGenerator}
//               value={selectedGenerator}
//               loading={loading}
//             >
//               {generators.map((gen) => (
//                 <Option key={gen._id} value={gen._id}>
//                   {gen.model} ({gen._id})
//                 </Option>
//               ))}
//             </Select>
//           </Col>
//           <Col xs={24} md={8}>
//             <Select
//               style={{ width: '100%' }}
//               value={dataSource}
//               onChange={setDataSource}
//               disabled={!selectedGenerator}
//             >
//               <Option value="real">Real Data</Option>
//               <Option value="simulated">Simulated Data</Option>
//             </Select>
//           </Col>
//           <Col xs={24} md={8}>
//             <RangePicker
//               showTime
//               style={{ width: '100%' }}
//               value={timeRange}
//               onChange={setTimeRange}
//               disabled={!selectedGenerator || dataSource === 'simulated'}
//               ranges={{
//                 'Last Hour': [moment().subtract(1, 'hour'), moment()],
//                 'Last 24 Hours': [moment().subtract(1, 'day'), moment()],
//                 'Last Week': [moment().subtract(1, 'week'), moment()],
//               }}
//             />
//           </Col>
//         </Row>

//         {selectedGenerator ? (
//           <>
//             {dataSource === 'simulated' && (
//               <div style={{ margin: '16px 0' }}>
//                 <Badge status="processing" text="Live Simulation Data" />
//               </div>
//             )}
            
//             <Tabs
//               activeKey={activeTab}
//               onChange={setActiveTab}
//               style={{ marginTop: 16 }}
//             >
//               <TabPane
//                 tab={
//                   <span>
//                     <LineChartOutlined />
//                     Chart
//                   </span>
//                 }
//                 key="chart"
//               >
//                 <TelemetryChart 
//                   data={currentData} 
//                   loading={loading} 
//                   showEvents={dataSource === 'simulated'}
//                 />
//               </TabPane>
//               <TabPane
//                 tab={
//                   <span>
//                     <TableOutlined />
//                     Table
//                   </span>
//                 }
//                 key="table"
//               >
//                 <Table
//                   columns={columns}
//                   dataSource={currentData}
//                   rowKey="timestamp"
//                   loading={loading}
//                   pagination={{ pageSize: 10 }}
//                 />
//               </TabPane>
//             </Tabs>
//           </>
//         ) : (
//           <Empty
//             description="Please select a generator to view telemetry data"
//             style={{ margin: '40px 0' }}
//           />
//         )}
//       </Card>
//     </div>
//   );
// };

// export default TelemetryPage;