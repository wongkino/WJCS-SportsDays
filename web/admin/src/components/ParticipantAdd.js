import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Card, Typography, Space } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ParticipantAdd = ({ onParticipantAdded, groups, onGroupUpdated }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 過濾出啟用的組別
  const activeGroups = groups.filter(group => group.is_active);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await axios.post('/api/participants', values);
      onParticipantAdded({ ...values, id: response.data.id });
      form.resetFields();
      message.success('參賽者新增成功！');
    } catch (error) {
      message.error('新增參賽者失敗: ' + error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Card title="新增參賽者" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="單位"
            name="team_name"
            rules={[{ required: true, message: '請輸入單位' }]}
          >
            <Input placeholder="請輸入參賽者所屬單位" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '請輸入姓名' }]}
          >
            <Input placeholder="請輸入參賽者姓名" />
          </Form.Item>

          <Form.Item
            label="性別"
            name="gender"
            rules={[{ required: true, message: '請選擇性別' }]}
          >
            <Select placeholder="請選擇性別">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="組別"
            name="group_id"
            rules={[{ required: true, message: '請選擇組別' }]}
          >
            <Select 
              placeholder="請選擇組別" 
              notFoundContent="暫無組別"
            >
              {activeGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              icon={<PlusOutlined />}
              size="large"
            >
              新增參賽者
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ParticipantAdd;
