import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';

const MaintenanceForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.resetFields();
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <Form.Item
        name="generator_id"
        label="Generator ID"
        rules={[{ required: true, message: 'Please input generator ID!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="type"
        label="Maintenance Type"
        rules={[{ required: true, message: 'Please select type!' }]}
      >
        <Select>
          <Select.Option value="routine">Routine</Select.Option>
          <Select.Option value="repair">Repair</Select.Option>
          <Select.Option value="inspection">Inspection</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="date"
        label="Date"
        rules={[{ required: true, message: 'Please select date!' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MaintenanceForm;