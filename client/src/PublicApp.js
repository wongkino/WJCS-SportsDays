import React from 'react';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import PublicView from './components/PublicView';
import './index.css';

const PublicApp = () => {
  return (
    <ConfigProvider locale={zhTW}>
      <div className="App">
        <PublicView />
      </div>
    </ConfigProvider>
  );
};

export default PublicApp;
