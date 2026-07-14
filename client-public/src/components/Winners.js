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
      setWinners(response.data);
    } catch (error) {
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

  // 按項目分組
  const winnersByEvent = winnerKeys.reduce((acc, key) => {
    const [eventName] = key.split('_');
    if (!acc[eventName]) {
      acc[eventName] = [];
    }
    acc[eventName].push({ key, winner: winners[key] });
    return acc;
  }, {});

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ color: '#ffd700', fontSize: '2.2rem', marginBottom: 16 }}>
          <CrownOutlined style={{ marginRight: 12 }} />
          最終勝出者
        </h2>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>
          各項目、各組別、各性別的冠軍得主
        </p>
      </div>

      {Object.keys(winnersByEvent).map(eventName => (
        <Card 
          key={eventName}
          title={
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.3rem' }}>
              <TrophyOutlined style={{ marginRight: 12, color: '#ffd700' }} />
              {eventName}
            </div>
          }
          style={{ marginBottom: 32 }}
          headStyle={{ 
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            color: '#8b6914',
            fontWeight: 'bold'
          }}
        >
          <Row gutter={[24, 24]}>
            {winnersByEvent[eventName].map(({ key, winner }) => {
              const [, groupType, gender] = key.split('_');
              
              return (
                <Col xs={24} sm={12} lg={8} key={key}>
                  <div className="winner-card">
                    <div style={{ marginBottom: 16 }}>
                      <CrownOutlined style={{ 
                        fontSize: '2rem', 
                        color: '#8b6914',
                        marginBottom: 8
                      }} />
                    </div>
                    
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      color: '#8b6914',
                      fontSize: '1.1rem'
                    }}>
                      {groupType} - {gender}
                    </h3>
                    
                    <div style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold',
                      color: '#8b6914',
                      marginBottom: 8
                    }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {winner.team_name && winner.team_name !== winner.participant_name ? `${winner.team_name} - ${winner.participant_name}` : winner.participant_name}
                    </div>
                    
                    <div className="score" style={{ 
                      fontSize: '2.2rem',
                      fontWeight: 'bold',
                      color: '#8b6914',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
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
                    
                    <div style={{ 
                      marginTop: 12,
                      fontSize: '0.9rem',
                      color: '#8b6914',
                      opacity: 0.8
                    }}>
                      🏆 冠軍
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      ))}

      <Card style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        marginTop: 32
      }}>
        <h3 style={{ color: 'white', marginBottom: 16 }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          恭喜所有勝出者！
        </h3>
        <p style={{ color: 'white', opacity: 0.9, margin: 0 }}>
          感謝所有參賽者的精彩表現，期待下次運動會的到來！
        </p>
      </Card>
    </div>
  );
};

export default Winners;
