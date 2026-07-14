import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Spin, Alert, Row, Col, Statistic, Typography, Space, Button } from 'antd';
import { TrophyOutlined, MedalOutlined, CrownOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PublicView = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [finalQualifiers, setFinalQualifiers] = useState([]);
  const [finalWinners, setFinalWinners] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [competitionStatus, setCompetitionStatus] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, participantsRes, qualifiersRes, winnersRes, statusRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/participants'),
        axios.get('/api/scores/final/qualifiers'),
        axios.get('/api/scores/final/winners'),
        axios.get('/api/competition/status')
      ]);

      setEvents(eventsRes.data);
      setParticipants(participantsRes.data);
      setFinalQualifiers(qualifiersRes.data);
      setFinalWinners(winnersRes.data);
      setCompetitionStatus(statusRes.data);
      setLastUpdateTime(new Date());
    } catch (err) {
      setError('無法載入資料，請稍後再試');
      console.error('載入資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : '未知參賽者';
  };

  const getParticipantInfo = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant || { name: '未知參賽者', group_type: '', gender: '', team_name: '' };
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : '未知項目';
  };

  const getEventType = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.type : '';
  };

  const isEventFinished = (eventId) => {
    return competitionStatus[eventId]?.is_finished || false;
  };


  const finalColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => (
        <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default'}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank} 
          {rank <= 3 ? '名' : ''}
        </Tag>
      ),
    },
    {
      title: '比賽項目',
      dataIndex: 'event_id',
      key: 'event_id',
      render: (eventId) => (
        <div>
          <Text strong>{getEventName(eventId)}</Text>
          <br />
          <Tag color="blue">{getEventType(eventId)}</Tag>
        </div>
      ),
    },
    {
      title: '參賽者',
      dataIndex: 'participant_id',
      key: 'participant_id',
      render: (participantId) => {
        const participant = getParticipantInfo(participantId);
        return (
          <div>
            <Text strong>{participant.team_name && participant.team_name !== participant.name ? `${participant.team_name} - ${participant.name}` : participant.name}</Text>
            <br />
            <Tag color="green">{participant.group_type}</Tag>
            <Tag color="purple">{participant.gender}</Tag>
          </div>
        );
      },
    },
    {
      title: '決賽分數',
      dataIndex: 'final_score',
      key: 'final_score',
      render: (score, record) => (
        <Text strong style={{ fontSize: '16px' }}>
          {score}
          {getEventName(record.event_id) === '來回跑' ? '秒' :
           getEventName(record.event_id) === '立定跳遠' ? '公分' :
           getEventName(record.event_id) === '火箭投擲' ? '公尺' :
           getEventName(record.event_id) === '硬地滾球' ? '分' : ''}
        </Text>
      ),
    },
  ];

  const winnerColumns = [
    {
      title: '🏆 冠軍',
      dataIndex: 'participant_id',
      key: 'participant_id',
      render: (participantId, record) => {
        const participant = getParticipantInfo(participantId);
        return (
          <div style={{ textAlign: 'center' }}>
            <CrownOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
            <br />
            <Text strong style={{ fontSize: '18px' }}>{participant.name}</Text>
            <br />
            <Tag color="green">{participant.group_type}</Tag>
            <Tag color="purple">{participant.gender}</Tag>
            <br />
            <Text strong style={{ fontSize: '16px', color: '#faad14' }}>
              {record.final_score}
              {getEventName(record.event_id) === '來回跑' ? '秒' :
               getEventName(record.event_id) === '立定跳遠' ? '公分' :
               getEventName(record.event_id) === '火箭投擲' ? '公尺' :
               getEventName(record.event_id) === '硬地滾球' ? '分' : ''}
            </Text>
          </div>
        );
      },
    },
    {
      title: '比賽項目',
      dataIndex: 'event_id',
      key: 'event_id',
      render: (eventId) => (
        <div style={{ textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
          <br />
          <Text strong style={{ fontSize: '18px' }}>{getEventName(eventId)}</Text>
          <br />
          <Tag color="blue">{getEventType(eventId)}</Tag>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>載入比賽資料中...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入失敗"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={fetchData} style={{ marginLeft: '16px' }}>
              重新載入
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={1} style={{ color: '#1890ff' }}>
          <EyeOutlined /> 運動會即時排名
        </Title>
        <Text type="secondary">即時查看比賽結果和排名</Text>
      </div>

      <Tabs defaultActiveKey="winners" size="large" centered>
        <TabPane tab={<span><CrownOutlined />最終冠軍</span>} key="winners">
          <Card title="🏆 各項目冠軍" style={{ marginBottom: '20px' }}>
            {(() => {
              const finishedWinners = finalWinners.filter(winner => isEventFinished(winner.event_id));
              const unfinishedEvents = events.filter(event => !isEventFinished(event.id));
              
              if (finishedWinners.length > 0) {
                return (
                  <Table
                    columns={winnerColumns}
                    dataSource={finishedWinners}
                    rowKey="id"
                    pagination={false}
                    size="large"
                  />
                );
              } else if (unfinishedEvents.length > 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">
                      以下項目尚未完結，名次將在比賽結束後公佈：
                    </Text>
                    <div style={{ marginTop: '16px' }}>
                      {unfinishedEvents.map(event => (
                        <Tag key={event.id} color="orange" style={{ margin: '4px' }}>
                          {event.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">尚未產生冠軍</Text>
                  </div>
                );
              }
            })()}
          </Card>
        </TabPane>

        <TabPane tab={<span><MedalOutlined />決賽排名</span>} key="final">
          <Card title="🥇 決賽排名" style={{ marginBottom: '20px' }}>
            {(() => {
              const finishedQualifiers = finalQualifiers.filter(qualifier => isEventFinished(qualifier.event_id));
              const unfinishedEvents = events.filter(event => !isEventFinished(event.id));
              
              if (finishedQualifiers.length > 0) {
                return (
                  <Table
                    columns={finalColumns}
                    dataSource={finishedQualifiers}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="large"
                  />
                );
              } else if (unfinishedEvents.length > 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">
                      以下項目尚未完結，名次將在比賽結束後公佈：
                    </Text>
                    <div style={{ marginTop: '16px' }}>
                      {unfinishedEvents.map(event => (
                        <Tag key={event.id} color="orange" style={{ margin: '4px' }}>
                          {event.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">決賽尚未開始</Text>
                  </div>
                );
              }
            })()}
          </Card>
        </TabPane>

      </Tabs>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchData}
          loading={loading}
          size="large"
          style={{ marginBottom: '16px' }}
        >
          手動更新資料
        </Button>
        <br />
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {lastUpdateTime ? `最後更新時間: ${lastUpdateTime.toLocaleString('zh-TW')}` : '尚未載入資料'}
        </Text>
      </div>
    </div>
  );
};

export default PublicView;
