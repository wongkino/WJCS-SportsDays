import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Table, 
  message, 
  Row, 
  Col, 
  Tag,
  Space,
  Divider,
  Alert,
  Spin
} from 'antd';
import { 
  SaveOutlined, 
  SearchOutlined,
  TrophyOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ScorerScoreInput = () => {
  const [form] = Form.useForm();
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [scores, setScores] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchValue, setBatchValue] = useState('');

  useEffect(() => {
    // 載入記分員的負責項目
    loadScorerEvents();
  }, []);

  const loadScorerEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data.filter(event => event.is_active));
    } catch (error) {
      console.error('載入記分員項目失敗:', error);
      message.error('載入比賽項目失敗: ' + error.message);
    }
  };

  const handleEventChange = (eventName) => {
    const event = events.find(e => e.name === eventName);
    setSelectedEvent(eventName);
    setEventDetails(event);
    setParticipants([]);
    setScores({});
    setSelectedRound(event?.default_rounds || 1);
    form.resetFields(['participant_id', 'round']);
    form.setFieldsValue({ round: event?.default_rounds || 1 });
  };

  const handleRoundChange = (round) => {
    setSelectedRound(round);
    setScores({});
    form.setFieldsValue({ round: round });
  };

  const loadParticipants = async () => {
    if (!selectedEvent || !eventDetails) {
      message.warning('請先選擇運動項目');
      return;
    }

    setLoading(true);
    try {
      // 根據比賽項目的組別和性別過濾參賽者
      const response = await axios.get('/api/participants');
      const allParticipants = response.data;
      
      // 過濾符合條件的參賽者
      const eventGroups = eventDetails.group_types.split(',').map(g => g.trim());
      const eventGenders = eventDetails.genders.split(',').map(g => g.trim());
      
      const filteredParticipants = allParticipants.filter(participant => {
        const participantGroup = getGroupDisplayName(participant);
        const groupMatch = eventGroups.includes(participantGroup);
        const genderMatch = eventGenders.includes(participant.gender);
        return groupMatch && genderMatch;
      });
      
      setParticipants(filteredParticipants);
    } catch (error) {
      message.error('載入參賽者資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (participantId, value) => {
    setScores(prev => ({
      ...prev,
      [participantId]: value
    }));
  };

  const handleBatchApply = () => {
    if (!batchValue || isNaN(parseFloat(batchValue))) {
      message.warning('請輸入有效的數值');
      return;
    }

    const newScores = {};
    participants.forEach(participant => {
      newScores[participant.id] = batchValue;
    });
    setScores(newScores);
    message.success(`已為所有 ${participants.length} 位參賽者設置分數: ${batchValue}`);
  };

  const handleClearAll = () => {
    setScores({});
    message.success('已清空所有分數');
  };

  const handleQuickFill = (value) => {
    const newScores = { ...scores };
    participants.forEach(participant => {
      if (!newScores[participant.id]) {
        newScores[participant.id] = value;
      }
    });
    setScores(newScores);
    message.success(`已為空分數的參賽者填充: ${value}`);
  };

  const handleSubmit = async () => {
    if (!selectedEvent) {
      message.warning('請先選擇運動項目');
      return;
    }

    const scoreEntries = Object.entries(scores).filter(([_, score]) => score !== undefined && score !== '');
    
    if (scoreEntries.length === 0) {
      message.warning('請至少輸入一個分數');
      return;
    }

    // 獲取表單中的輪次值
    const formValues = form.getFieldsValue();
    const currentRound = formValues.round || selectedRound;

    setSubmitting(true);
    try {
      const scoreData = scoreEntries.map(([participantId, score]) => ({
        participant_id: parseInt(participantId),
        event_name: selectedEvent,
        round: currentRound,
        score: parseFloat(score)
      }));

      await axios.post('/api/scores/batch', { scores: scoreData });
      message.success(`成功提交 ${scoreEntries.length} 個分數`);
      
      // 清空表單
      setScores({});
      form.resetFields();
    } catch (error) {
      message.error('提交失敗: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getEventUnit = (eventDetails) => {
    return eventDetails?.calculation_unit || '';
  };

  const getGroupDisplayName = (participant) => {
    // 優先使用 group_name，如果為 null 或 undefined，則使用 group_type
    if (participant.group_name && participant.group_name !== 'null') {
      return participant.group_name;
    } else if (participant.group_type && participant.group_type !== 'null') {
      return participant.group_type;
    } else {
      return '未分組';
    }
  };

  const getRoundOptions = () => {
    if (!eventDetails) return [];
    
    const options = [];
    
    if (eventDetails.is_final_only) {
      // 直接決賽模式：只有決賽選項
      options.push({ value: 1, label: '決賽' });
    } else {
      // 初賽+決賽模式：初賽=1，決賽=2
      options.push({ value: 1, label: '初賽' });
      options.push({ value: 2, label: '決賽' });
    }
    
    return options;
  };

  const columns = [
    {
      title: '參賽者',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.team_name} - {getGroupDisplayName(record)} - {record.gender}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '組別',
      dataIndex: 'group_name',
      key: 'group_name',
      render: (text, record) => <Tag color="blue">{getGroupDisplayName(record)}</Tag>,
    },
    {
      title: '性別',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => <Tag color={text === '男' ? 'blue' : 'pink'}>{text}</Tag>,
    },
    {
      title: `分數 (${getEventUnit(eventDetails)})`,
      key: 'score',
      render: (_, record) => (
        <Input
          type="number"
          step="0.01"
          placeholder={`輸入${getEventUnit(eventDetails)}`}
          value={scores[record.id] || ''}
          onChange={(e) => handleScoreChange(record.id, e.target.value)}
          style={{ width: 120 }}
          suffix={getEventUnit(eventDetails)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <h2 style={{ margin: 0 }}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              記分員分數輸入
            </h2>
          </Col>
        </Row>

        <Alert
          message="記分員操作說明"
          description="請選擇運動項目和輪次，然後載入參賽者列表進行分數輸入。系統會根據比賽項目的組別和性別自動過濾參賽者。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item
            name="event"
            label="運動項目"
            rules={[{ required: true, message: '請選擇運動項目' }]}
          >
            <Select
              placeholder="選擇運動項目"
              style={{ width: 200 }}
              onChange={handleEventChange}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {events.map(event => (
                <Option key={event.id} value={event.name}>
                  {event.name} ({event.type})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="round"
            label="輪次"
            initialValue={1}
          >
            <Select
              style={{ width: 120 }}
              onChange={handleRoundChange}
              disabled={!eventDetails}
            >
              {getRoundOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={loadParticipants}
              loading={loading}
              disabled={!eventDetails}
            >
              載入參賽者
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        {participants.length > 0 && (
          <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <h3>
                  {selectedEvent} - {getRoundOptions().find(opt => opt.value === selectedRound)?.label || '第' + selectedRound + '輪'} 
                  ({participants.length} 位參賽者)
                  {eventDetails && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {eventDetails.group_types} - {eventDetails.genders}
                    </Tag>
                  )}
                </h3>
              </Col>
              <Col>
                <Space>
                  <Button
                    type={!batchMode ? "primary" : "default"}
                    onClick={() => setBatchMode(false)}
                    size="large"
                  >
                    單個輸入
                  </Button>
                  <Button
                    type={batchMode ? "primary" : "default"}
                    onClick={() => setBatchMode(true)}
                    size="large"
                  >
                    批量輸入
                  </Button>
                </Space>
              </Col>
            </Row>

            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    size="large"
                  >
                    提交分數
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    size="large"
                  >
                    清空所有
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* 批量操作工具欄 */}
            {batchMode && (
              <Row gutter={16} style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                <Col>
                  <Space>
                    <span style={{ fontWeight: 'bold' }}>批量操作：</span>
                    <Input
                      placeholder="輸入統一分數"
                      value={batchValue}
                      onChange={(e) => setBatchValue(e.target.value)}
                      style={{ width: 120 }}
                      suffix={getEventUnit(eventDetails)}
                    />
                    <Button onClick={handleBatchApply} type="primary" size="small">
                      應用到全部
                    </Button>
                    <Button onClick={() => handleQuickFill('0')} size="small">
                      填充 0
                    </Button>
                    <Button onClick={() => handleQuickFill('1')} size="small">
                      填充 1
                    </Button>
                    <Button onClick={() => handleQuickFill('10')} size="small">
                      填充 10
                    </Button>
                  </Space>
                </Col>
              </Row>
            )}

            {/* 單個輸入模式提示 */}
            {!batchMode && (
              <Alert
                message="單個輸入模式"
                description="請在下方表格中為每位參賽者個別輸入分數。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              columns={columns}
              dataSource={participants}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 位參賽者`,
              }}
              scroll={{ x: 600 }}
            />
          </div>
        )}

        {participants.length === 0 && selectedEvent && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#666', fontSize: '16px' }}>
              請點擊「載入參賽者」按鈕來載入 {selectedEvent} 的參賽者列表
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ScorerScoreInput;
