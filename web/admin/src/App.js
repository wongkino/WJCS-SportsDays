import React, { useState, useEffect } from 'react';
import { Tabs, message, Button, Space } from 'antd';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import ParticipantAdd from './components/ParticipantAdd';
import ParticipantEdit from './components/ParticipantEdit';
import ScoreInput from './components/ScoreInput';
import BatchScoreInput from './components/BatchScoreInput';
import ScoreEdit from './components/ScoreEdit';
import FinalResults from './components/FinalResults';
import Winners from './components/Winners';
import Login from './components/Login';
import ExportData from './components/ExportData';
import ImportData from './components/ImportData';
import CompetitionStatus from './components/CompetitionStatus';
import ScorerManagement from './components/ScorerManagement';
import ScorerScoreInput from './components/ScorerScoreInput';
import EventManagement from './components/EventManagement';
import ParticipantGroupManagement from './components/ParticipantGroupManagement';
import AdminProfile from './components/AdminProfile';
import './index.css';

const { TabPane } = Tabs;

function App() {
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [activeSubTab, setActiveSubTab] = useState({});
  const [adminProfileVisible, setAdminProfileVisible] = useState(false);

  // 載入參賽者和比賽項目資料
  useEffect(() => {
    loadData();
  }, []);

  // 檢查登入狀態和恢復 tab 狀態
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const loginData = localStorage.getItem('adminLogin');
        if (loginData) {
          const parsedData = JSON.parse(loginData);
          if (parsedData.isLoggedIn) {
            // 檢查登入時間是否超過24小時
            const loginTime = new Date(parsedData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              setIsLoggedIn(true);
              // 恢復 tab 狀態
              restoreTabState();
            } else {
              // 超過24小時，清除登入狀態
              localStorage.removeItem('adminLogin');
              localStorage.removeItem('adminTabState');
              setIsLoggedIn(false);
            }
          }
        }
      } catch (error) {
        console.error('檢查登入狀態失敗:', error);
        localStorage.removeItem('adminLogin');
        localStorage.removeItem('adminTabState');
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 恢復 tab 狀態
  const restoreTabState = () => {
    try {
      const tabState = localStorage.getItem('adminTabState');
      if (tabState) {
        const parsedState = JSON.parse(tabState);
        setActiveTab(parsedState.activeTab || '1');
        setActiveSubTab(parsedState.activeSubTab || {});
      }
    } catch (error) {
      console.error('恢復 tab 狀態失敗:', error);
    }
  };

  // 保存 tab 狀態
  const saveTabState = (tab, subTab = null) => {
    try {
      const newSubTab = subTab ? { ...activeSubTab, [tab]: subTab } : activeSubTab;
      const tabState = {
        activeTab: tab,
        activeSubTab: newSubTab
      };
      localStorage.setItem('adminTabState', JSON.stringify(tabState));
      setActiveTab(tab);
      setActiveSubTab(newSubTab);
    } catch (error) {
      console.error('保存 tab 狀態失敗:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [participantsRes, eventsRes, groupsRes] = await Promise.all([
        axios.get('/api/participants'),
        axios.get('/api/events'),
        axios.get('/api/participant-groups')
      ]);
      setParticipants(participantsRes.data);
      setEvents(eventsRes.data);
      setGroups(groupsRes.data);
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

  const handleGroupUpdated = () => {
    // 重新載入組別資料
    loadData();
  };

  const handleScoreAdded = () => {
    message.success('分數記錄成功');
  };

  const handleLogin = (success) => {
    setIsLoggedIn(success);
  };

  const handleLogout = () => {
    // 清除登入狀態和 tab 狀態
    localStorage.removeItem('adminLogin');
    localStorage.removeItem('adminTabState');
    setIsLoggedIn(false);
    setActiveTab('1');
    setActiveSubTab({});
    message.success('已登出');
  };

  // 如果未登入，顯示登入頁面
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="content-container">
        <div className="header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '32px', 
                fontWeight: 'bold',
                color: '#000000',
                textShadow: '2px 2px 4px rgba(255,255,255,0.3)'
              }}>
                懷智運動會計分系統後台
              </h1>
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#000000',
                textShadow: '1px 1px 2px rgba(255,255,255,0.3)'
              }}>
                運動會管理系統
              </p>
            </div>
            <Space style={{ marginTop: 8 }}>
              <Button 
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setAdminProfileVisible(true)}
              >
                管理員資料更改
              </Button>
              <Button 
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                登出
              </Button>
            </Space>
          </div>
        </div>
        
        <div className="tab-container">
          <Tabs 
            activeKey={activeTab} 
            onChange={saveTabState}
            size="large" 
            centered
          >
            <TabPane tab="📝 分數輸入" key="1">
              <ScoreInput 
                participants={participants}
                events={events}
                onScoreAdded={handleScoreAdded}
                loading={loading}
              />
            </TabPane>
            
            <TabPane tab="📊 批量輸入" key="2">
              <BatchScoreInput 
                participants={participants}
                events={events}
                onScoresAdded={handleScoreAdded}
                loading={loading}
              />
            </TabPane>
            
            <TabPane tab="🏆 比賽結果" key="3">
              <Tabs 
                activeKey={activeSubTab['3'] || 'score-edit'} 
                onChange={(key) => saveTabState('3', key)}
                size="large" 
                centered
              >
                <TabPane tab="✏️ 分數修改" key="score-edit">
                  <ScoreEdit />
                </TabPane>
                
                <TabPane tab="⚙️ 比賽狀態" key="status">
                  <CompetitionStatus />
                </TabPane>
                
                
                <TabPane tab="🏅 決賽入圍者" key="final">
                  <FinalResults loading={loading} />
                </TabPane>
                
                <TabPane tab="🏆 最終勝出者" key="winners">
                  <Winners loading={loading} />
                </TabPane>
              </Tabs>
            </TabPane>
            
            <TabPane tab="👥 參賽者管理" key="4">
              <Tabs 
                activeKey={activeSubTab['4'] || 'add'} 
                onChange={(key) => saveTabState('4', key)}
                size="large" 
                centered
              >
                <TabPane tab="📝 手動新增" key="add">
                  <ParticipantAdd 
                    onParticipantAdded={handleParticipantAdded}
                    groups={groups}
                    onGroupUpdated={handleGroupUpdated}
                  />
                </TabPane>
                
                <TabPane tab="✏️ 資料修改" key="edit">
                  <ParticipantEdit
                    participants={participants}
                    loading={loading}
                    groups={groups}
                    onGroupUpdated={handleGroupUpdated}
                  />
                </TabPane>
                
                <TabPane tab="🏷️ 組別管理" key="groups">
                  <ParticipantGroupManagement 
                    onGroupUpdated={handleGroupUpdated}
                  />
                </TabPane>
              </Tabs>
            </TabPane>

            <TabPane tab="🏆 比賽項目管理" key="5">
              <EventManagement 
                groups={groups}
                onGroupUpdated={handleGroupUpdated}
              />
            </TabPane>

            <TabPane tab="👥 記分員管理" key="6">
              <Tabs 
                activeKey={activeSubTab['6'] || 'management'} 
                onChange={(key) => saveTabState('6', key)}
                size="large" 
                centered
              >
                <TabPane tab="👤 記分員管理" key="management">
                  <ScorerManagement />
                </TabPane>
                
                <TabPane tab="📝 分數輸入" key="score-input">
                  <ScorerScoreInput />
                </TabPane>
              </Tabs>
            </TabPane>
            
            <TabPane tab="📊 匯出匯入" key="7">
              <Tabs 
                activeKey={activeSubTab['7'] || 'export'} 
                onChange={(key) => saveTabState('7', key)}
                size="large" 
                centered
              >
                <TabPane tab="📤 資料匯出" key="export">
                  <ExportData />
                </TabPane>
                
                <TabPane tab="📥 資料匯入" key="import">
                  <ImportData />
                </TabPane>
              </Tabs>
            </TabPane>
          </Tabs>
        </div>
      </div>

      {/* 管理員資料更改對話框 */}
      <AdminProfile 
        visible={adminProfileVisible}
        onCancel={() => setAdminProfileVisible(false)}
        onSuccess={() => {
          message.success('管理員資料已更新，請重新登入');
          handleLogout();
        }}
      />
    </div>
  );
}

export default App;
