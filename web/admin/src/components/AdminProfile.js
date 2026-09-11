import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const AdminProfile = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 驗證舊密碼
      const verifyResponse = await axios.post('/api/admin/verify-password', {
        password: values.oldPassword
      });

      if (!verifyResponse.data.valid) {
        message.error('舊密碼不正確');
        setLoading(false);
        return;
      }

      // 更新管理員資料
      await axios.put('/api/admin/profile', {
        username: values.username,
        password: values.newPassword
      });

      message.success('管理員資料更新成功！');
      form.resetFields();
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      message.error('更新失敗: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>管理員資料更改</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 20 }}
      >
        <Form.Item
          label="新用戶名"
          name="username"
          rules={[
            { required: true, message: '請輸入新用戶名' },
            { min: 3, message: '用戶名至少3個字符' },
            { max: 20, message: '用戶名最多20個字符' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="請輸入新用戶名"
          />
        </Form.Item>

        <Form.Item
          label="舊密碼"
          name="oldPassword"
          rules={[
            { required: true, message: '請輸入舊密碼' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="請輸入舊密碼"
          />
        </Form.Item>

        <Form.Item
          label="新密碼"
          name="newPassword"
          rules={[
            { required: true, message: '請輸入新密碼' },
            { min: 6, message: '密碼至少6個字符' },
            { max: 50, message: '密碼最多50個字符' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="請輸入新密碼"
          />
        </Form.Item>

        <Form.Item
          label="確認新密碼"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '請確認新密碼' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('兩次輸入的密碼不一致'));
              },
            }),
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="請再次輸入新密碼"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              更新資料
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminProfile;
