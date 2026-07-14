import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Empty, Select } from 'antd';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const FinalResults = ({ loading }) => {
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');

  useEffect(() => {
    loadFinalResults();
  }, [selectedEvent]);

  const loadFinalResults = async () => {
    setLoadingResults(true);
    setError(null);
    try {
      let url = '/api/scores/final/qualifiers';
      if (selectedEvent !== 'all') {
        url = `/api/scores/event/${selectedEvent}?round=決賽`;
      }
      const response = await axios.get(url);
      setResults(response.data);
    } catch (error) {
      setError('載入決賽結果失敗: ' + error.message);
    } finally {
      setLoadingResults(false);
    }
  };

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
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ color: '#1890ff', fontSize: '1.8rem' }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          決賽入圍者
        </h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          各項目決賽參賽者及成績排名
        </p>
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
            <Option value="1">來回跑</Option>
            <Option value="2">立定跳遠</Option>
            <Option value="3">火箭投擲</Option>
            <Option value="4">硬地滾球</Option>
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
                <TrophyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
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
            headStyle={{ background: '#f0f8ff' }}
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
                      background: index === 0 ? '#fff9e6' : 'white',
                      borderLeft: index === 0 ? '4px solid #ffd700' : '1px solid #e8e8e8'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        className="rank-number"
                        style={{
                          background: index === 0 ? '#ffd700' : '#1890ff',
                          color: index === 0 ? '#8b6914' : 'white'
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="participant-info">
                        <div className="participant-name">
                          <UserOutlined style={{ marginRight: 8 }} />
                          {result.participant_name}
                          {index === 0 && <span style={{ color: '#ffd700', marginLeft: 8 }}>🏆</span>}
                        </div>
                        <div className="participant-details">
                          {result.group_type} - {result.gender}
                          {result.team_name && ` | 隊伍：${result.team_name}`}
                        </div>
                      </div>
                      <div className="score-display">
                        {result.score}
                        {eventName === '來回跑' ? ' 秒' : 
                         eventName === '立定跳遠' ? ' 公分' :
                         eventName === '火箭投擲' ? ' 公尺' :
                         eventName === '硬地滾球' ? ' 分' : ''}
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
