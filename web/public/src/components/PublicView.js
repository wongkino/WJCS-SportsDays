import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Spin, Button } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const PublicView = () => {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [preliminaryResults, setPreliminaryResults] = useState({});
  const [finalQualifiers, setFinalQualifiers] = useState([]);
  const [finalWinners, setFinalWinners] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [competitionStatus, setCompetitionStatus] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, participantsRes, preliminaryRes, qualifiersRes, winnersRes, statusRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/participants'),
        axios.get('/api/scores/preliminary/top3'),
        axios.get('/api/scores/final/qualifiers'),
        axios.get('/api/scores/final/winners'),
        axios.get('/api/competition/status')
      ]);

      setEvents(eventsRes.data);
      setParticipants(participantsRes.data);
      setPreliminaryResults(preliminaryRes.data);
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

  useEffect(() => {
    fetchData();
  }, []);

  const getParticipantInfo = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant || { name: '未知參賽者', group_type: '', gender: '', team_name: '' };
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : '未知項目';
  };

  const isEventFinished = (eventId) => {
    return competitionStatus[eventId]?.is_finished || false;
  };

  const getGroupColor = (groupType) => {
    const colors = {
      '工場及社區組': { color: '#1890ff', bg: 'linear-gradient(135deg, #e6f7ff, #f0f9ff)', border: '#91d5ff' },
      '展能組': { color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed, #f0fff0)', border: '#b7eb8f' },
      '測試組別': { color: '#722ed1', bg: 'linear-gradient(135deg, #f9f0ff, #efdbff)', border: '#d3adf7' }
    };
    return colors[groupType] || { color: '#fa8c16', bg: 'linear-gradient(135deg, #fff7e6, #fff2e8)', border: '#ffd591' };
  };

  const getEventResults = () => {
    const eventResults = {};
    
    if (events && events.length > 0) {
      events.forEach(event => {
        
        // finalQualifiers 現在是按組別分組的物件，包含每組首8位入圍者
        const finalQualifiersByGroup = {};
        if (finalQualifiers && typeof finalQualifiers === 'object') {
          Object.keys(finalQualifiers).forEach(key => {
            const groupResults = finalQualifiers[key];
            if (Array.isArray(groupResults) && groupResults.length > 0 && 
                key.startsWith(event.name) && groupResults[0].event_id === event.id) {
              const groupKey = `${groupResults[0].group_type}_${groupResults[0].gender}`;
              finalQualifiersByGroup[groupKey] = {
                group_type: groupResults[0].group_type,
                gender: groupResults[0].gender,
                results: groupResults // 每組首8位入圍者
              };
            }
          });
        }
        
        // finalWinners 是物件，包含冠亞季排名
        // 按分組別整理冠亞季排名
        const groupRankings = {};
        if (finalWinners && typeof finalWinners === 'object') {
          Object.keys(finalWinners).forEach(key => {
            const ranking = finalWinners[key];
            // 檢查鍵名是否以事件名稱開頭，並且結果屬於該事件
            if (ranking && ranking.champion && 
                key.startsWith(event.name) && ranking.champion.event_id === event.id) {
              const groupKey = `${ranking.champion.group_type}_${ranking.champion.gender}`;
              groupRankings[groupKey] = {
                group_type: ranking.champion.group_type,
                gender: ranking.champion.gender,
                champion: ranking.champion,
                runnerUp: ranking.runnerUp,
                thirdPlace: ranking.thirdPlace
              };
            }
          });
        }
        
        // 動態創建按組別和性別分層的映射
        const winnersByEventTypeGender = {};
        
        // 收集所有出現的組別
        const allGroupTypes = new Set();
        Object.keys(finalQualifiersByGroup).forEach(key => {
          const groupType = key.split('_')[0];
          allGroupTypes.add(groupType);
        });
        Object.keys(groupRankings).forEach(key => {
          const groupType = key.split('_')[0];
          allGroupTypes.add(groupType);
        });
        
        // 為每個組別創建映射
        allGroupTypes.forEach(groupType => {
          winnersByEventTypeGender[groupType] = {
            '男': {
              finalQualifiers: finalQualifiersByGroup[`${groupType}_男`] || null,
              final: groupRankings[`${groupType}_男`] || null
            },
            '女': {
              finalQualifiers: finalQualifiersByGroup[`${groupType}_女`] || null,
              final: groupRankings[`${groupType}_女`] || null
            }
          };
        });

        eventResults[event.id] = {
          event: event,
          finalQualifiersByGroup: finalQualifiersByGroup,
          groupRankings: groupRankings,
          winnersByEventTypeGender: winnersByEventTypeGender
        };
      });
    }
    
    return eventResults;
  };

  const resultColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (text, record, index) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: index === 0 ? '#faad14' : index === 1 ? '#d9d9d9' : '#cd7f32',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: '參賽者',
      key: 'participant',
      render: (record) => {
        const participantName = record.participant_name || getParticipantInfo(record.participant_id).name;
        const teamName = record.team_name || getParticipantInfo(record.participant_id).team_name;
        const groupType = record.group_type || getParticipantInfo(record.participant_id).group_type;
        const gender = record.gender || getParticipantInfo(record.participant_id).gender;
        
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {teamName && teamName !== participantName ? `${teamName} - ${participantName}` : participantName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {groupType} - {gender}
            </div>
          </div>
        );
      }
    },
    {
      title: '分數',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score, record) => {
        const eventName = record.event_name || getEventName(record.event_id);
        return (
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          {score}
            {eventName === '來回跑' ? '秒' :
             eventName === '立定跳遠' ? '厘米' :
             eventName === '火箭投擲' ? '米' :
             eventName === '硬地滾球' ? 'pts' : ''}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ color: '#ff4d4f', fontSize: '16px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={1} style={{ 
          fontSize: '48px',
          color: '#1890ff', 
          marginBottom: '12px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          懷智運動會
        </Title>
        <Text type="secondary" style={{ fontSize: '20px' }}>
          即時排名與結果查詢
        </Text>
      </div>

      {/* 按組別和性別分層顯示結果 */}
      {events && events.length > 0 ? events.map(event => {
        const allEventResults = getEventResults();
        const results = allEventResults[event.id] || { winnersByEventTypeGender: {} };
        const winnersByEventTypeGender = results.winnersByEventTypeGender || {};
        
        // 檢查是否有任何結果
        const hasAnyResults = Object.keys(winnersByEventTypeGender).some(groupType => 
          Object.keys(winnersByEventTypeGender[groupType]).some(gender => 
            winnersByEventTypeGender[groupType][gender].finalQualifiers ||
            winnersByEventTypeGender[groupType][gender].final
          )
        );
        
        if (!hasAnyResults) {
          // 如果比賽進行中且沒有數據，則隱藏該項目
          if (!isEventFinished(event.id)) {
            return null;
          }
          
          // 如果比賽已完結但沒有數據，則顯示提示
          return (
            <div key={event.id} style={{ marginBottom: '40px' }}>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                marginBottom: '28px',
                textAlign: 'center',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrophyOutlined style={{ marginRight: '16px', fontSize: '32px' }} />
                {event.name}
                <Tag color="blue" style={{ marginLeft: '16px', fontSize: '16px' }}>{event.type}</Tag>
              </div>
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '18px' }}>
                  比賽已完結，暫無結果數據
                </Text>
              </div>
            </div>
          );
        }
        
        // 如果該項目比賽未完結，顯示提示訊息
        if (!isEventFinished(event.id)) {
          return (
            <div key={event.id} style={{ marginBottom: '40px' }}>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                marginBottom: '28px',
                textAlign: 'center',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrophyOutlined style={{ marginRight: '16px', fontSize: '32px' }} />
                {event.name}
                <Tag color="blue" style={{ marginLeft: '16px', fontSize: '16px' }}>{event.type}</Tag>
              </div>
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '18px' }}>
                  該項目比賽尚未完結，名次將在比賽結束後公佈
                </Text>
              </div>
            </div>
          );
        }
        
        return (
          <div key={event.id} style={{ marginBottom: '40px' }}>
            {/* 比賽項目標題 */}
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              marginBottom: '28px',
              textAlign: 'center',
              color: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrophyOutlined style={{ marginRight: '16px', fontSize: '32px' }} />
              {event.name}
              <Tag color="blue" style={{ marginLeft: '16px', fontSize: '16px' }}>{event.type}</Tag>
            </div>
            
            {/* 按組別分區塊 */}
            {Object.keys(winnersByEventTypeGender).map(groupType => {
              const groupData = winnersByEventTypeGender[groupType];
              const hasGroupResults = Object.keys(groupData).some(gender => 
                groupData[gender].preliminary || groupData[gender].finalQualifiers || groupData[gender].final
              );
              
              if (!hasGroupResults) return null;
              
              return (
                <div key={groupType} style={{ marginBottom: '32px' }}>
                  {/* 組別標題 */}
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    marginBottom: '20px',
                    textAlign: 'center',
                    color: groupType === '工場及社區組' ? '#1890ff' : '#52c41a',
                    background: groupType === '工場及社區組' 
                      ? 'linear-gradient(135deg, #e6f7ff, #f0f9ff)' 
                      : 'linear-gradient(135deg, #f6ffed, #f0fff0)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: groupType === '工場及社區組' 
                      ? '2px solid #91d5ff' 
                      : '2px solid #b7eb8f'
                  }}>
                    {groupType}
                  </div>
                  
                  {/* 按性別分區塊 */}
                  <Row gutter={[16, 16]}>
                    {Object.keys(groupData).map(gender => {
                      const genderData = groupData[gender];
                      const hasGenderResults = genderData.preliminary || genderData.finalQualifiers || genderData.final;
                      
                      if (!hasGenderResults) return null;
                      
                      return (
                        <Col xs={24} lg={12} key={`${event.id}-${groupType}-${gender}`}>
                          <Card 
                            title={
                              <div style={{ 
                                textAlign: 'center', 
                                fontSize: '22px', 
                                fontWeight: 'bold',
                                color: groupType === '工場及社區組' ? '#1890ff' : '#52c41a'
                              }}>
                                {gender}
                              </div>
                            }
                            style={{ 
                              minHeight: '400px',
                              background: groupType === '工場及社區組' ? '#f8f9fa' : '#f6ffed'
                            }}
                          >
                            
                            
                            {/* 決賽排名 */}
                            {genderData.final && (
                              <div>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  marginBottom: '16px',
                                  color: '#52c41a',
                                  textAlign: 'center'
                                }}>
                                  🏆 決賽排名
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  {genderData.final.champion && (
                                    <div style={{ marginBottom: '12px' }}>
                                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14', marginBottom: '6px' }}>
                                        🥇 冠軍
                                      </div>
                                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                        {genderData.final.champion.team_name && genderData.final.champion.team_name !== genderData.final.champion.participant_name 
                                          ? `${genderData.final.champion.team_name} - ${genderData.final.champion.participant_name}` 
                                          : genderData.final.champion.participant_name}
                                      </div>
                                      <div style={{ fontSize: '18px', color: '#666' }}>
                                        {genderData.final.champion.score}
                                        {genderData.final.champion.event_name === '來回跑' ? '秒' :
                                         genderData.final.champion.event_name === '立定跳遠' ? '厘米' :
                                         genderData.final.champion.event_name === '火箭投擲' ? '米' :
                                         genderData.final.champion.event_name === '硬地滾球' ? 'pts' : ''}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {genderData.final.runnerUp && (
                                    <div style={{ marginBottom: '12px' }}>
                                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d9d9d9', marginBottom: '6px' }}>
                                        🥈 亞軍
                                      </div>
                                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {genderData.final.runnerUp.team_name && genderData.final.runnerUp.team_name !== genderData.final.runnerUp.participant_name 
                                          ? `${genderData.final.runnerUp.team_name} - ${genderData.final.runnerUp.participant_name}` 
                                          : genderData.final.runnerUp.participant_name}
                                      </div>
                                      <div style={{ fontSize: '16px', color: '#666' }}>
                                        {genderData.final.runnerUp.score}
                                        {genderData.final.runnerUp.event_name === '來回跑' ? '秒' :
                                         genderData.final.runnerUp.event_name === '立定跳遠' ? '厘米' :
                                         genderData.final.runnerUp.event_name === '火箭投擲' ? '米' :
                                         genderData.final.runnerUp.event_name === '硬地滾球' ? 'pts' : ''}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {genderData.final.thirdPlace && (
                                    <div>
                                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cd7f32', marginBottom: '6px' }}>
                                        🥉 季軍
                                      </div>
                                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {genderData.final.thirdPlace.team_name && genderData.final.thirdPlace.team_name !== genderData.final.thirdPlace.participant_name 
                                          ? `${genderData.final.thirdPlace.team_name} - ${genderData.final.thirdPlace.participant_name}` 
                                          : genderData.final.thirdPlace.participant_name}
                                      </div>
                                      <div style={{ fontSize: '16px', color: '#666' }}>
                                        {genderData.final.thirdPlace.score}
                                        {genderData.final.thirdPlace.event_name === '來回跑' ? '秒' :
                                         genderData.final.thirdPlace.event_name === '立定跳遠' ? '厘米' :
                                         genderData.final.thirdPlace.event_name === '火箭投擲' ? '米' :
                                         genderData.final.thirdPlace.event_name === '硬地滾球' ? 'pts' : ''}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* 決賽入圍者 */}
                            {genderData.finalQualifiers && (
                              <div>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  marginBottom: '16px',
                                  color: '#722ed1',
                                  textAlign: 'center'
                                }}>
                                  🎯 決賽入圍者 (初賽首8名)
                                </div>
                                <Table
                                  columns={resultColumns}
                                  dataSource={genderData.finalQualifiers.results}
                                  rowKey="id"
                                  pagination={false}
                                  size="small"
                                  showHeader={false}
                                />
                              </div>
                            )}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              );
            })}
          </div>
        );
      }) : null}

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