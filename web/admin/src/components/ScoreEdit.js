import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const ScoreEdit = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/scores/all');
      setScores(response.data);
    } catch (error) {
      message.error('載入分數資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingScore(record);
    form.setFieldsValue({
      score: record.score
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`/api/scores/${editingScore.id}`, {
        score: values.score
      });
      message.success('分數修改成功');
      setEditModalVisible(false);
      setEditingScore(null);
      form.resetFields();
      loadScores(); // 重新載入資料
    } catch (error) {
      message.error('分數修改失敗: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = () => {
    setEditModalVisible(false);
    setEditingScore(null);
    form.resetFields();
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`/api/scores/${record.id}`);
      message.success('分數刪除成功');
      loadScores(); // 重新載入資料
    } catch (error) {
      message.error('分數刪除失敗: ' + (error.response?.data?.error || error.message));
    }
  };

  const getParticipantName = (record) => {
    if (record.team_name && record.team_name !== record.participant_name) {
      return `${record.team_name} - ${record.participant_name}`;
    }
    return record.participant_name;
  };

  const getEventName = (record) => {
    return record.event_name;
  };

  const getRoundText = (round, event) => {
    // 根據比賽模式決定輪次顯示
    if (event?.is_final_only) {
      // 直接決賽模式：round=1 就是決賽
      return '決賽';
    } else {
      // 初賽+決賽模式：初賽=1，決賽=2
      if (round === 1) {
        return '初賽';
      } else if (round === 2) {
        return '決賽';
      } else {
        return `第${round}輪`;
      }
    }
  };

  const columns = [
    {
      title: '參賽者',
      key: 'participant',
      render: (_, record) => (
        <div>
          <div>{getParticipantName(record)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.group_type} - {record.gender}
          </div>
        </div>
      ),
    },
    {
      title: '比賽項目',
      key: 'event',
      render: (_, record) => (
        <div>
          <div>{getEventName(record)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.event_type}
          </div>
        </div>
      ),
    },
    {
      title: '輪次',
      dataIndex: 'round',
      key: 'round',
      render: (round, record) => (
        <Tag color={round === 1 ? 'blue' : 'green'}>
          {getRoundText(round, record)}
        </Tag>
      ),
    },
    {
      title: '分數',
      dataIndex: 'score',
      key: 'score',
      render: (score) => <strong>{score}</strong>,
    },
    {
      title: '記錄時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at) => new Date(created_at).toLocaleString('zh-TW'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>
          <Popconfirm
            title="確定要刪除這筆分數記錄嗎？"
            description="刪除後將無法復原"
            onConfirm={() => handleDelete(record)}
            okText="確定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="分數管理" 
        extra={
          <Button onClick={loadScores} loading={loading}>
            重新載入
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={scores}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 筆分數記錄`,
          }}
        />
      </Card>

      <Modal
        title="修改分數"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="儲存"
        cancelText="取消"
        okButtonProps={{ icon: <SaveOutlined /> }}
        cancelButtonProps={{ icon: <CloseOutlined /> }}
      >
        {editingScore && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>參賽者:</strong> {getParticipantName(editingScore)}</p>
            <p><strong>比賽項目:</strong> {getEventName(editingScore)}</p>
            <p><strong>輪次:</strong> {getRoundText(editingScore.round, editingScore)}</p>
            <p><strong>目前分數:</strong> {editingScore.score}</p>
          </div>
        )}
        
        <Form form={form} layout="vertical">
          <Form.Item
            name="score"
            label="新分數"
            rules={[
              { required: true, message: '請輸入分數' },
              { 
                validator: (_, value) => {
                  const num = parseFloat(value);
                  if (isNaN(num) || num < 0) {
                    return Promise.reject(new Error('分數必須是大於等於0的數字'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              type="number" 
              step="0.01" 
              placeholder="請輸入新分數"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScoreEdit;
