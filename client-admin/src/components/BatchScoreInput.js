import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Tag, Upload, Select, Row, Col, Typography, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title, Text } = Typography;

const BatchScoreInput = ({ participants, events, onScoresAdded, loading }) => {
  const [batchScores, setBatchScores] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 過濾參賽者
  const filteredParticipants = participants.filter(p => {
    if (!selectedGender) return false;
    return p.gender === selectedGender;
  });

  // 添加分數記錄
  const addScoreRecord = () => {
    if (!selectedEvent || !selectedGender || !selectedRound) {
      message.warning('請先選擇比賽項目、性別和輪次');
      return;
    }
    
    const newRecord = {
      id: Date.now(), // 臨時ID
      participant_id: null,
      event_id: selectedEvent.id,
      event_name: selectedEvent.name,
      gender: selectedGender,
      round: selectedRound,
      score: '',
      participant_name: '',
      team_name: '',
      group_type: ''
    };
    
    setBatchScores([...batchScores, newRecord]);
  };

  // 更新分數記錄
  const updateScoreRecord = (id, field, value) => {
    setBatchScores(prevScores => 
      prevScores.map(record => 
        record.id === id ? { ...record, [field]: value } : record
      )
    );
  };

  // 刪除分數記錄
  const removeScoreRecord = (id) => {
    setBatchScores(batchScores.filter(record => record.id !== id));
  };

  // 驗證分數
  const validateScore = (score, eventName) => {
    const num = parseFloat(score);
    if (isNaN(num) || num < 0) {
      return '分數必須是大於等於0的數字';
    }
    
    if (eventName === '來回跑' && num > 300) {
      return '來回跑分數不應超過300秒';
    }
    
    return null;
  };

  // 預覽批量輸入
  const showPreview = () => {
    const validRecords = batchScores.filter(record => 
      record.participant_id && record.score && 
      !validateScore(record.score, record.event_name)
    );
    
    if (validRecords.length === 0) {
      message.warning('沒有有效的分數記錄可以提交');
      return;
    }
    
    setPreviewVisible(true);
  };

  // 提交批量分數
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const validRecords = batchScores.filter(record => 
        record.participant_id && record.score && 
        !validateScore(record.score, record.event_name)
      );

      const promises = validRecords.map(record => 
        axios.post('/api/scores', {
          participant_id: record.participant_id,
          event_id: record.event_id,
          score: parseFloat(record.score),
          round: record.round
        })
      );

      await Promise.all(promises);
      
      message.success(`成功提交 ${validRecords.length} 筆分數記錄`);
      setBatchScores([]);
      setPreviewVisible(false);
      onScoresAdded();
    } catch (error) {
      message.error('批量提交失敗: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 清空所有記錄
  const clearAll = () => {
    setBatchScores([]);
    setSelectedEvent(null);
    setSelectedGender(null);
    setSelectedRound(null);
  };

  // 表格列定義
  const columns = [
    {
      title: '參賽者',
      dataIndex: 'participant_id',
      key: 'participant_id',
      width: 200,
      render: (participantId, record) => (
        <Select
          placeholder="選擇參賽者"
          style={{ width: '100%' }}
          value={participantId}
          onChange={(value) => {
            const participant = participants.find(p => p.id === value);
            if (participant) {
              setBatchScores(prevScores => 
                prevScores.map(r => 
                  r.id === record.id ? { 
                    ...r, 
                    participant_id: value,
                    participant_name: participant.name,
                    team_name: participant.team_name || '',
                    group_type: participant.group_type
                  } : r
                )
              );
            }
          }}
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
      ),
    },
    {
      title: '分數',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score, record) => (
        <Input
          type="number"
          step="0.01"
          placeholder="輸入分數"
          value={score}
          onChange={(e) => updateScoreRecord(record.id, 'score', e.target.value)}
          status={validateScore(score, record.event_name) ? 'error' : ''}
          suffix={record.event_name === '來回跑' ? '秒' : 
                  record.event_name === '立定跳遠' ? '厘米' :
                  record.event_name === '火箭投擲' ? '米' :
                  record.event_name === '硬地滾球' ? 'pts' : ''}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => removeScoreRecord(record.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card title="批量分數輸入" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Text strong>比賽項目：</Text>
            <Select 
              placeholder="選擇比賽項目"
              style={{ width: '100%', marginTop: 8 }}
              value={selectedEvent?.id}
              onChange={(value) => {
                const event = events.find(e => e.id === value);
                setSelectedEvent(event);
                setSelectedGender(null);
                setSelectedRound(null);
                setBatchScores([]);
              }}
            >
              {events.map(event => (
                <Option key={event.id} value={event.id}>
                  {event.name} ({event.type})
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col span={6}>
            <Text strong>性別：</Text>
            <Select 
              placeholder="選擇性別"
              style={{ width: '100%', marginTop: 8 }}
              value={selectedGender}
              onChange={(value) => {
                setSelectedGender(value);
                setSelectedRound(null);
                setBatchScores([]);
              }}
              disabled={!selectedEvent}
            >
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Col>
          
          <Col span={6}>
            <Text strong>輪次：</Text>
            <Select 
              placeholder="選擇輪次"
              style={{ width: '100%', marginTop: 8 }}
              value={selectedRound}
              onChange={(value) => {
                setSelectedRound(value);
                setBatchScores([]);
              }}
              disabled={!selectedGender}
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
          </Col>
          
          <Col span={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addScoreRecord}
              disabled={!selectedRound}
              style={{ marginTop: 32 }}
            >
              添加記錄
            </Button>
          </Col>
        </Row>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={showPreview}
              disabled={batchScores.length === 0}
            >
              預覽提交 ({batchScores.length} 筆)
            </Button>
            <Button onClick={clearAll} disabled={batchScores.length === 0}>
              清空所有
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={batchScores}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
        />
      </Card>

      {/* 預覽確認 Modal */}
      <Modal
        title="確認批量提交"
        open={previewVisible}
        onOk={handleSubmit}
        onCancel={() => setPreviewVisible(false)}
        okText="確認提交"
        cancelText="取消"
        okButtonProps={{ 
          icon: <SaveOutlined />,
          loading: submitting 
        }}
        width={800}
      >
        <div style={{ padding: '20px 0' }}>
          <Title level={4}>即將提交以下分數記錄：</Title>
          <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>比賽項目：{selectedEvent?.name} | 性別：{selectedGender} | 輪次：{
                  selectedEvent?.is_final_only ? (
                    selectedRound === 1 ? '決賽' : 
                    selectedRound === 2 ? '決賽2' : 
                    selectedRound === 3 ? '決賽3' : '決賽4'
                  ) : (
                    selectedRound === 1 ? '初賽' : 
                    selectedRound === 2 ? '決賽' : 
                    selectedRound === 3 ? '第三輪' : '第四輪'
                  )
                }</Text>
              </Col>
            </Row>
            <Divider />
            {batchScores.filter(record => 
              record.participant_id && record.score && 
              !validateScore(record.score, record.event_name)
            ).map((record, index) => (
              <Row key={record.id} gutter={[16, 8]} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <Text>{index + 1}. {record.participant_name}</Text>
                  {record.team_name && record.team_name !== record.participant_name && (
                    <Text type="secondary"> ({record.team_name})</Text>
                  )}
                </Col>
                <Col span={6}>
                  <Text strong>{record.score}</Text>
                  <Text type="secondary">
                    {record.event_name === '來回跑' ? '秒' : 
                     record.event_name === '立定跳遠' ? '厘米' :
                     record.event_name === '火箭投擲' ? '米' :
                     record.event_name === '硬地滾球' ? 'pts' : ''}
                  </Text>
                </Col>
                <Col span={6}>
                  <Tag color="green">{record.group_type}</Tag>
                </Col>
              </Row>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchScoreInput;
