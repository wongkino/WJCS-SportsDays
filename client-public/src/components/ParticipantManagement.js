import React, { useState } from 'react';
import { Form, Input, Select, Button, Table, message, Card, Tabs } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import ParticipantImport from './ParticipantImport';

const { Option } = Select;
const { TabPane } = Tabs;

const ParticipantManagement = ({ participants, onParticipantAdded, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await axios.post('/api/participants', values);
      onParticipantAdded({ ...values, id: response.data.id });
      form.resetFields();
    } catch (error) {
      message.error('新增參賽者失敗: ' + error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
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
      dataIndex: 'group_type',
      key: 'group_type',
      render: (group) => (
        <span style={{ 
          color: group === '工場及社區組' ? '#52c41a' : '#1890ff',
          fontWeight: 'bold'
        }}>
          {group}
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
                label="姓名"
                name="name"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入參賽者姓名" />
              </Form.Item>

              <Form.Item
                label="組別"
                name="group_type"
                rules={[{ required: true, message: '請選擇組別' }]}
              >
                <Select placeholder="請選擇組別">
                  <Option value="工場及社區組">工場及社區組</Option>
                  <Option value="展能組">展能組</Option>
                </Select>
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
                label="隊伍名稱"
                name="team_name"
              >
                <Input placeholder="團體項目請輸入隊伍名稱（個人項目可留空）" />
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

        <TabPane tab="📁 CSV 匯入" key="import">
          <ParticipantImport onImportSuccess={onParticipantAdded} />
        </TabPane>
      </Tabs>

      <Card title={`參賽者列表 (共 ${participants.length} 人)`} style={{ marginTop: 24 }}>
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
    </div>
  );
};

export default ParticipantManagement;
