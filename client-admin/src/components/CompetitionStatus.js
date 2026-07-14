import React, { useState, useEffect } from 'react';
import { Card, Switch, message, Typography, Space, Alert, Button, Row, Col, Tag, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const CompetitionStatus = () => {
  const [competitionStatus, setCompetitionStatus] = useState({});
  const [loading, setLoading] = useState({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setFetching(true);
      const response = await axios.get('/api/competition/status');
      setCompetitionStatus(response.data);
    } catch (error) {
      console.error('獲取比賽狀態失敗:', error);
      message.error('獲取比賽狀態失敗: ' + error.message);
    } finally {
      setFetching(false);
    }
  };

  const updateEventStatus = async (eventId, newStatus) => {
    try {
      setLoading(prev => ({ ...prev, [eventId]: true }));
      const response = await axios.post(`/api/competition/status/${eventId}`, {
        is_finished: newStatus
      });
      
      setCompetitionStatus(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          is_finished: newStatus
        }
      }));
      
      message.success(response.data.message || '比賽狀態已更新');
    } catch (error) {
      console.error('更新比賽狀態失敗:', error);
      message.error('更新比賽狀態失敗: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleEventStatusChange = (eventId, checked) => {
    updateEventStatus(eventId, checked);
  };

  const updateAllStatus = async (newStatus) => {
    try {
      setLoading({ all: true });
      const statuses = Object.keys(competitionStatus).map(eventId => ({
        event_id: parseInt(eventId),
        is_finished: newStatus
      }));
      
      const response = await axios.post('/api/competition/status/batch', {
        statuses: statuses
      });
      
      // 更新所有狀態
      const updatedStatus = {};
      Object.keys(competitionStatus).forEach(eventId => {
        updatedStatus[eventId] = {
          ...competitionStatus[eventId],
          is_finished: newStatus
        };
      });
      setCompetitionStatus(updatedStatus);
      
      message.success(response.data.message || '所有比賽狀態已更新');
    } catch (error) {
      console.error('批量更新比賽狀態失敗:', error);
      message.error('批量更新比賽狀態失敗: ' + error.message);
    } finally {
      setLoading({ all: false });
    }
  };

  const eventList = Object.values(competitionStatus);
  const finishedCount = eventList.filter(event => event.is_finished).length;
  const totalCount = eventList.length;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            <TrophyOutlined /> 比賽狀態管理
          </Title>
          <Text type="secondary">按項目獨立控制比賽狀態，影響名次的顯示</Text>
        </div>

        {/* 整體狀態概覽 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: finishedCount === totalCount ? '#f6ffed' : '#fff7e6',
            border: `2px solid ${finishedCount === totalCount ? '#52c41a' : '#faad14'}`,
            borderRadius: '8px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              {finishedCount === totalCount ? (
                <PauseCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              ) : (
                <PlayCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              )}
            </div>
            <Title level={3} style={{ color: finishedCount === totalCount ? '#52c41a' : '#faad14', margin: 0 }}>
              {finishedCount === totalCount ? '所有比賽已完結' : '比賽進行中'}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {finishedCount}/{totalCount} 個項目已完結
            </Text>
          </div>
        </div>

        {/* 批量操作 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Space size="large">
            <Button
              type="primary"
              onClick={() => updateAllStatus(true)}
              loading={loading.all}
              disabled={finishedCount === totalCount}
            >
              全部設為完結
            </Button>
            <Button
              onClick={() => updateAllStatus(false)}
              loading={loading.all}
              disabled={finishedCount === 0}
            >
              全部設為進行中
            </Button>
          </Space>
        </div>

        <Divider />

        {/* 各項目狀態控制 */}
        <div style={{ marginBottom: '30px' }}>
          <Title level={4} style={{ textAlign: 'center', marginBottom: '20px' }}>
            各項目狀態控制
          </Title>
          <Row gutter={[16, 16]}>
            {eventList.map(event => (
              <Col xs={24} sm={12} lg={8} key={event.event_id}>
                <Card 
                  size="small"
                  style={{ 
                    border: `2px solid ${event.is_finished ? '#52c41a' : '#faad14'}`,
                    backgroundColor: event.is_finished ? '#f6ffed' : '#fff7e6'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <TrophyOutlined style={{ 
                        fontSize: '24px', 
                        color: event.is_finished ? '#52c41a' : '#faad14' 
                      }} />
                    </div>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>
                      {event.event_name}
                    </Title>
                    <Tag color={event.event_type === '個人' ? 'blue' : 'green'} style={{ marginBottom: '12px' }}>
                      {event.event_type}
                    </Tag>
                    <div>
                      <Switch
                        checked={event.is_finished}
                        onChange={(checked) => handleEventStatusChange(event.event_id, checked)}
                        loading={loading[event.event_id]}
                        size="small"
                        checkedChildren="完結"
                        unCheckedChildren="進行中"
                      />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                      {event.is_finished ? '名次已公佈' : '名次未公佈'}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Alert
          message="重要提醒"
          description={
            <div>
              <p>• <strong>比賽進行中</strong>：該項目的名次不會顯示給參賽者和觀眾，只有管理員可以查看</p>
              <p>• <strong>比賽完結</strong>：該項目的名次將公佈給所有人，包括參賽者和觀眾</p>
              <p>• 可以獨立控制每個項目的狀態，無需等待所有項目完成</p>
              <p>• 狀態變更會立即生效，請謹慎操作</p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <div style={{ textAlign: 'center' }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchStatus}
            loading={fetching}
            type="default"
          >
            重新載入狀態
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CompetitionStatus;
