import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, message, Row, Col } from 'antd';
import { SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ScoreInput = ({ participants, events, onScoreAdded, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await axios.post('/api/scores', values);
      onScoreAdded();
      form.resetFields();
    } catch (error) {
      message.error('分數記錄失敗: ' + error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventChange = (eventId) => {
    const event = events.find(e => e.id === parseInt(eventId));
    setSelectedEvent(event);
  };

  // 根據選中的比賽項目過濾參賽者
  const getFilteredParticipants = () => {
    if (!selectedEvent) return participants;
    
    if (selectedEvent.type === '團體') {
      // 團體項目只顯示有隊伍名稱的參賽者
      return participants.filter(p => p.team_name);
    } else {
      // 個人項目顯示所有參賽者
      return participants;
    }
  };

  const filteredParticipants = getFilteredParticipants();

  return (
    <div>
      <Card title="分數輸入" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="比賽項目"
                name="event_id"
                rules={[{ required: true, message: '請選擇比賽項目' }]}
              >
                <Select 
                  placeholder="請選擇比賽項目"
                  onChange={handleEventChange}
                >
                  {events.map(event => (
                    <Option key={event.id} value={event.id}>
                      <TrophyOutlined style={{ marginRight: 8 }} />
                      {event.name} ({event.type})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="參賽者"
                name="participant_id"
                rules={[{ required: true, message: '請選擇參賽者' }]}
              >
                <Select 
                  placeholder="請選擇參賽者"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {filteredParticipants.map(participant => (
                    <Option key={participant.id} value={participant.id}>
                      {participant.name} ({participant.group_type} - {participant.gender})
                      {participant.team_name && ` - ${participant.team_name}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="輪次"
                name="round"
                rules={[{ required: true, message: '請選擇輪次' }]}
              >
                <Select placeholder="請選擇輪次">
                  <Option value="初賽">初賽</Option>
                  <Option value="決賽">決賽</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="分數"
                name="score"
                rules={[
                  { required: true, message: '請輸入分數' },
                  { type: 'number', message: '請輸入有效的數字' },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.resolve();
                      }
                      
                      const numValue = parseFloat(value);
                      if (isNaN(numValue)) {
                        return Promise.reject(new Error('請輸入有效的數字'));
                      }
                      
                      // 根據比賽項目設定不同的驗證規則
                      if (selectedEvent?.name === '來回跑') {
                        // 來回跑：時間越短越好，但必須大於0
                        if (numValue <= 0) {
                          return Promise.reject(new Error('時間必須大於0秒'));
                        }
                        if (numValue > 300) {
                          return Promise.reject(new Error('時間不能超過300秒'));
                        }
                      } else if (selectedEvent?.name === '立定跳遠') {
                        // 立定跳遠：距離越遠越好，但必須大於0
                        if (numValue <= 0) {
                          return Promise.reject(new Error('距離必須大於0公分'));
                        }
                        if (numValue > 1000) {
                          return Promise.reject(new Error('距離不能超過1000公分'));
                        }
                      } else if (selectedEvent?.name === '火箭投擲') {
                        // 火箭投擲：距離越遠越好，但必須大於0
                        if (numValue <= 0) {
                          return Promise.reject(new Error('距離必須大於0公尺'));
                        }
                        if (numValue > 100) {
                          return Promise.reject(new Error('距離不能超過100公尺'));
                        }
                      } else if (selectedEvent?.name === '硬地滾球') {
                        // 硬地滾球：分數越高越好，但必須大於等於0
                        if (numValue < 0) {
                          return Promise.reject(new Error('分數不能小於0分'));
                        }
                        if (numValue > 100) {
                          return Promise.reject(new Error('分數不能超過100分'));
                        }
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="請輸入分數"
                  suffix={selectedEvent?.name === '來回跑' ? '秒' : 
                          selectedEvent?.name === '立定跳遠' ? '公分' :
                          selectedEvent?.name === '火箭投擲' ? '公尺' :
                          selectedEvent?.name === '硬地滾球' ? '分' : ''}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              icon={<SaveOutlined />}
              size="large"
            >
              記錄分數
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {selectedEvent && (
        <Card title={`${selectedEvent.name} - 參賽者列表`}>
          <div style={{ color: '#666', marginBottom: 16 }}>
            {selectedEvent.type === '團體' ? 
              '團體項目：顯示有隊伍名稱的參賽者' : 
              '個人項目：顯示所有參賽者'
            }
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredParticipants.map(participant => (
              <div 
                key={participant.id}
                style={{
                  padding: '8px 12px',
                  margin: '4px 0',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}
              >
                <strong>{participant.name}</strong> 
                <span style={{ margin: '0 8px', color: '#666' }}>
                  ({participant.group_type} - {participant.gender})
                </span>
                {participant.team_name && (
                  <span style={{ color: '#1890ff' }}>
                    隊伍：{participant.team_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ScoreInput;
