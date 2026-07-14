import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Row, 
  Col,
  Typography,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  LoginOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const ScorerLogin = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/scorer/login', {
        username: values.username,
        password: values.password
      });

      if (response.data.success) {
        message.success('登入成功！');
        // 保存記分員信息到本地存儲
        localStorage.setItem('scorerInfo', JSON.stringify(response.data.scorer));
        onLoginSuccess(response.data.scorer);
      } else {
        message.error(response.data.message || '登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      message.error('登入失敗: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <TrophyOutlined style={{ 
            fontSize: '48px', 
            color: '#1890ff',
            marginBottom: 16 
          }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            記分員登入
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            請輸入您的記分員賬戶信息
          </Text>
        </div>

        <Form
          form={form}
          name="scorer-login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用戶名"
            rules={[
              { required: true, message: '請輸入用戶名' },
              { min: 3, message: '用戶名至少3個字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="請輸入用戶名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密碼"
            rules={[
              { required: true, message: '請輸入密碼' },
              { min: 6, message: '密碼至少6個字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="請輸入密碼"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<LoginOutlined />}
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            如有問題，請聯繫管理員
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ScorerLogin;
