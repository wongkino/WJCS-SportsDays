import React, { useState, useEffect } from 'react';
import ScorerLogin from './components/ScorerLogin';
import ScorerDashboard from './components/ScorerDashboard';

const ScorerApp = () => {
  const [scorer, setScorer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查本地存儲中是否有記分員信息
    const savedScorer = localStorage.getItem('scorerInfo');
    if (savedScorer) {
      try {
        const scorerData = JSON.parse(savedScorer);
        setScorer(scorerData);
      } catch (error) {
        console.error('解析記分員信息失敗:', error);
        localStorage.removeItem('scorerInfo');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (scorerData) => {
    setScorer(scorerData);
  };

  const handleLogout = () => {
    setScorer(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>載入中...</div>
      </div>
    );
  }

  return (
    <div>
      {scorer ? (
        <ScorerDashboard 
          scorer={scorer} 
          onLogout={handleLogout}
        />
      ) : (
        <ScorerLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default ScorerApp;
