import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const ParticipantGroupManagement = ({ onGroupUpdated }) => {
  const [groups, setGroups] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  // 載入資料
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, participantsRes] = await Promise.all([
        axios.get('/api/participant-groups'),
        axios.get('/api/participants')
      ]);
      setGroups(groupsRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
      message.error('載入資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 顯示新增/編輯對話框
  const showModal = (group = null) => {
    setEditingGroup(group);
    if (group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        is_active: group.is_active
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 處理表單提交
  const handleSubmit = async (values) => {
    try {
      if (editingGroup) {
        // 編輯組別
        await axios.put(`/api/participant-groups/${editingGroup.id}`, values);
        message.success('組別更新成功');
      } else {
        // 新增組別
        await axios.post('/api/participant-groups', values);
        message.success('組別新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingGroup(null);
      loadData();
      // 通知父組件組別已更新
      if (onGroupUpdated) {
        onGroupUpdated();
      }
    } catch (error) {
      message.error('操作失敗: ' + (error.response?.data?.error || error.message));
    }
  };

  // 刪除組別
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/participant-groups/${id}`);
      message.success('組別刪除成功');
      loadData();
      // 通知父組件組別已更新
      if (onGroupUpdated) {
        onGroupUpdated();
      }
    } catch (error) {
      message.error('刪除失敗: ' + (error.response?.data?.error || error.message));
    }
  };

  // 計算每個組別的參賽者數量
  const getGroupParticipantCount = (groupId) => {
    return participants.filter(p => p.group_id === groupId).length;
  };

  // 表格欄位定義
  const columns = [
    {
      title: '組別名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <TeamOutlined style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 'bold' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: '參賽者數量',
      key: 'participant_count',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: 'var(--color-success)' }} />
          <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
            {getGroupParticipantCount(record.id)} 人
          </span>
        </Space>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '啟用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '建立時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => {
        const date = new Date(text);
        return date.toLocaleString('zh-HK', {
          timeZone: 'Asia/Hong_Kong',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個組別嗎？"
            description="刪除後將無法恢復，請謹慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 統計資料
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.is_active).length;
  const totalParticipants = participants.length;

  return (
    <div>
      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="總組別數"
              value={totalGroups}
              prefix={<TeamOutlined />}
              valueStyle={{ color: 'var(--accent)' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="啟用組別"
              value={activeGroups}
              prefix={<TeamOutlined />}
              valueStyle={{ color: 'var(--color-success)' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="總參賽者"
              value={totalParticipants}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'var(--text-primary)' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 組別管理表格 */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <span>參賽者組別管理</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            新增組別
          </Button>
        }
      >
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          管理參賽者的組別分類，可以新增、編輯或刪除組別
        </Text>
        
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 新增/編輯組別對話框 */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: 'var(--accent)' }} />
            <span>{editingGroup ? '編輯組別' : '新增組別'}</span>
          </Space>
        }
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingGroup(null);
        }}
        okText="確認"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="組別名稱"
            name="name"
            rules={[
              { required: true, message: '請輸入組別名稱' },
              { max: 50, message: '組別名稱不能超過50個字符' }
            ]}
          >
            <Input placeholder="請輸入組別名稱" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[
              { max: 200, message: '描述不能超過200個字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="請輸入組別描述（可選）" 
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="狀態"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                defaultChecked={true}
                style={{ marginRight: 8 }}
              />
              <span>啟用此組別</span>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParticipantGroupManagement;
