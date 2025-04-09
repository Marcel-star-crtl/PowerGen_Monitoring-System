// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Table, Button, Space, Modal, Tag, Card } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckOutlined,
// } from '@ant-design/icons';
// import {
//   fetchMaintenance,
//   addMaintenance,
//   editMaintenance,
//   removeMaintenance,
//   createMaintenance,
//   updateMaintenance,
//   deleteMaintenance,
// } from '../features/maintenance/maintenanceSlice';
// import MaintenanceForm from '../features/maintenance/components/MaintenanceForm';
// import moment from 'moment';

// const MaintenancePage = () => {
//   const dispatch = useDispatch();
//   const { maintenance, loading } = useSelector((state) => state.maintenance);
//   const { generators } = useSelector((state) => state.generators);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [currentRecord, setCurrentRecord] = useState(null);

//   useEffect(() => {
//     dispatch(fetchMaintenance());
//   }, [dispatch]);

//   const handleCreate = () => {
//     setCurrentRecord(null);
//     setIsModalVisible(true);
//   };

//   const handleEdit = (record) => {
//     setCurrentRecord(record);
//     setIsModalVisible(true);
//   };

// //   const handleDelete = (id) => {
// //     Modal.confirm({
// //       title: 'Delete Maintenance Record',
// //       content: 'Are you sure you want to delete this record?',
// //       onOk: () => dispatch(deleteMaintenance(id)),
// //     });
// //   };

// //   const handleComplete = (id) => {
// //     dispatch(updateMaintenance({ id, completed: true }));
// //   };

// // Update handlers
// const handleDelete = (id) => {
//     dispatch(removeMaintenance(id));
//   };
  
//   const handleComplete = (id) => {
//     dispatch(editMaintenance({ id, completed: true }));
//   };

//   const columns = [
//     {
//       title: 'Generator',
//       dataIndex: 'generator_id',
//       key: 'generator',
//       render: (id) => {
//         const gen = generators.find((g) => g._id === id);
//         return gen ? `${gen.model} (${id.slice(0, 6)}...)` : id;
//       },
//     },
//     {
//       title: 'Type',
//       dataIndex: 'type',
//       key: 'type',
//     },
//     {
//       title: 'Scheduled Date',
//       dataIndex: 'date',
//       key: 'date',
//       render: (date) => moment(date).format('YYYY-MM-DD'),
//     },
//     {
//       title: 'Status',
//       dataIndex: 'completed',
//       key: 'completed',
//       render: (completed) => (
//         <Tag color={completed ? 'green' : 'orange'}>
//           {completed ? 'Completed' : 'Pending'}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="middle">
//           {!record.completed && (
//             <Button
//               type="link"
//               icon={<CheckOutlined />}
//               onClick={() => handleComplete(record._id)}
//             >
//               Complete
//             </Button>
//           )}
//           <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
//           <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)} />
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="maintenance-page">
//       <Card
//         title="Maintenance Records"
//         extra={
//           <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
//             Add Record
//           </Button>
//         }
//       >
//         <Table
//           columns={columns}
//           dataSource={maintenance}
//           rowKey="_id"
//           loading={loading}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>

//       <Modal
//         title={currentRecord ? 'Edit Maintenance' : 'Add Maintenance'}
//         visible={isModalVisible}
//         onCancel={() => setIsModalVisible(false)}
//         footer={null}
//         destroyOnClose
//       >
//         <MaintenanceForm
//           initialValues={currentRecord}
//           onSubmit={(values) => {
//             // if (currentRecord) {
//             //   dispatch(updateMaintenance({ id: currentRecord._id, ...values }));
//             // } else {
//             //   dispatch(createMaintenance(values));
//             // }
//             // In form submission:
//             if (currentRecord) {
//                 dispatch(editMaintenance({ id: currentRecord._id, ...values }));
//             } else {
//                 dispatch(addMaintenance(values));
//             }
//             setIsModalVisible(false);
//           }}
//         />
//       </Modal>
//     </div>
//   );
// };

// export default MaintenancePage;






import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Modal, Tag, Card, message, Tabs, Select } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  fetchMaintenance,
  fetchGeneratorMaintenance,
  addMaintenance,
  editMaintenance,
  removeMaintenance,
  clearMaintenanceError
} from '../features/maintenance/maintenanceSlice';
import { fetchGenerators } from '../features/generators/generatorSlice';
import MaintenanceForm from '../features/maintenance/components/MaintenanceForm';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;

