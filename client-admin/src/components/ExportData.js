import React, { useState } from 'react';
import { Card, Button, message, Space, Typography, Divider, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const ExportData = () => {
  const [loading, setLoading] = useState({});

  const handleExport = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      let url, filename;
      
      switch (type) {
        case 'participants':
          url = '/api/export/participants';
          filename = '參賽者資料.csv';
          break;
        case 'scores':
          url = '/api/export/scores';
          filename = '分數資料.csv';
          break;
        case 'results':
          url = '/api/export/results';
          filename = '比賽結果.csv';
          break;
        case 'all':
          url = '/api/export/all';
          filename = '完整資料.csv';
          break;
        default:
          throw new Error('未知的匯出類型');
      }

      const response = await axios.get(url, {
        responseType: 'blob',
      });

      // 創建下載連結
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url_blob = window.URL.createObjectURL(blob);
      link.setAttribute('href', url_blob);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);

      message.success(`${filename} 匯出成功！`);
    } catch (error) {
      console.error('匯出失敗:', error);
      message.error('匯出失敗: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="export-data-container">
      <Card className="export-card">
        <div className="export-header">
          <Title level={2} className="export-title">
            資料匯出
          </Title>
          <Text type="secondary" className="export-subtitle">選擇要匯出的資料類型，系統將生成 CSV 格式檔案</Text>
        </div>

        <Row gutter={[24, 24]} className="export-cards-row">
          <Col xs={24} lg={6}>
            <Card 
              hoverable
              className="export-type-card"
            >
              <div className="export-card-content">
                <Title level={4} className="export-card-title">參賽者資料</Title>
                <Text type="secondary" className="export-card-description">
                  匯出所有參賽者的基本資料
                </Text>
                
                <Button
                  type="primary"
                  className="export-btn"
                  loading={loading.participants}
                  onClick={() => handleExport('participants')}
                  block
                >
                  匯出參賽者資料
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card 
              hoverable
              className="export-type-card"
            >
              <div className="export-card-content">
                <Title level={4} className="export-card-title">分數資料</Title>
                <Text type="secondary" className="export-card-description">
                  匯出所有比賽的分數記錄
                </Text>
                
                <Button
                  type="primary"
                  className="export-btn"
                  loading={loading.scores}
                  onClick={() => handleExport('scores')}
                  block
                >
                  匯出分數資料
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card 
              hoverable
              className="export-type-card"
            >
              <div className="export-card-content">
                <Title level={4} className="export-card-title">比賽結果</Title>
                <Text type="secondary" className="export-card-description">
                  匯出初賽、決賽排名結果
                </Text>
                
                <Button
                  type="primary"
                  className="export-btn"
                  loading={loading.results}
                  onClick={() => handleExport('results')}
                  block
                >
                  匯出比賽結果
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card 
              hoverable
              className="export-type-card"
            >
              <div className="export-card-content">
                <Title level={4} className="export-card-title">完整資料</Title>
                <Text type="secondary" className="export-card-description">
                  匯出所有資料的完整備份
                </Text>
                
                <Button
                  type="primary"
                  className="export-btn"
                  loading={loading.all}
                  onClick={() => handleExport('all')}
                  block
                >
                  匯出完整資料
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="export-footer">
          <Text type="secondary" className="export-tip">
            💡 提示：匯出的檔案為 CSV 格式，可用 Excel 或其他試算表軟體開啟
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ExportData;
