import React, { useState, useEffect, useCallback } from 'react';
import { Card, Spin, Alert, Empty, Select } from 'antd';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const FinalResults = ({ loading }) => {
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [events, setEvents] = useState([]);

  const loadEvents = useCallback(async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('載入事件列表失敗:', error);
    }
  }, []);

  const loadFinalResults = useCallback(async () => {
    setLoadingResults(true);
    setError(null);
    try {
      // 使用決賽入圍者端點，現在返回按組別分組的對象
      const response = await axios.get('/api/scores/final/qualifiers');
      let groupedData = response.data;
      
      // 將分組的對象轉換為數組
      let allResults = [];
      Object.keys(groupedData).forEach(groupKey => {
        const groupResults = groupedData[groupKey];
        if (Array.isArray(groupResults)) {
          allResults = allResults.concat(groupResults);
        }
      });
      
      // 如果選擇了特定事件，則過濾結果
      if (selectedEvent !== 'all') {
        allResults = allResults.filter(result => result.event_id === parseInt(selectedEvent));
      }
      
      setResults(allResults);
    } catch (error) {
      setError('載入決賽結果失敗: ' + error.message);
    } finally {
      setLoadingResults(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadFinalResults();
  }, [selectedEvent, loadFinalResults]);

  // 按項目、組別、性別分組
  const groupedResults = results.reduce((acc, result) => {
    const key = `${result.event_name}_${result.group_type}_${result.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {});

  if (loading || loadingResults) {
    return (
      <div className="loading">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入決賽結果中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="載入失敗"
        description={error}
        type="error"
        showIcon
        action={
          <button onClick={loadFinalResults} style={{ marginLeft: 16 }}>
            重新載入
          </button>
        }
      />
    );
  }

  const resultKeys = Object.keys(groupedResults);
  if (resultKeys.length === 0) {
    return (
      <Empty
        description="尚無決賽結果"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <div className="page-heading">
        <h2>
          <TrophyOutlined style={{ marginRight: 8 }} />
          決賽入圍者
        </h2>
        <p>各項目決賽參賽者及成績排名</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 'bold' }}>篩選項目：</span>
          <Select
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ minWidth: 200 }}
          >
            <Option value="all">全部項目</Option>
            {events.map(event => (
              <Option key={event.id} value={event.id.toString()}>
                {event.name}
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {resultKeys.map(key => {
        const [eventName, groupType, gender] = key.split('_');
        const qualifiers = groupedResults[key];
        
        return (
          <Card 
            key={key}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrophyOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {eventName}
                </span>
                <span style={{ 
                  marginLeft: 16, 
                  fontSize: '1rem', 
                  color: '#666',
                  fontWeight: 'normal'
                }}>
                  {groupType} - {gender}
                </span>
              </div>
            }
            style={{ marginBottom: 24 }}
          >
            {qualifiers.length === 0 ? (
              <Empty description="尚無此組別的決賽結果" />
            ) : (
              <div>
                {qualifiers.map((result, index) => (
                  <div 
                    key={result.id}
                    className="rank-card"
                    style={{
                      background: index === 0 ? 'rgba(201,162,39,0.08)' : undefined,
                      borderLeft: index === 0 ? '4px solid var(--gold)' : '1px solid var(--separator)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        className="rank-number"
                        style={{
                          background: index === 0 ? 'var(--gold)' : 'var(--accent)',
                          color: index === 0 ? '#1d1d1f' : '#fff'
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="participant-info">
                        <div className="participant-name">
                          <UserOutlined style={{ marginRight: 8 }} />
                          {result.team_name && result.team_name !== result.participant_name ? `${result.team_name} - ${result.participant_name}` : result.participant_name}
                          {index === 0 && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>冠軍</span>}
                        </div>
                        <div className="participant-details">
                          {result.group_type} - {result.gender}
                        </div>
                      </div>
                      <div className="score-display">
                        {result.score}
                        {eventName === '來回跑' ? ' 秒' : 
                         eventName === '立定跳遠' ? ' 厘米' :
                         eventName === '火箭投擲' ? ' 米' :
                         eventName === '硬地滾球' ? ' pts' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default FinalResults;
