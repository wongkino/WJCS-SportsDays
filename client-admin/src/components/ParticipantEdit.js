import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Table, message, Card, Modal, Typography, Space } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ParticipantEdit = ({ participants, loading, groups, onGroupUpdated }) => {
  const [editForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editing, setEditing] = useState(false);

  // 過濾出啟用的組別
  const activeGroups = groups.filter(group => group.is_active);

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

  const handleEditSubmit = async (values) => {
    setEditing(true);
    try {
      await axios.put(`/api/participants/${editingParticipant.id}`, values);
      message.success('參賽者資料更新成功！');
      setEditModalVisible(false);
      // 重新載入頁面數據
      window.location.reload();
    } catch (error) {
      message.error('更新參賽者資料失敗: ' + error.response?.data?.error || error.message);
    } finally {
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingParticipant(null);
    editForm.resetFields();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '單位',
      dataIndex: 'team_name',
      key: 'team_name',
      render: (teamName) => (
        <span style={{ 
          color: teamName ? '#1890ff' : '#999',
          fontWeight: 'bold'
        }}>
          {teamName || '未填寫'}
        </span>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
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
      title: '組別',
      dataIndex: 'group_name',
      key: 'group_name',
      render: (groupName) => (
        <span style={{ 
          color: groupName ? '#722ed1' : '#999',
          fontWeight: 'bold'
        }}>
          {groupName || '未分組'}
        </span>
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
      <Card title="參賽者資料修改">
        <Table
          columns={columns}
          dataSource={participants}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 位參賽者`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 編輯參賽者對話框 */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>編輯參賽者資料</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={handleCancelEdit}
        footer={null}
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
              notFoundContent="暫無組別"
            >
              {activeGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancelEdit}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={editing}>
                更新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParticipantEdit;
