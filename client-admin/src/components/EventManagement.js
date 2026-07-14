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
  Divider,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const EventManagement = ({ groups, onGroupUpdated }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();

  // 過濾出啟用的組別
  const activeGroups = groups.filter(group => group.is_active);

  useEffect(() => {
    loadEvents();
  }, []);

  // 監聽組別變化，當組別更新時重新載入比賽項目
  useEffect(() => {
    if (groups.length > 0) {
      loadEvents();
    }
  }, [groups]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      message.error('載入比賽項目失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEvent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingEvent(record);
    form.setFieldsValue({
      ...record,
      group_types: record.group_types ? record.group_types.split(',') : activeGroups.map(group => group.name),
      genders: record.genders ? record.genders.split(',') : ['男', '女'],
      is_active: record.is_active === 1 || record.is_active === true
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/events/${id}`);
      message.success('比賽項目刪除成功');
      loadEvents();
    } catch (error) {
      message.error('刪除失敗: ' + error.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const eventData = {
        ...values,
        group_types: Array.isArray(values.group_types) ? values.group_types.join(',') : values.group_types,
        genders: Array.isArray(values.genders) ? values.genders.join(',') : values.genders
      };
      
      if (editingEvent) {
        await axios.put(`/api/events/${editingEvent.id}`, eventData);
        message.success('比賽項目更新成功');
      } else {
        await axios.post('/api/events', eventData);
        message.success('比賽項目添加成功');
      }
      setModalVisible(false);
      loadEvents();
    } catch (error) {
      message.error('操作失敗: ' + error.message);
    }
  };

  const handleStatusChange = async (id, isActive) => {
    try {
      await axios.put(`/api/events/${id}`, { is_active: isActive });
      message.success('狀態更新成功');
      loadEvents();
    } catch (error) {
      message.error('狀態更新失敗: ' + error.message);
    }
  };

  const columns = [
    {
      title: '項目名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <TrophyOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '項目類型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === '個人' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '組別',
      dataIndex: 'group_types',
      key: 'group_types',
      render: (groupTypes) => {
        const groups = groupTypes ? groupTypes.split(',') : activeGroups.map(group => group.name);
        return (
          <Space wrap>
            {groups.map((group, index) => {
              const groupData = activeGroups.find(g => g.name === group);
              const color = groupData ? (groupData.name === '工場及社區組' ? 'orange' : 'purple') : 'default';
              return (
                <Tag key={index} color={color}>
                  {group}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '性別',
      dataIndex: 'genders',
      key: 'genders',
      render: (genders) => {
        const genderList = genders ? genders.split(',') : ['男', '女'];
        return (
          <Space wrap>
            {genderList.map((gender, index) => (
              <Tag key={index} color={gender === '男' ? 'cyan' : 'pink'}>
                {gender}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '計算單位',
      dataIndex: 'calculation_unit',
      key: 'calculation_unit',
      render: (unit) => (
        <Tag color="blue">
          {unit || '分'}
        </Tag>
      ),
    },
    {
      title: '排名方式',
      dataIndex: 'ranking_method',
      key: 'ranking_method',
      render: (method) => (
        <Tag color="green">
          {method || '最高分'}
        </Tag>
      ),
    },
    {
      title: '比賽模式',
      key: 'competition_mode',
      render: (_, record) => (
        <Tag color={record.is_final_only ? 'red' : 'green'}>
          {record.is_final_only ? '直接決賽' : '初賽+決賽'}
        </Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => {
        const isEnabled = isActive === 1 || isActive === true;
        return (
          <Switch
            checked={isEnabled}
            onChange={(checked) => handleStatusChange(record.id, checked)}
            checkedChildren="啟用"
            unCheckedChildren="停用"
          />
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
      ellipsis: true,
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
            title="確定要刪除這個比賽項目嗎？"
            description="刪除後將無法恢復，請謹慎操作！"
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
              <TrophyOutlined style={{ marginRight: 8 }} />
              比賽項目管理
            </h2>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加比賽項目
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 個比賽項目`,
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title={editingEvent ? '編輯比賽項目' : '添加比賽項目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
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
                label="項目名稱"
                rules={[{ required: true, message: '請輸入項目名稱' }]}
              >
                <Input placeholder="請輸入比賽項目名稱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="項目類型"
                rules={[{ required: true, message: '請選擇項目類型' }]}
              >
                <Select placeholder="請選擇項目類型">
                  <Option value="個人">個人</Option>
                  <Option value="團體">團體</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="group_types"
                label="組別"
                rules={[{ required: true, message: '請選擇組別' }]}
                initialValue={activeGroups.map(group => group.name)}
              >
                <Select 
                  mode="multiple" 
                  placeholder="請選擇組別"
                  options={activeGroups.map(group => ({
                    label: group.name,
                    value: group.name
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="genders"
                label="性別"
                rules={[{ required: true, message: '請選擇性別' }]}
                initialValue={['男', '女']}
              >
                <Select 
                  mode="multiple" 
                  placeholder="請選擇性別"
                  options={[
                    { label: '男', value: '男' },
                    { label: '女', value: '女' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="calculation_unit"
                label="計算單位"
                rules={[{ required: true, message: '請選擇計算單位' }]}
                initialValue="分"
              >
                <Select placeholder="請選擇計算單位">
                  <Option value="分">分</Option>
                  <Option value="秒">秒</Option>
                  <Option value="米">米</Option>
                  <Option value="厘米">厘米</Option>
                  <Option value="次">次</Option>
                  <Option value="個">個</Option>
                  <Option value="圈">圈</Option>
                  <Option value="步">步</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ranking_method"
                label="勝出排名方式"
                rules={[{ required: true, message: '請選擇勝出排名方式' }]}
                initialValue="最高分"
              >
                <Select placeholder="請選擇勝出排名方式">
                  <Option value="最高分">最高分</Option>
                  <Option value="最低分">最低分</Option>
                  <Option value="最快時間">最快時間</Option>
                  <Option value="最遠距離">最遠距離</Option>
                  <Option value="最多次數">最多次數</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>


          <Form.Item
            name="description"
            label="項目描述"
          >
            <TextArea 
              rows={3}
              placeholder="請輸入比賽項目的詳細描述（可選）"
            />
          </Form.Item>

          <Form.Item
            name="is_final_only"
            label="比賽模式"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch 
              checkedChildren="直接決賽" 
              unCheckedChildren="初賽+決賽" 
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="狀態"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="啟用" 
              unCheckedChildren="停用" 
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingEvent ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventManagement;