const MaintenancePage = () => {
  const dispatch = useDispatch();
  const { 
    maintenance = [], // Default to empty array
    generatorMaintenance = {}, // Default to empty object
    loading, 
    error,
    historyLoading,
    historyError
  } = useSelector((state) => state.maintenance);
  
  const { generators = [] } = useSelector((state) => state.generators); // Default to empty array
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedGenerator, setSelectedGenerator] = useState(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchMaintenance());
    dispatch(fetchGenerators());
  }, [dispatch]);

  // Error handling
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearMaintenanceError());
    }
    if (historyError) {
      message.error(historyError);
      dispatch(clearMaintenanceError());
    }
  }, [error, historyError, dispatch]);

  // Load generator-specific history when generator is selected
  useEffect(() => {
    if (activeTab === 'generator' && selectedGenerator) {
      if (!generatorMaintenance[selectedGenerator]) {
        dispatch(fetchGeneratorMaintenance(selectedGenerator));
      }
    }
  }, [activeTab, selectedGenerator, dispatch, generatorMaintenance]);

  // Ensure data is always an array before passing to Table
  const getMaintenanceData = () => {
    if (activeTab === 'all') {
      return Array.isArray(maintenance) ? maintenance : [];
    }
    if (activeTab === 'generator' && selectedGenerator) {
      return Array.isArray(generatorMaintenance[selectedGenerator]) 
        ? generatorMaintenance[selectedGenerator] 
        : [];
    }
    return [];
  };

  const handleCreate = () => {
    setCurrentRecord(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentRecord({
      ...record,
      date: moment(record.date),
      parts_replaced: record.parts_replaced?.map(part => 
        typeof part === 'string' ? part : part?.name || ''
      ).filter(Boolean)
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this maintenance record?',
      onOk: () => dispatch(removeMaintenance(id))
        .then(() => message.success('Maintenance record deleted'))
        .catch(() => message.error('Failed to delete record'))
    });
  };

  const handleComplete = (id) => {
    dispatch(editMaintenance({ id, data: { completed: true } }))
      .then(() => message.success('Maintenance marked as completed'))
      .catch(() => message.error('Failed to update record'));
  };

  const handleFormSubmit = (values) => {
    const formattedValues = {
      ...values,
      date: values.date.toISOString(),
      parts_replaced: values.parts_replaced?.map(part => 
        typeof part === 'string' ? { name: part, quantity: 1 } : part
      ).filter(Boolean)
    };

    const action = currentRecord 
      ? dispatch(editMaintenance({ id: currentRecord._id, data: formattedValues }))
      : dispatch(addMaintenance(formattedValues));

    action
      .then(() => {
        message.success(`Maintenance ${currentRecord ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
      })
      .catch(() => message.error('Operation failed'));
  };

  const maintenanceColumns = [
    {
      title: 'Generator',
      dataIndex: 'generator_id',
      key: 'generator',
      render: (id) => {
        const gen = generators.find((g) => g._id === id);
        return gen ? `${gen.model} (${id.slice(0, 6)}...)` : id;
      },
      sorter: (a, b) => a.generator_id.localeCompare(b.generator_id),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type?.charAt(0)?.toUpperCase() + type?.slice(1) || '',
      filters: [
        { text: 'Routine', value: 'routine' },
        { text: 'Repair', value: 'repair' },
        { text: 'Inspection', value: 'inspection' },
        { text: 'Emergency', value: 'emergency' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? moment(date).format('YYYY-MM-DD HH:mm') : '',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
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
      filters: [
        { text: 'Completed', value: true },
        { text: 'Pending', value: false },
      ],
      onFilter: (value, record) => record.completed === value,
    },
    {
      title: 'Technician',
      dataIndex: 'technician',
      key: 'technician',
      render: (text) => text || '-',
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button 
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
            loading={loading}
          >
            Add Record
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="All Records" key="all">
            <Table
              columns={maintenanceColumns}
              dataSource={getMaintenanceData()}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              locale={{
                emptyText: 'No maintenance records found'
              }}
            />
          </TabPane>
          <TabPane tab="Generator History" key="generator">
            <div style={{ marginBottom: 16 }}>
              <Select
                style={{ width: 300 }}
                placeholder="Select a generator"
                onChange={setSelectedGenerator}
                loading={generators.length === 0}
                value={selectedGenerator}
              >
                {generators.map(gen => (
                  <Option key={gen._id} value={gen._id}>
                    {gen.model} ({gen._id.slice(0, 6)}...)
                  </Option>
                ))}
              </Select>
            </div>
            <Table
              columns={maintenanceColumns}
              dataSource={getMaintenanceData()}
              rowKey="_id"
              loading={historyLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              locale={{
                emptyText: selectedGenerator 
                  ? 'No maintenance history for this generator'
                  : 'Please select a generator'
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={currentRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
        width={800}
      >
        <MaintenanceForm
          initialValues={currentRecord}
          onSubmit={handleFormSubmit}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default MaintenancePage;