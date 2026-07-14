import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/login', {
        username: values.username,
        password: values.password
      });

      if (response.data.success) {
        // 保存登入狀態到 localStorage
        const loginData = {
          isLoggedIn: true,
          username: values.username,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('adminLogin', JSON.stringify(loginData));
        
        message.success('登入成功');
        onLogin(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || '登入失敗';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            運動會計分系統
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            管理員登入
          </Text>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '請輸入用戶名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用戶名"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密碼"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            請聯繫系統管理員獲取登入憑證
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
