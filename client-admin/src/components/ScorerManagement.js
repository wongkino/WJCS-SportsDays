import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm,
  Tag,
  Space,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ScorerManagement = () => {
  const [scorers, setScorers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScorer, setEditingScorer] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadScorers();
    loadEvents();
  }, []);

  const loadScorers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/scorers');
      setScorers(response.data);
    } catch (error) {
      message.error('載入記分員資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data.filter(event => event.is_active));
    } catch (error) {
      message.error('載入比賽項目失敗: ' + error.message);
    }
  };

  const handleAdd = () => {
    setEditingScorer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingScorer(record);
    form.setFieldsValue({
      ...record,
      is_active: record.is_active === 1 || record.is_active === true
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/scorers/${id}`);
      message.success('記分員刪除成功');
      loadScorers();
    } catch (error) {
      message.error('刪除失敗: ' + error.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingScorer) {
        await axios.put(`/api/scorers/${editingScorer.id}`, values);
        message.success('記分員更新成功');
      } else {
        await axios.post('/api/scorers', values);
        message.success('記分員添加成功');
      }
      setModalVisible(false);
      loadScorers();
    } catch (error) {
      message.error('操作失敗: ' + error.message);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldsValue({ password });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '用戶名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '負責項目',
      dataIndex: 'assigned_events',
      key: 'assigned_events',
      render: (events) => {
        if (!events || events.length === 0) {
          return <Tag color="default">未分配</Tag>;
        }
        return events.map(event => (
          <Tag key={event} color="blue">{event}</Tag>
        ));
      },
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => {
        const isEnabled = isActive === 1 || isActive === true;
        return (
          <Tag color={isEnabled ? 'green' : 'red'}>
            {isEnabled ? '啟用' : '停用'}
          </Tag>
        );
      },
    },
    {
      title: '創建時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-TW'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個記分員嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
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
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h2 style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              記分員管理
            </h2>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加記分員
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={scorers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 個記分員`,
          }}
        />
      </Card>

      <Modal
        title={editingScorer ? '編輯記分員' : '添加記分員'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入記分員姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用戶名"
                rules={[{ required: true, message: '請輸入用戶名' }]}
              >
                <Input placeholder="請輸入用戶名" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label="密碼"
            rules={[{ required: !editingScorer, message: '請輸入密碼' }]}
          >
            <Input.Password 
              placeholder={editingScorer ? '留空則不修改密碼' : '請輸入密碼'}
              addonAfter={
                <Button 
                  type="link" 
                  icon={<KeyOutlined />}
                  onClick={generatePassword}
                >
                  生成
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            name="assigned_events"
            label="負責項目"
            rules={[{ required: true, message: '請選擇負責項目' }]}
          >
            <Select
              mode="multiple"
              placeholder="請選擇記分員負責的運動項目"
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {events.map(event => (
                <Option key={event.id} value={event.name}>
                  {event.name} ({event.type}) - {event.group_types} - {event.genders}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="狀態"
            initialValue={true}
          >
            <Select>
              <Option value={true}>啟用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingScorer ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScorerManagement;
