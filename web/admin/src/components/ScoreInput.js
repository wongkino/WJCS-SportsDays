import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, message, Row, Col, Steps, Modal, Typography, Space, Tag } from 'antd';
import { SaveOutlined, TrophyOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Text, Title } = Typography;
const { Step } = Steps;

const ScoreInput = ({ participants, events, onScoreAdded, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [scoreValue, setScoreValue] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 重置所有選擇
  const resetAllSelections = () => {
    setSelectedEvent(null);
    setSelectedGender(null);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue('');
    setCurrentStep(0);
    form.resetFields();
  };

  // 處理比賽項目選擇
  const handleEventChange = (eventId) => {
    const event = events.find(e => e.id === parseInt(eventId));
    setSelectedEvent(event);
    setSelectedGender(null);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue('');
    setCurrentStep(1);
  };

  // 處理性別選擇
  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue('');
    setCurrentStep(2);
  };

  // 處理參賽者選擇
  const handleParticipantChange = (participantId) => {
    const participant = participants.find(p => p.id === parseInt(participantId));
    setSelectedParticipant(participant);
    setSelectedRound(null);
    setScoreValue('');
    setCurrentStep(3);
  };

  // 處理輪次選擇
  const handleRoundChange = (round) => {
    setSelectedRound(round);
    setScoreValue('');
    setCurrentStep(4);
  };

  // 處理分數輸入
  const handleScoreChange = (e) => {
    setScoreValue(e.target.value);
  };

  // 顯示預覽
  const showPreview = () => {
    if (!scoreValue || isNaN(parseFloat(scoreValue))) {
      message.error('請輸入有效的分數');
      return;
    }
    setPreviewVisible(true);
  };

  // 確認提交
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const submitData = {
        participant_id: selectedParticipant.id,
        event_id: selectedEvent.id,
        score: parseFloat(scoreValue),
        round: Number(selectedRound)
      };
      
      await axios.post('/api/scores', submitData);
      message.success('分數記錄成功');
      onScoreAdded();
      setPreviewVisible(false);
      resetAllSelections();
    } catch (error) {
      message.error('分數記錄失敗: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 根據選中的比賽項目和性別過濾參賽者
  const getFilteredParticipants = () => {
    if (!selectedEvent || !selectedGender || !Array.isArray(participants)) return [];
    
    // 先過濾掉空值
    const validParticipants = participants.filter(p => p && p.id);
    
    // 過濾性別
    let filtered = validParticipants.filter(p => p.gender === selectedGender);
    
    if (selectedEvent.type === '團體') {
      // 團體項目只顯示有隊伍名稱的參賽者
      filtered = filtered.filter(p => p.team_name);
    }
    
    return filtered;
  };

  const filteredParticipants = getFilteredParticipants();

  // 驗證分數
  const validateScore = (value) => {
    if (!value) return '請輸入分數';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '請輸入有效的數字';
    
    if (selectedEvent?.name === '來回跑') {
      if (numValue <= 0) return '時間必須大於0秒';
      if (numValue > 300) return '時間不能超過300秒';
    } else if (selectedEvent?.name === '立定跳遠') {
      if (numValue <= 0) return '距離必須大於0公分';
      if (numValue > 1000) return '距離不能超過1000公分';
    } else if (selectedEvent?.name === '火箭投擲') {
      if (numValue <= 0) return '距離必須大於0公尺';
      if (numValue > 100) return '距離不能超過100公尺';
    } else if (selectedEvent?.name === '硬地滾球') {
      if (numValue < 0) return '分數不能小於0分';
      if (numValue > 100) return '分數不能超過100分';
    }
    
    return null;
  };

  const scoreError = validateScore(scoreValue);

  return (
    <div>
      <Card title="分數輸入" style={{ marginBottom: 24 }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="選擇比賽項目" />
          <Step title="選擇性別" />
          <Step title="選擇參賽者" />
          <Step title="選擇輪次" />
          <Step title="輸入分數" />
        </Steps>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* 步驟 1: 選擇比賽項目 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>1. 選擇比賽項目</Title>
            <Select 
              placeholder="請選擇比賽項目"
              style={{ width: '100%' }}
              size="large"
              value={selectedEvent?.id}
              onChange={handleEventChange}
              filterOption={(input, option) => {
                const text = option.children;
                if (typeof text === 'string') {
                  return text.toLowerCase().includes(input.toLowerCase());
                }
                // 如果 children 是 React 元素，提取文字內容
                if (Array.isArray(text)) {
                  const textContent = text.filter(item => typeof item === 'string').join('');
                  return textContent.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {events.map(event => (
                <Option key={event.id} value={event.id}>
                  <TrophyOutlined style={{ marginRight: 8 }} />
                  {event.name} ({event.type})
                </Option>
              ))}
            </Select>
          </div>

          {/* 步驟 2: 選擇性別 */}
          {selectedEvent && (
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>2. 選擇性別</Title>
              <Select 
                placeholder="請選擇性別"
                style={{ width: '100%' }}
                size="large"
                value={selectedGender}
                onChange={handleGenderChange}
              >
                <Option value="男">男</Option>
                <Option value="女">女</Option>
              </Select>
            </div>
          )}

          {/* 步驟 3: 選擇參賽者 */}
          {selectedEvent && selectedGender && (
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>3. 選擇參賽者</Title>
              <Select 
                placeholder="請選擇參賽者"
                style={{ width: '100%' }}
                size="large"
                value={selectedParticipant?.id}
                onChange={handleParticipantChange}
                showSearch
                filterOption={(input, option) => {
                  const text = option.children;
                  if (typeof text === 'string') {
                    return text.toLowerCase().includes(input.toLowerCase());
                  }
                  // 如果 children 是 React 元素，提取文字內容
                  if (Array.isArray(text)) {
                    const textContent = text.filter(item => typeof item === 'string').join('');
                    return textContent.toLowerCase().includes(input.toLowerCase());
                  }
                  return false;
                }}
              >
                {filteredParticipants.map(participant => (
                  <Option key={participant.id} value={participant.id}>
                    {participant.team_name && participant.team_name !== participant.name 
                      ? `${participant.team_name} - ${participant.name}` 
                      : participant.name} ({participant.group_type})
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* 步驟 4: 選擇輪次 */}
          {selectedEvent && selectedGender && selectedParticipant && (
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>4. 選擇輪次</Title>
                <Select 
                  placeholder="請選擇輪次"
                  style={{ width: '100%' }}
                  size="large"
                  value={selectedRound}
                  onChange={handleRoundChange}
                >
                  {selectedEvent?.is_final_only ? (
                    // 直接決賽模式：只有決賽選項
                    <Option key={1} value={1}>決賽</Option>
                  ) : (
                    // 初賽+決賽模式：初賽=1，決賽=2
                    <>
                      <Option key={1} value={1}>初賽</Option>
                      <Option key={2} value={2}>決賽</Option>
                    </>
                  )}
                </Select>
            </div>
          )}

          {/* 步驟 5: 輸入分數 */}
          {selectedEvent && selectedGender && selectedParticipant && selectedRound && (
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>5. 輸入分數</Title>
              <Input 
                type="number" 
                step="0.01"
                placeholder="請輸入分數"
                size="large"
                value={scoreValue}
                onChange={handleScoreChange}
                suffix={selectedEvent?.name === '來回跑' ? '秒' : 
                        selectedEvent?.name === '立定跳遠' ? '厘米' :
                        selectedEvent?.name === '火箭投擲' ? '米' :
                        selectedEvent?.name === '硬地滾球' ? 'pts' : ''}
                status={scoreError ? 'error' : ''}
              />
              {scoreError && (
                <Text type="danger" style={{ marginTop: 8, display: 'block' }}>
                  {scoreError}
                </Text>
              )}
            </div>
          )}

          {/* 操作按鈕 */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Space size="large">
              <Button 
                onClick={resetAllSelections}
                size="large"
              >
                重新開始
              </Button>
              {selectedEvent && selectedGender && selectedParticipant && selectedRound && scoreValue && !scoreError && (
                <Button 
                  type="primary"
                  size="large"
                  icon={<EyeOutlined />}
                  onClick={showPreview}
                >
                  預覽分數
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Card>

      {/* 預覽確認 Modal */}
      <Modal
        title="確認分數記錄"
        open={previewVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => setPreviewVisible(false)}
        okText="確認記錄"
        cancelText="取消"
        okButtonProps={{ 
          icon: <CheckOutlined />,
          loading: submitting 
        }}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <Title level={4}>請確認以下分數記錄：</Title>
          <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>比賽項目：</Text>
                <br />
                <Tag color="blue" style={{ marginTop: 4 }}>
                  <TrophyOutlined style={{ marginRight: 4 }} />
                  {selectedEvent?.name} ({selectedEvent?.type})
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>參賽者：</Text>
                <br />
                <Text style={{ marginTop: 4, display: 'block' }}>
                  {selectedParticipant?.team_name && selectedParticipant?.team_name !== selectedParticipant?.name 
                    ? `${selectedParticipant.team_name} - ${selectedParticipant.name}` 
                    : selectedParticipant?.name}
                </Text>
                <Text type="secondary">
                  {selectedParticipant?.group_type} - {selectedParticipant?.gender}
                </Text>
              </Col>
                <Col span={12}>
                  <Text strong>輪次：</Text>
                  <br />
                  <Tag color={selectedRound === 1 ? (selectedEvent?.is_final_only ? 'green' : 'orange') : 'green'} style={{ marginTop: 4 }}>
                    {selectedEvent?.is_final_only ? '決賽' : (selectedRound === 1 ? '初賽' : '決賽')}
                  </Tag>
                </Col>
              <Col span={12}>
                <Text strong>分數：</Text>
                <br />
                <Text style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--accent)',
                  marginTop: 4,
                  display: 'block'
                }}>
                  {scoreValue}
                  {selectedEvent?.name === '來回跑' ? ' 秒' : 
                   selectedEvent?.name === '立定跳遠' ? ' 厘米' :
                   selectedEvent?.name === '火箭投擲' ? ' 米' :
                   selectedEvent?.name === '硬地滾球' ? ' pts' : ''}
                </Text>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScoreInput;
