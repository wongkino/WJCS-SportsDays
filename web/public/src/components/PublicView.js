import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Spin, Button } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

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
        <div className={`rank-chip is-${index + 1}`}>
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
            <div className="muted">
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
      <div className="public-state">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-state is-error">{error}</div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-hero">
        <h1>懷智運動會</h1>
        <div className="subtitle">即時排名與結果查詢</div>
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
            <div key={event.id} className="event-block">
              <div className="event-heading">
                <TrophyOutlined />
                {event.name}
                <Tag color="blue">{event.type}</Tag>
              </div>
              <div className="empty-panel">比賽已完結，暫無結果數據</div>
            </div>
          );
        }
        
        // 如果該項目比賽未完結，顯示提示訊息
        if (!isEventFinished(event.id)) {
          return (
            <div key={event.id} className="event-block">
              <div className="event-heading">
                <TrophyOutlined />
                {event.name}
                <Tag color="blue">{event.type}</Tag>
              </div>
              <div className="empty-panel">該項目比賽尚未完結，名次將在比賽結束後公佈</div>
            </div>
          );
        }
        
        return (
          <div key={event.id} className="event-block">
            <div className="event-heading">
              <TrophyOutlined />
              {event.name}
              <Tag color="blue">{event.type}</Tag>
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
                  <div className="group-banner">
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
                            className="gender-card"
                            title={gender}
                          >
                            
                            
                            {/* 決賽排名 */}
                            {genderData.final && (
                              <div>
                                <div className="section-label">決賽排名</div>
                                <div>
                                  {genderData.final.champion && (
                                    <div className="podium is-gold">
                                      <div className="podium-place">冠軍</div>
                                      <div className="podium-name">
                                        {genderData.final.champion.team_name && genderData.final.champion.team_name !== genderData.final.champion.participant_name 
                                          ? `${genderData.final.champion.team_name} - ${genderData.final.champion.participant_name}` 
                                          : genderData.final.champion.participant_name}
                                      </div>
                                      <div className="podium-score">
                                        {genderData.final.champion.score}
                                        {genderData.final.champion.event_name === '來回跑' ? '秒' :
                                         genderData.final.champion.event_name === '立定跳遠' ? '厘米' :
                                         genderData.final.champion.event_name === '火箭投擲' ? '米' :
                                         genderData.final.champion.event_name === '硬地滾球' ? 'pts' : ''}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {genderData.final.runnerUp && (
                                    <div className="podium is-silver">
                                      <div className="podium-place">亞軍</div>
                                      <div className="podium-name">
                                        {genderData.final.runnerUp.team_name && genderData.final.runnerUp.team_name !== genderData.final.runnerUp.participant_name 
                                          ? `${genderData.final.runnerUp.team_name} - ${genderData.final.runnerUp.participant_name}` 
                                          : genderData.final.runnerUp.participant_name}
                                      </div>
                                      <div className="podium-score">
                                        {genderData.final.runnerUp.score}
                                        {genderData.final.runnerUp.event_name === '來回跑' ? '秒' :
                                         genderData.final.runnerUp.event_name === '立定跳遠' ? '厘米' :
                                         genderData.final.runnerUp.event_name === '火箭投擲' ? '米' :
                                         genderData.final.runnerUp.event_name === '硬地滾球' ? 'pts' : ''}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {genderData.final.thirdPlace && (
                                    <div className="podium is-bronze">
                                      <div className="podium-place">季軍</div>
                                      <div className="podium-name">
                                        {genderData.final.thirdPlace.team_name && genderData.final.thirdPlace.team_name !== genderData.final.thirdPlace.participant_name 
                                          ? `${genderData.final.thirdPlace.team_name} - ${genderData.final.thirdPlace.participant_name}` 
                                          : genderData.final.thirdPlace.participant_name}
                                      </div>
                                      <div className="podium-score">
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
                                <div className="section-label">決賽入圍者（初賽首 8 名）</div>
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

      <div className="public-footer">
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchData}
          loading={loading}
          size="large"
        >
          手動更新資料
        </Button>
        <div className="muted" style={{ marginTop: 16 }}>
          {lastUpdateTime ? `最後更新時間: ${lastUpdateTime.toLocaleString('zh-TW')}` : '尚未載入資料'}
        </div>
      </div>
    </div>
  );
};

export default PublicView;