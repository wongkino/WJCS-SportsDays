import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Empty, Row, Col } from 'antd';
import { TrophyOutlined, CrownOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const Winners = ({ loading }) => {
  const [winners, setWinners] = useState({});
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWinners();
  }, []);

  const loadWinners = async () => {
    setLoadingWinners(true);
    setError(null);
    try {
      const response = await axios.get('/api/scores/final/winners');
      console.log('Winners API response:', response.data);
      setWinners(response.data);
    } catch (error) {
      console.error('載入勝出者資料失敗:', error);
      setError('載入勝出者資料失敗: ' + error.message);
    } finally {
      setLoadingWinners(false);
    }
  };

  if (loading || loadingWinners) {
    return (
      <div className="loading">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入勝出者資料中...</div>
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
          <button onClick={loadWinners} style={{ marginLeft: 16 }}>
            重新載入
          </button>
        }
      />
    );
  }

  const winnerKeys = Object.keys(winners);
  if (winnerKeys.length === 0) {
    return (
      <Empty
        description="尚無勝出者資料"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // 檢查是否有有效的冠軍數據
  const hasValidWinners = winnerKeys.some(key => 
    winners[key] && winners[key].champion
  );
  
  if (!hasValidWinners) {
    return (
      <Empty
        description="尚無有效的勝出者資料"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // 按項目分組，只顯示冠軍
  const winnersByEvent = winnerKeys.reduce((acc, key) => {
    const [eventName] = key.split('_');
    if (!acc[eventName]) {
      acc[eventName] = [];
    }
    // 只取冠軍信息
    if (winners[key] && winners[key].champion) {
      console.log(`Processing winner for ${key}:`, winners[key].champion);
      acc[eventName].push({ key, winner: winners[key].champion });
    }
    return acc;
  }, {});
  
  console.log('winnersByEvent:', winnersByEvent);

  return (
    <div>
      <div className="page-heading">
        <h2>
          <CrownOutlined style={{ marginRight: 12 }} />
          最終勝出者
        </h2>
        <p>各項目、各組別、各性別的冠軍得主</p>
      </div>

      {Object.keys(winnersByEvent).map(eventName => (
        <Card 
          key={eventName}
          title={
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 600 }}>
              <TrophyOutlined style={{ marginRight: 12, color: 'var(--accent)' }} />
              {eventName}
            </div>
          }
          style={{ marginBottom: 32 }}
        >
          <Row gutter={[24, 24]}>
            {winnersByEvent[eventName].map(({ key, winner }) => {
              const [, groupType, gender] = key.split('_');
              
              return (
                <Col xs={24} sm={12} lg={8} key={key}>
                  <div className="winner-card">
                    <div style={{ marginBottom: 16 }}>
                      <CrownOutlined style={{ fontSize: 32, color: 'var(--gold)' }} />
                    </div>
                    
                    <h3>
                      {groupType} - {gender}
                    </h3>
                    
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {winner.team_name && winner.team_name !== winner.participant_name ? `${winner.team_name} - ${winner.participant_name}` : winner.participant_name}
                    </div>
                    
                    <div className="score">
                      {winner.score}
                      <span style={{ 
                        fontSize: '1rem',
                        marginLeft: 4,
                        fontWeight: 'normal'
                      }}>
                        {eventName === '來回跑' ? ' 秒' : 
                         eventName === '立定跳遠' ? ' 厘米' :
                         eventName === '火箭投擲' ? ' 米' :
                         eventName === '硬地滾球' ? ' pts' : ''}
                      </span>
                    </div>
                    
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                      冠軍
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      ))}

      <Card className="congrats-card">
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
          <TrophyOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
          恭喜所有勝出者
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          感謝所有參賽者的精彩表現，期待下次運動會的到來。
        </p>
      </Card>
    </div>
  );
};

export default Winners;
