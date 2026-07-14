import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const PreliminaryResults = ({ loading }) => {
  const [results, setResults] = useState({});
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreliminaryResults();
  }, []);

  const loadPreliminaryResults = async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const response = await axios.get('/api/scores/preliminary/top3');
      setResults(response.data);
    } catch (error) {
      setError('載入初賽結果失敗: ' + error.message);
    } finally {
      setLoadingResults(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return '';
    }
  };

  if (loading || loadingResults) {
    return (
      <div className="loading">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入初賽結果中...</div>
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
          <button onClick={loadPreliminaryResults} style={{ marginLeft: 16 }}>
            重新載入
          </button>
        }
      />
    );
  }

  const resultKeys = Object.keys(results);
  if (resultKeys.length === 0) {
    return (
      <Empty
        description="尚無初賽結果"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ color: '#1890ff', fontSize: '1.8rem' }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          初賽前三名結果
        </h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          各項目、各組別、各性別的前三名參賽者
        </p>
      </div>

      {resultKeys.map(key => {
        const [eventName, groupType, gender] = key.split('_');
        const top3 = results[key];
        
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
            {top3.length === 0 ? (
              <Empty description="尚無此組別的初賽結果" />
            ) : (
              <div>
                {top3.map((result, index) => (
                  <div 
                    key={result.id}
                    className={`rank-card ${getRankClass(index + 1)}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="rank-number">
                        {getRankIcon(index + 1)}
                      </span>
                      <div className="participant-info">
                        <div className="participant-name">
                          <UserOutlined style={{ marginRight: 8 }} />
                          {result.participant_name}
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

export default PreliminaryResults;
