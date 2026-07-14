import React, { useState } from 'react';
import { Upload, Button, Card, message, Alert, Space, Typography, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const ParticipantImport = ({ onImportSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleUpload = async (options) => {
    const { file } = options;
    
    // 驗證檔案類型
    if (!file.name.endsWith('.csv')) {
      message.error('請選擇 CSV 檔案');
      return;
    }

    setUploading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await axios.post('/api/participants/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
      message.success('CSV 匯入完成！');
      
      // 清空檔案列表
      setFileList([]);
      
      // 通知父組件重新載入參賽者列表
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || '匯入失敗';
      const errorDetails = error.response?.data?.details || [];
      
      setImportResult({
        error: errorMessage,
        details: errorDetails
      });
      
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/participants/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '參賽者匯入範本.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('範本檔案下載完成！');
    } catch (error) {
      message.error('下載範本失敗');
    }
  };


  const uploadProps = {
    name: 'csvFile',
    fileList,
    beforeUpload: (file) => {
      setFileList([file]);
      return false; // 阻止自動上傳
    },
    onRemove: () => {
      setFileList([]);
    },
    accept: '.csv',
    maxCount: 1,
  };

  return (
    <div>
      <Card title="參賽者資料匯入" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 說明資訊 */}
          <Alert
            message="CSV 匯入說明"
            description={
              <div>
                <Paragraph>
                  <Text strong>支援的欄位：</Text>
                </Paragraph>
                <ul>
                  <li><Text code>單位</Text> - 參賽者所屬單位（必填）</li>
                  <li><Text code>姓名</Text> - 參賽者姓名（必填）</li>
                  <li><Text code>性別</Text> - 男 或 女（必填）</li>
                  <li><Text code>組別</Text> - 組別名稱（必填，請使用組別管理中的組別名稱）</li>
                </ul>
                <Paragraph>
                  <Text type="warning">
                    <InfoCircleOutlined /> 注意：系統會自動檢查重複參賽者，相同姓名、組別、性別的參賽者不會重複匯入。
                  </Text>
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />

          {/* 操作按鈕 */}
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
              type="primary"
            >
              下載 CSV 範本
            </Button>
          </Space>

          <Divider />

          {/* 檔案上傳 */}
          <div>
            <Title level={5}>選擇 CSV 檔案</Title>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                選擇檔案
              </Button>
            </Upload>
            
            {fileList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  onClick={() => handleUpload({ file: fileList[0] })}
                  loading={uploading}
                  icon={<UploadOutlined />}
                >
                  開始匯入
                </Button>
              </div>
            )}
          </div>

          {/* 匯入結果 */}
          {importResult && (
            <div>
              <Title level={5}>匯入結果</Title>
              {importResult.error ? (
                <Alert
                  message="匯入失敗"
                  description={
                    <div>
                      <Paragraph>{importResult.error}</Paragraph>
                      {importResult.details && importResult.details.length > 0 && (
                        <div>
                          <Text strong>詳細錯誤：</Text>
                          <ul>
                            {importResult.details.map((detail, index) => (
                              <li key={index}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                  type="error"
                  showIcon
                />
              ) : (
                <Alert
                  message="匯入成功"
                  description={
                    <div>
                      <Paragraph>
                        <Text strong>總計：</Text> {importResult.total} 筆資料
                      </Paragraph>
                      <Paragraph>
                        <Text strong>成功匯入：</Text> {importResult.success} 筆
                      </Paragraph>
                      {importResult.duplicate > 0 && (
                        <Paragraph>
                          <Text strong>重複跳過：</Text> {importResult.duplicate} 筆
                        </Paragraph>
                      )}
                      {importResult.errors > 0 && (
                        <Paragraph>
                          <Text strong>錯誤：</Text> {importResult.errors} 筆
                        </Paragraph>
                      )}
                    </div>
                  }
                  type="success"
                  showIcon
                />
              )}
            </div>
          )}
        </Space>
      </Card>

      {/* CSV 格式範例 */}
      <Card title="CSV 格式範例">
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          <pre style={{ margin: 0, fontFamily: 'monospace' }}>
{`單位,姓名,性別,組別
第一工場,張三,男,工場及社區組
第二工場,李四,女,展能組
第三工場,王五,男,工場及社區組
第四工場,陳六,女,展能組
第一工場,趙七,男,工場及社區組`}
          </pre>
        </div>
        <Paragraph style={{ marginTop: 16 }}>
          <Text type="secondary">
            請確保 CSV 檔案使用 UTF-8 編碼，並包含標題行。第一行必須包含欄位名稱。
          </Text>
        </Paragraph>
      </Card>
    </div>
  );
};

export default ParticipantImport;
