import React from 'react';
import { Card, Button, Row, Col, Typography, Divider } from 'antd';
import { 
  TrophyOutlined, 
  UserOutlined, 
  LoginOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const ScorerEntry = () => {
  const navigate = useNavigate();

  const handleScorerLogin = () => {
    // 跳轉到記分員登入頁面
    window.location.href = '/scorer';
  };

  const handleAdminLogin = () => {
    // 跳轉到管理員登入頁面
    navigate('/');
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
          maxWidth: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <TrophyOutlined style={{ 
            fontSize: '64px', 
            color: '#1890ff',
            marginBottom: 16 
          }} />
          <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
            運動會管理系統
          </Title>
          <Text type="secondary" style={{ fontSize: '18px' }}>
            請選擇您的身份
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card 
              hoverable
              style={{ 
                height: '100%',
                textAlign: 'center',
                border: '2px solid #1890ff'
              }}
            >
              <UserOutlined style={{ 
                fontSize: '48px', 
                color: '#1890ff',
                marginBottom: 16 
              }} />
              <Title level={3} style={{ color: '#1890ff' }}>
                記分員
              </Title>
              <Paragraph style={{ color: '#666' }}>
                負責輸入運動項目的分數
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                icon={<LoginOutlined />}
                onClick={handleScorerLogin}
                block
              >
                記分員登入
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card 
              hoverable
              style={{ 
                height: '100%',
                textAlign: 'center',
                border: '2px solid #52c41a'
              }}
            >
              <TrophyOutlined style={{ 
                fontSize: '48px', 
                color: '#52c41a',
                marginBottom: 16 
              }} />
              <Title level={3} style={{ color: '#52c41a' }}>
                管理員
              </Title>
              <Paragraph style={{ color: '#666' }}>
                管理參賽者、查看結果、系統設置
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                icon={<LoginOutlined />}
                onClick={handleAdminLogin}
                block
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                管理員登入
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <Text type="secondary">
            如有問題，請聯繫系統管理員
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ScorerEntry;
