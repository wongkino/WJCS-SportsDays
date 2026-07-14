import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Table, message, Card, Tabs, Modal, Typography, Space } from 'antd';
import { PlusOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const { Option } = Select;
const { TabPane } = Tabs;

const ParticipantManagement = ({ participants, onParticipantAdded, loading }) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editing, setEditing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // 載入組別資料
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const response = await axios.get('/api/participant-groups');
      const activeGroups = response.data.filter(group => group.is_active);
      console.log('載入的組別資料:', activeGroups);
      setGroups(activeGroups);
    } catch (error) {
      console.error('載入組別失敗:', error);
      message.error('載入組別失敗: ' + error.message);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await axios.post('/api/participants', values);
      onParticipantAdded({ ...values, id: response.data.id });
      form.resetFields();
      // 重新載入組別資料
      loadGroups();
    } catch (error) {
      message.error('新增參賽者失敗: ' + error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 顯示編輯參賽者對話框
  const showEditModal = (participant) => {
    setEditingParticipant(participant);
    editForm.setFieldsValue({
      name: participant.name,
      group_id: participant.group_id,
      gender: participant.gender,
      team_name: participant.team_name
    });
    setEditModalVisible(true);
  };

  // 處理編輯參賽者
  const handleEditSubmit = async (values) => {
    setEditing(true);
    try {
      const response = await axios.put(`/api/participants/${editingParticipant.id}`, values);
      message.success('參賽者資料修改成功');
      setEditModalVisible(false);
      setEditingParticipant(null);
      editForm.resetFields();
      
      // 重新載入頁面以更新數據
      window.location.reload();
    } catch (error) {
      message.error('修改參賽者失敗: ' + (error.response?.data?.error || error.message));
    } finally {
      setEditing(false);
    }
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingParticipant(null);
    editForm.resetFields();
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <span>
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {text}
        </span>
      ),
    },
    {
      title: '組別',
      dataIndex: 'group_name',
      key: 'group_name',
      render: (groupName, record) => (
        <span style={{ 
          color: groupName ? '#722ed1' : '#999',
          fontWeight: 'bold'
        }}>
          {groupName || '未分組'}
        </span>
      ),
    },
    {
      title: '性別',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => (
        <span style={{ 
          color: gender === '男' ? '#1890ff' : '#eb2f96',
          fontWeight: 'bold'
        }}>
          {gender}
        </span>
      ),
    },
    {
      title: '單位',
      dataIndex: 'team_name',
      key: 'team_name',
      render: (text) => text || '-',
    },
    {
      title: '新增時間',
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
            onClick={() => showEditModal(record)}
          >
            編輯
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="manual" size="large">
        <TabPane tab="📝 手動新增" key="manual">
          <Card title="新增參賽者" style={{ marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                label="單位"
                name="team_name"
                rules={[{ required: true, message: '請輸入單位' }]}
              >
                <Input placeholder="請輸入參賽者所屬單位" />
              </Form.Item>

              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入參賽者姓名" />
              </Form.Item>

              <Form.Item
                label="性別"
                name="gender"
                rules={[{ required: true, message: '請選擇性別' }]}
              >
                <Select placeholder="請選擇性別">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="組別"
                name="group_id"
                rules={[{ required: true, message: '請選擇組別' }]}
              >
                <Select 
                  placeholder="請選擇組別" 
                  loading={groupsLoading}
                  notFoundContent={groupsLoading ? "載入中..." : "暫無組別"}
                >
                  {groups.map(group => (
                    <Option key={group.id} value={group.id}>
                      {group.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  icon={<PlusOutlined />}
                  size="large"
                >
                  新增參賽者
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="✏️ 資料修改" key="edit">
          <Card title={`參賽者列表 (共 ${participants.length} 人)`}>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              點擊「編輯」按鈕可以修改參賽者資料
            </Text>
            <Table
              columns={columns}
              dataSource={participants}
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
        </TabPane>

      </Tabs>

      {/* 編輯參賽者對話框 */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1890ff' }} />
            <span>編輯參賽者資料</span>
          </Space>
        }
        open={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleCancelEdit}
        okText="確認修改"
        cancelText="取消"
        okButtonProps={{ 
          loading: editing
        }}
        cancelButtonProps={{ disabled: editing }}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            label="單位"
            name="team_name"
            rules={[{ required: true, message: '請輸入單位' }]}
          >
            <Input placeholder="請輸入參賽者所屬單位" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '請輸入姓名' }]}
          >
            <Input placeholder="請輸入參賽者姓名" />
          </Form.Item>

          <Form.Item
            label="性別"
            name="gender"
            rules={[{ required: true, message: '請選擇性別' }]}
          >
            <Select placeholder="請選擇性別">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="組別"
            name="group_id"
            rules={[{ required: true, message: '請選擇組別' }]}
          >
            <Select 
              placeholder="請選擇組別" 
              loading={groupsLoading}
              notFoundContent={groupsLoading ? "載入中..." : "暫無組別"}
            >
              {groups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParticipantManagement;
