import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  Space, 
  Divider, 
  Upload, 
  message,
  InputNumber,
  Row,
  Col
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  MinusOutlined 
} from '@ant-design/icons';
import { addMaintenance } from '../features/maintenance/maintenanceSlice';
// import TechnicianLayout from '../components/TechnicianLayout';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const TechnicianPage = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [parts, setParts] = useState([{ name: '', quantity: 1 }]);

  const onFinish = (values) => {
    const maintenanceData = {
      ...values,
      date: values.date.toISOString(),
      parts_replaced: parts.filter(p => p.name),
      completed: true,
      before_photos: fileList.filter(f => f.type?.startsWith('image/')).map(f => f.name),
    };
    
    dispatch(addMaintenance(maintenanceData));
    message.success('Maintenance record submitted successfully!');
    form.resetFields();
    setParts([{ name: '', quantity: 1 }]);
    setFileList([]);
  };

  const addPart = () => {
    setParts([...parts, { name: '', quantity: 1 }]);
  };

  const removePart = (index) => {
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    return isImage;
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    // <TechnicianLayout>
    <div className="technician-page" style={{ padding: '16px' }}>
      <Card title="Maintenance Report Form">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: moment(),
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="generator_id"
                label="Generator ID"
                rules={[{ required: true, message: 'Please input generator ID!' }]}
              >
                <Input placeholder="GEN_ABJ_001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="tower_id"
                label="Tower ID"
                rules={[{ required: true, message: 'Please input tower ID!' }]}
              >
                <Input placeholder="TOWER_ABJ_001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="Maintenance Type"
                rules={[{ required: true, message: 'Please select type!' }]}
              >
                <Select placeholder="Select maintenance type">
                  <Option value="routine">Routine</Option>
                  <Option value="repair">Repair</Option>
                  <Option value="inspection">Inspection</Option>
                  <Option value="emergency">Emergency</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="technician"
                label="Technician Name"
                rules={[{ required: true, message: 'Please input technician name!' }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="supervisor"
                label="Supervisor Name"
                rules={[{ required: true, message: 'Please input supervisor name!' }]}
              >
                <Input placeholder="James Corner" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Parts Replaced</Divider>
          
          {parts.map((part, index) => (
            <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
              <Form.Item style={{ flex: 1 }}>
                <Input
                  placeholder="Part name (e.g., oil_filter)"
                  value={part.name}
                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                />
              </Form.Item>
              <Form.Item>
                <InputNumber
                  min={1}
                  value={part.quantity}
                  onChange={(value) => handlePartChange(index, 'quantity', value)}
                />
              </Form.Item>
              {parts.length > 1 && (
                <Button
                  danger
                  icon={<MinusOutlined />}
                  onClick={() => removePart(index)}
                />
              )}
            </Space>
          ))}
          
          <Button
            type="dashed"
            onClick={addPart}
            icon={<PlusOutlined />}
            style={{ marginBottom: 16 }}
          >
            Add Part
          </Button>

          <Divider orientation="left">Photos</Divider>
          
          <Form.Item label="Before Photos">
            <Upload
              beforeUpload={beforeUpload}
              onChange={handleUploadChange}
              fileList={fileList}
              listType="picture"
              multiple
            >
              <Button icon={<UploadOutlined />}>Upload Photos</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={4} placeholder="Additional notes about the maintenance..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Submit Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
    // </TechnicianLayout>
  );
};

export default TechnicianPage;