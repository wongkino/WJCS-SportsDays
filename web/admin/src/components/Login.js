import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

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
    <div className="login-page">
      <Card className="login-card" bodyStyle={{ padding: 40 }}>
        <div className="page-heading">
          <h2>運動會計分系統</h2>
          <p>管理員登入</p>
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
              prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />}
              placeholder="用戶名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
              placeholder="密碼"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            請聯繫系統管理員獲取登入憑證
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
