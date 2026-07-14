import React, { useState, useEffect } from 'react';
import { Tabs, message } from 'antd';
import axios from 'axios';
import ParticipantManagement from './components/ParticipantManagement';
import ScoreInput from './components/ScoreInput';
import PreliminaryResults from './components/PreliminaryResults';
import FinalResults from './components/FinalResults';
import Winners from './components/Winners';
import './index.css';

const { TabPane } = Tabs;

function App() {
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // 載入參賽者和比賽項目資料
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [participantsRes, eventsRes] = await Promise.all([
        axios.get('/api/participants'),
        axios.get('/api/events')
      ]);
      setParticipants(participantsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      message.error('載入資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantAdded = (newParticipant) => {
    setParticipants(prev => [...prev, newParticipant]);
    message.success('參賽者新增成功');
  };

  const handleScoreAdded = () => {
    message.success('分數記錄成功');
  };

  return (
    <div className="app-container">
      <div className="content-container">
        <div className="header">
          <h1>🏆 運動會計分程式</h1>
          <p>工場及社區組 & 展能組 | 個人 & 團體項目</p>
        </div>
        
        <div className="tab-container">
          <Tabs defaultActiveKey="1" size="large" centered>
            <TabPane tab="👥 參賽者管理" key="1">
              <ParticipantManagement 
                participants={participants}
                onParticipantAdded={handleParticipantAdded}
                loading={loading}
              />
            </TabPane>
            
            <TabPane tab="📝 分數輸入" key="2">
              <ScoreInput 
                participants={participants}
                events={events}
                onScoreAdded={handleScoreAdded}
                loading={loading}
              />
            </TabPane>
            
            <TabPane tab="🥉 初賽前三名" key="3">
              <PreliminaryResults loading={loading} />
            </TabPane>
            
            <TabPane tab="🏅 決賽入圍者" key="4">
              <FinalResults loading={loading} />
            </TabPane>
            
            <TabPane tab="🏆 最終勝出者" key="5">
              <Winners loading={loading} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default App;
