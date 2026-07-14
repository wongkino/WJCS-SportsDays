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
  Spin,
  Typography,
  Layout,
  Menu,
  Dropdown
} from 'antd';
import { 
  SaveOutlined, 
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title, Text } = Typography;
const { Header, Content } = Layout;

const ScorerDashboard = ({ scorer, onLogout }) => {
  const [form] = Form.useForm();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [scores, setScores] = useState({});
  const [submittedScores, setSubmittedScores] = useState(new Set());

  useEffect(() => {
    // 載入記分員的負責項目
    if (scorer && scorer.assigned_events) {
      console.log('記分員負責的項目:', scorer.assigned_events);
    }
  }, [scorer]);

  const handleEventChange = (eventName) => {
    setSelectedEvent(eventName);
    setParticipants([]);
    setScores({});
    setSubmittedScores(new Set());
    form.resetFields(['participant_id']);
  };

  const handleRoundChange = (round) => {
    setSelectedRound(round);
    setScores({});
    setSubmittedScores(new Set());
  };

  const loadParticipants = async () => {
    if (!selectedEvent) {
      message.warning('請先選擇運動項目');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/participants?event=${selectedEvent}`);
      setParticipants(response.data);
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

    setSubmitting(true);
    try {
      const scoreData = scoreEntries.map(([participantId, score]) => ({
        participant_id: parseInt(participantId),
        event_name: selectedEvent,
        round: selectedRound,
        score: parseFloat(score)
      }));

      await axios.post('/api/scores/batch', { scores: scoreData });
      message.success(`成功提交 ${scoreEntries.length} 個分數`);
      
      // 標記已提交的分數
      scoreEntries.forEach(([participantId]) => {
        setSubmittedScores(prev => new Set([...prev, participantId]));
      });
      
      // 清空已提交的分數
      const newScores = { ...scores };
      scoreEntries.forEach(([participantId]) => {
        delete newScores[participantId];
      });
      setScores(newScores);
      
    } catch (error) {
      message.error('提交失敗: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getEventUnit = (eventName) => {
    switch (eventName) {
      case '來回跑': return '秒';
      case '立定跳遠': return '厘米';
      case '火箭投擲': return '米';
      case '硬地滾球': return 'pts';
      default: return '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scorerInfo');
    onLogout();
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        登出
      </Menu.Item>
    </Menu>
  );

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
              {record.team_name} - {record.group_type} - {record.gender}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '組別',
      dataIndex: 'group_type',
      key: 'group_type',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '性別',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => <Tag color={text === '男' ? 'blue' : 'pink'}>{text}</Tag>,
    },
    {
      title: `分數 (${getEventUnit(selectedEvent)})`,
      key: 'score',
      render: (_, record) => {
        const isSubmitted = submittedScores.has(record.id);
        return (
          <div>
            <Input
              type="number"
              step="0.01"
              placeholder="輸入分數"
              value={scores[record.id] || ''}
              onChange={(e) => handleScoreChange(record.id, e.target.value)}
              style={{ width: 120 }}
              disabled={isSubmitted}
            />
            {isSubmitted && (
              <div style={{ marginTop: 4 }}>
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  已提交
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: 12 }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            記分員系統
          </Title>
        </div>
        
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {scorer?.name} ({scorer?.username})
          </Button>
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Card>
          <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <TrophyOutlined style={{ marginRight: 8 }} />
                分數輸入
              </Title>
            </Col>
          </Row>

          <Alert
            message="記分員操作說明"
            description={
              <div>
                <p>歡迎，{scorer?.name}！您負責的項目：{scorer?.assigned_events?.join('、')}</p>
                <p>請選擇運動項目和輪次，然後載入參賽者列表進行分數輸入。</p>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
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
                style={{ width: 150 }}
                onChange={handleEventChange}
                disabled={!scorer?.assigned_events?.length}
              >
                {scorer?.assigned_events?.map(event => (
                  <Option key={event} value={event}>{event}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="round"
              label="輪次"
              initialValue={1}
            >
              <Select
                style={{ width: 100 }}
                onChange={handleRoundChange}
              >
                <Option value={1}>初賽</Option>
                <Option value={2}>決賽</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={loadParticipants}
                loading={loading}
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
                  <Title level={3}>
                    {selectedEvent} - {selectedEventDetails?.is_final_only ? '決賽' : (selectedRound === 1 ? '初賽' : '決賽')} 
                    ({participants.length} 位參賽者)
                  </Title>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    size="large"
                    disabled={Object.keys(scores).length === 0}
                  >
                    提交分數 ({Object.keys(scores).length})
                  </Button>
                </Col>
              </Row>

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

          {!scorer?.assigned_events?.length && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Alert
                message="暫無分配項目"
                description="您目前沒有被分配任何運動項目，請聯繫管理員。"
                type="warning"
                showIcon
              />
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default ScorerDashboard;
