import React, { useState } from 'react';
import { Card, Button, message, Upload, Typography, Divider, Alert, Space, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const ImportData = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});

  const handleImport = async (type, file) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      let url;
      switch (type) {
        case 'participants':
          url = '/api/import/participants';
          break;
        case 'scores':
          url = '/api/import/scores';
          break;
        case 'backup':
          url = '/api/import/backup';
          break;
        default:
          throw new Error('未知的匯入類型');
      }

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success(response.data.message || '匯入成功！');
    } catch (error) {
      console.error('匯入失敗:', error);
      message.error('匯入失敗: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDownloadTemplate = async (type) => {
    try {
      let url, filename;
      switch (type) {
        case 'participants':
          url = '/api/download/template/participants';
          filename = 'participant_template.csv';
          break;
        case 'scores':
          url = '/api/download/template/scores';
          filename = 'scores_template.csv';
          break;
        case 'backup':
          url = '/api/download/template/backup';
          filename = 'backup_template.csv';
          break;
        default:
          throw new Error('未知的範本類型');
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

      message.success(`${filename} 下載成功！`);
    } catch (error) {
      console.error('下載範本失敗:', error);
      message.error('下載範本失敗: ' + (error.response?.data?.message || error.message));
    }
  };

  const uploadProps = (type) => ({
    name: 'file',
    multiple: false,
    accept: '.csv,.xlsx,.xls',
    beforeUpload: (file) => {
      handleImport(type, file);
      return false; // 阻止自動上傳
    },
    showUploadList: false,
  });

  return (
    <div className="import-data-container">
      <Card className="import-card">
        <div className="import-header">
          <Title level={2} className="import-title">
            資料匯入
          </Title>
          <Text type="secondary" className="import-subtitle">選擇要匯入的資料類型，支援 CSV 和 Excel 格式</Text>
        </div>

        <Row gutter={[24, 24]} className="import-cards-row">
          <Col xs={24} lg={8}>
            <Card 
              hoverable
              className="import-type-card"
            >
              <div className="import-card-content">
                <Title level={4} className="import-card-title">參賽者資料匯入</Title>
                <Text type="secondary" className="import-card-description">
                  匯入參賽者基本資料
                </Text>
                
                <Dragger {...uploadProps('participants')} className="import-dragger">
                  <p className="ant-upload-text">點擊或拖拽檔案到此區域上傳</p>
                  <p className="ant-upload-hint">
                    支援 CSV、Excel 格式
                  </p>
                </Dragger>
                
                <Button
                  type="link"
                  size="small"
                  className="template-download-btn"
                  onClick={() => handleDownloadTemplate('participants')}
                >
                  下載範本檔案
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              hoverable
              className="import-type-card"
            >
              <div className="import-card-content">
                <Title level={4} className="import-card-title">分數資料匯入</Title>
                <Text type="secondary" className="import-card-description">
                  匯入比賽分數記錄
                </Text>
                
                <Dragger {...uploadProps('scores')} className="import-dragger">
                  <p className="ant-upload-text">點擊或拖拽檔案到此區域上傳</p>
                  <p className="ant-upload-hint">
                    支援 CSV、Excel 格式
                  </p>
                </Dragger>
                
                <Button
                  type="link"
                  size="small"
                  className="template-download-btn"
                  onClick={() => handleDownloadTemplate('scores')}
                >
                  下載範本檔案
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              hoverable
              className="import-type-card"
            >
              <div className="import-card-content">
                <Title level={4} className="import-card-title">完整備份匯入</Title>
                <Text type="secondary" className="import-card-description">
                  匯入完整資料備份
                </Text>
                
                <Dragger {...uploadProps('backup')} className="import-dragger">
                  <p className="ant-upload-text">點擊或拖拽檔案到此區域上傳</p>
                  <p className="ant-upload-hint">
                    支援完整備份檔案
                  </p>
                </Dragger>
                
                <Button
                  type="link"
                  size="small"
                  className="template-download-btn"
                  onClick={() => handleDownloadTemplate('backup')}
                >
                  下載範本檔案
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        <Alert
          message="匯入注意事項"
          description={
            <div>
              <p>• 請確保檔案格式正確，建議先下載範本檔案</p>
              <p>• 匯入前請先備份現有資料</p>
              <p>• 支援的檔案格式：CSV、Excel (.xlsx, .xls)</p>
              <p>• 匯入過程中請勿關閉頁面</p>
              <p>• 匯入操作將覆蓋現有資料，請謹慎操作</p>
            </div>
          }
          type="warning"
          className="import-alert"
        />

      </Card>
    </div>
  );
};

export default ImportData;
