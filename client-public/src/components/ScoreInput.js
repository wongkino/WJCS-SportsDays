import React, { useState } from 'react';
import { Form, InputNumber, Button, Card, message, Row, Col, Steps, Modal, Typography, Space, Tag, Radio, List, Avatar } from 'antd';
import { SaveOutlined, TrophyOutlined, EyeOutlined, CheckOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { Step } = Steps;

const ScoreInput = ({ participants, events, onScoreAdded, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [scoreValue, setScoreValue] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 重置所有選擇
  const resetAllSelections = () => {
    setSelectedEvent(null);
    setSelectedGender(null);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue(null);
    setCurrentStep(0);
    form.resetFields();
  };

  // 處理比賽項目選擇
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const event = events.find(e => e.id === parseInt(eventId));
    setSelectedEvent(event);
    setSelectedGender(null);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue(null);
    setCurrentStep(1);
  };

  // 處理性別選擇
  const handleGenderChange = (e) => {
    const gender = e.target.value;
    setSelectedGender(gender);
    setSelectedParticipant(null);
    setSelectedRound(null);
    setScoreValue(null);
    setCurrentStep(2);
  };

  // 處理參賽者選擇
  const handleParticipantChange = (e) => {
    const participantId = e.target.value;
    const participant = participants.find(p => p.id === parseInt(participantId));
    setSelectedParticipant(participant);
    setSelectedRound(null);
    setScoreValue(null);
    setCurrentStep(3);
  };

  // 處理輪次選擇
  const handleRoundChange = (e) => {
    const round = e.target.value;
    setSelectedRound(round);
    setScoreValue(null);
    setCurrentStep(4);
  };

  // 處理分數輸入
  const handleScoreChange = (value) => {
    setScoreValue(value);
  };

  // 顯示預覽
  const showPreview = () => {
    if (!scoreValue || scoreValue === null) {
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
        score: scoreValue,
        round: selectedRound
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

  // 獲取分數輸入配置
  const getScoreConfig = () => {
    if (!selectedEvent) return { min: 0, max: 100, step: 0.01, suffix: 'pts' };
    
    switch (selectedEvent.name) {
      case '來回跑':
        return { min: 0.01, max: 300, step: 0.01, suffix: '秒' };
      case '立定跳遠':
        return { min: 0.01, max: 1000, step: 0.01, suffix: '厘米' };
      case '火箭投擲':
        return { min: 0.01, max: 100, step: 0.01, suffix: '米' };
      case '硬地滾球':
        return { min: 0, max: 100, step: 0.01, suffix: 'pts' };
      default:
        return { min: 0, max: 100, step: 0.01, suffix: 'pts' };
    }
  };

  const scoreConfig = getScoreConfig();

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

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* 步驟 1: 選擇比賽項目 */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4}>1. 選擇比賽項目</Title>
            <Radio.Group 
              value={selectedEvent?.id} 
              onChange={handleEventChange}
              style={{ width: '100%' }}
            >
              <List
                dataSource={events}
                renderItem={event => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <Radio value={event.id} style={{ width: '100%' }}>
                      <Space>
                        <Avatar 
                          icon={event.type === '團體' ? <TeamOutlined /> : <UserOutlined />} 
                          style={{ backgroundColor: event.type === '團體' ? '#52c41a' : '#1890ff' }}
                        />
                        <div>
                          <Text strong>{event.name}</Text>
                          <br />
                          <Text type="secondary">({event.type})</Text>
                        </div>
                      </Space>
                    </Radio>
                  </List.Item>
                )}
              />
            </Radio.Group>
          </div>

          {/* 步驟 2: 選擇性別 */}
          {selectedEvent && (
            <div style={{ marginBottom: 32 }}>
              <Title level={4}>2. 選擇性別</Title>
              <Radio.Group 
                value={selectedGender} 
                onChange={handleGenderChange}
                style={{ width: '100%' }}
              >
                <List
                  dataSource={[
                    { value: '男', label: '男', icon: '👨' },
                    { value: '女', label: '女', icon: '👩' }
                  ]}
                  renderItem={item => (
                    <List.Item style={{ padding: '12px 0' }}>
                      <Radio value={item.value} style={{ width: '100%' }}>
                        <Space>
                          <Text style={{ fontSize: '20px' }}>{item.icon}</Text>
                          <Text strong>{item.label}</Text>
                        </Space>
                      </Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
            </div>
          )}

          {/* 步驟 3: 選擇參賽者 */}
          {selectedEvent && selectedGender && (
            <div style={{ marginBottom: 32 }}>
              <Title level={4}>3. 選擇參賽者</Title>
              <Radio.Group 
                value={selectedParticipant?.id} 
                onChange={handleParticipantChange}
                style={{ width: '100%' }}
              >
                <List
                  dataSource={filteredParticipants}
                  renderItem={participant => (
                    <List.Item style={{ padding: '12px 0' }}>
                      <Radio value={participant.id} style={{ width: '100%' }}>
                        <Space>
                          <Avatar 
                            icon={<UserOutlined />} 
                            style={{ backgroundColor: participant.gender === '男' ? '#1890ff' : '#eb2f96' }}
                          />
                          <div>
                            <Text strong>
                              {participant.team_name && participant.team_name !== participant.name 
                                ? `${participant.team_name} - ${participant.name}` 
                                : participant.name}
                            </Text>
                            <br />
                            <Text type="secondary">
                              {participant.group_type} - {participant.gender}
                            </Text>
                          </div>
                        </Space>
                      </Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
            </div>
          )}

          {/* 步驟 4: 選擇輪次 */}
          {selectedEvent && selectedGender && selectedParticipant && (
            <div style={{ marginBottom: 32 }}>
              <Title level={4}>4. 選擇輪次</Title>
              <Radio.Group 
                value={selectedRound} 
                onChange={handleRoundChange}
                style={{ width: '100%' }}
              >
                <List
                  dataSource={selectedEvent?.name === '火箭投擲' ? [
                    { value: 2, label: '決賽', icon: '🏆', color: '#52c41a' }
                  ] : [
                    { value: 1, label: '初賽', icon: '🥉', color: '#fa8c16' },
                    { value: 2, label: '決賽', icon: '🏆', color: '#52c41a' }
                  ]}
                  renderItem={item => (
                    <List.Item style={{ padding: '12px 0' }}>
                      <Radio value={item.value} style={{ width: '100%' }}>
                        <Space>
                          <Text style={{ fontSize: '20px' }}>{item.icon}</Text>
                          <Text strong>{item.label}</Text>
                        </Space>
                      </Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
            </div>
          )}

          {/* 步驟 5: 輸入分數 */}
          {selectedEvent && selectedGender && selectedParticipant && selectedRound && (
            <div style={{ marginBottom: 32 }}>
              <Title level={4}>5. 輸入分數</Title>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <InputNumber
                  size="large"
                  placeholder="請輸入分數"
                  value={scoreValue}
                  onChange={handleScoreChange}
                  min={scoreConfig.min}
                  max={scoreConfig.max}
                  step={scoreConfig.step}
                  style={{ width: 200, fontSize: '18px' }}
                  addonAfter={scoreConfig.suffix}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    範圍: {scoreConfig.min} - {scoreConfig.max} {scoreConfig.suffix}
                  </Text>
                </div>
              </div>
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
              {selectedEvent && selectedGender && selectedParticipant && selectedRound && scoreValue !== null && (
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
        title={
          <Space>
            <EyeOutlined />
            <span>確認分數記錄</span>
          </Space>
        }
        open={previewVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => setPreviewVisible(false)}
        okText="確認記錄"
        cancelText="取消"
        okButtonProps={{ 
          icon: <CheckOutlined />,
          loading: submitting,
          size: 'large'
        }}
        cancelButtonProps={{ size: 'large' }}
        width={700}
      >
        <div style={{ padding: '20px 0' }}>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
            請確認以下分數記錄
          </Title>
          
          <List
            dataSource={[
              {
                title: '比賽項目',
                content: (
                  <Space>
                    <Avatar 
                      icon={selectedEvent?.type === '團體' ? <TeamOutlined /> : <UserOutlined />} 
                      style={{ backgroundColor: selectedEvent?.type === '團體' ? '#52c41a' : '#1890ff' }}
                    />
                    <Text strong>{selectedEvent?.name}</Text>
                    <Tag color={selectedEvent?.type === '團體' ? 'green' : 'blue'}>
                      {selectedEvent?.type}
                    </Tag>
                  </Space>
                )
              },
              {
                title: '參賽者',
                content: (
                  <Space>
                    <Avatar 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: selectedParticipant?.gender === '男' ? '#1890ff' : '#eb2f96' }}
                    />
                    <div>
                      <Text strong style={{ display: 'block' }}>
                        {selectedParticipant?.team_name && selectedParticipant?.team_name !== selectedParticipant?.name 
                          ? `${selectedParticipant.team_name} - ${selectedParticipant.name}` 
                          : selectedParticipant?.name}
                      </Text>
                      <Text type="secondary">
                        {selectedParticipant?.group_type} - {selectedParticipant?.gender}
                      </Text>
                    </div>
                  </Space>
                )
              },
              {
                title: '輪次',
                content: (
                  <Space>
                    <Text style={{ fontSize: '20px' }}>
                      {selectedRound === 1 ? '🥉' : '🏆'}
                    </Text>
                    <Tag color={selectedRound === 1 ? 'orange' : 'green'} style={{ fontSize: '14px' }}>
                      {selectedRound === 1 ? '初賽' : '決賽'}
                    </Tag>
                  </Space>
                )
              },
              {
                title: '分數',
                content: (
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#1890ff',
                      display: 'block'
                    }}>
                      {scoreValue} {scoreConfig.suffix}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      範圍: {scoreConfig.min} - {scoreConfig.max} {scoreConfig.suffix}
                    </Text>
                  </div>
                )
              }
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={<Text strong>{item.title}</Text>}
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ScoreInput;