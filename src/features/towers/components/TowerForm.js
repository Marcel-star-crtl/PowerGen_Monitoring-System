import React from 'react';
import { Form, Input, Select, Button } from 'antd';

const TowerForm = ({ initialValues, onSubmit }) => {
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
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please input tower name!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="location"
        label="Location"
        rules={[{ required: true, message: 'Please input location!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select status!' }]}
      >
        <Select>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TowerForm;