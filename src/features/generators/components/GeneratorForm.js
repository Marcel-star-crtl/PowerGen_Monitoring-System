import React from 'react';
import { Form, Input, Select, Button } from 'antd';

const GeneratorForm = ({ initialValues, onSubmit }) => {
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
        name="model"
        label="Model"
        rules={[{ required: true, message: 'Please input the model!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select status!' }]}
      >
        <Select>
          <Select.Option value="running">Running</Select.Option>
          <Select.Option value="standby">Standby</Select.Option>
          <Select.Option value="fault">Fault</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="tower_id"
        label="Tower"
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GeneratorForm;