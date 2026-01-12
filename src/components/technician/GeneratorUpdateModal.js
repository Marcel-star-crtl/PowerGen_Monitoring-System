import React, { useState } from 'react';
import { 
  Modal, Form, Input, Select, DatePicker, Upload, Button, Row, Col,
  InputNumber, AutoComplete, message, Divider
} from 'antd';
import { UploadOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;


// ==================== GENERATOR UPDATE MODAL ====================
export const GeneratorUpdateModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  selectedGenerator,
  user,
  towers = [],
  generators = []
}) => {
  const [form] = Form.useForm();
  const [updateType, setUpdateType] = useState('status_update');
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && selectedGenerator) {
      form.setFieldsValue({
        tower_id: selectedGenerator.towerId,
        existing_generator_id: selectedGenerator.generatorId
      });
    }
  }, [visible, selectedGenerator]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const updateData = {
        updateType: updateType,
        tower_id: values.tower_id,
        update_reason: values.update_reason,
        fuel_level: parseInt(values.fuel_level || 100),
        power_output: parseInt(values.power_output || 0),
        temperature: parseInt(values.temperature || 25),
        runtime: parseInt(values.runtime || 0),
        status: values.status
      };

      if (updateType === 'status_update') {
        updateData.existing_generator_id = values.existing_generator_id;
      } else if (updateType === 'new_generator') {
        updateData.new_generator_id = values.new_generator_id;
        updateData.model = values.model;
        updateData.serial_number = values.serial_number;
        updateData.fuel_capacity = parseInt(values.fuel_capacity);
        updateData.power_rating = parseInt(values.power_rating);
        updateData.fuel_type = values.fuel_type;
        updateData.installation_date = values.installation_date?.toISOString() || new Date().toISOString();
      }

      await onSubmit(updateData);
      form.resetFields();
      setFileList([]);
    } catch (error) {
      message.error(error.message || 'Failed to submit generator update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Submit Generator Update"
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={900}
      confirmLoading={loading}
      okText="Submit Update"
    >
      <Form 
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="updateType"
          label="Type of Update"
          rules={[{ required: true }]}
          initialValue="status_update"
        >
          <Select onChange={setUpdateType}>
            <Option value="status_update">Status Update</Option>
            <Option value="new_generator">New Generator Installation</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tower_id"
              label="Tower ID"
              rules={[{ required: true }]}
            >
              <Select showSearch placeholder="Select tower">
                {towers.map(tower => (
                  <Option key={tower._id} value={tower._id}>
                    {tower.name} ({tower._id})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {updateType === 'status_update' && (
            <Col span={12}>
              <Form.Item
                name="existing_generator_id"
                label="Existing Generator ID"
                rules={[{ required: updateType === 'status_update' }]}
              >
                <Select showSearch placeholder="Select generator">
                  {generators.map(gen => (
                    <Option key={gen._id} value={gen._id}>
                      {gen._id} - {gen.model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        {updateType === 'new_generator' && (
          <>
            <Divider orientation="left">New Generator Details</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="new_generator_id"
                  label="New Generator ID"
                  rules={[
                    { required: updateType === 'new_generator' },
                    { 
                      pattern: /^GEN[A-Z]{3}\d{3}$/,
                      message: 'Format must be GEN_ABC_001' 
                    }
                  ]}
                >
                  <Input placeholder="GEN_ABC_001" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="model"
                  label="Model"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <Input placeholder="PowerMax 3000" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="serial_number"
                  label="Serial Number"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <Input placeholder="SN12345678" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="installation_date"
                  label="Installation Date"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="fuel_capacity"
                  label="Fuel Capacity (L)"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="power_rating"
                  label="Power Rating (kW)"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="fuel_type"
                  label="Fuel Type"
                  rules={[{ required: updateType === 'new_generator' }]}
                >
                  <Select>
                    <Option value="diesel">Diesel</Option>
                    <Option value="gasoline">Gasoline</Option>
                    <Option value="hybrid">Hybrid</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Divider orientation="left">Current Status</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fuel_level"
              label="Fuel Level (%)"
              rules={[{ required: true }]}
              initialValue={100}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="power_output"
              label="Power Output (kW)"
              rules={[{ required: true }]}
              initialValue={0}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Generator Status"
              rules={[{ required: true }]}
              initialValue="standby"
            >
              <Select>
                <Option value="running">Running</Option>
                <Option value="standby">Standby</Option>
                <Option value="maintenance">Maintenance</Option>
                <Option value="fault">Fault</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="update_reason"
          label="Update Reason"
          rules={[{ required: true }]}
        >
          <TextArea rows={3} placeholder="Explain the reason for this update..." />
        </Form.Item>

        <Form.Item label="Photos">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            multiple
            accept="image/*"
            listType="picture-card"
          >
            {fileList.length < 5 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default { GeneratorUpdateModal };