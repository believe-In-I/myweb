// 导入React核心库和钩子
import React, { useState } from 'react';
// 导入Ant Design组件
import { Card, Typography, List, Collapse, Tag, Timeline, Button, Drawer, Form, Input, Select, DatePicker } from 'antd';
// 导入Ant Design图标
import { CalendarOutlined, CodeOutlined, BugOutlined, StarOutlined, PlusOutlined, InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 解构Ant Design组件
const { Title, Text } = Typography;
const { Panel } = Collapse;

/**
 * 更新记录页面组件
 * 功能：展示系统版本更新历史记录
 */
export default function UpdateHistoryPage() {
  // 表单实例
  const [form] = Form.useForm();
  // 抽屉可见状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 编辑模式状态
  const [editMode, setEditMode] = useState(false);
  // 当前编辑的记录索引
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  // 控制编辑和删除按钮的显示状态
  const [showEditButtons, setShowEditButtons] = useState(false);
  // 更新记录数据
  const [updateHistory, setUpdateHistory] = useState([
    {
      version: 'v1.2.0',
      date: '2026-01-23',
      type: 'major',
      description: '系统功能全面升级',
      details: [
        {
          type: 'feature',
          content: '新增无限滚动分页功能，提升搜索体验'
        },
        {
          type: 'feature',
          content: '新增G6关系图可视化功能，支持复杂关系展示'
        },
        {
          type: 'feature',
          content: '新增需求详情左右布局，优化信息展示'
        },
        {
          type: 'optimize',
          content: '优化页面样式，提升整体视觉效果'
        },
        {
          type: 'bugfix',
          content: '修复搜索结果展示的边界情况'
        }
      ]
    },
    {
      version: 'v1.1.0',
      date: '2026-01-20',
      type: 'minor',
      description: '搜索功能优化',
      details: [
        {
          type: 'feature',
          content: '新增搜索抽屉功能，优化搜索流程'
        },
        {
          type: 'optimize',
          content: '优化搜索算法，提升搜索准确性'
        },
        {
          type: 'bugfix',
          content: '修复搜索框聚焦问题'
        }
      ]
    },
    {
      version: 'v1.0.0',
      date: '2026-01-15',
      type: 'major',
      description: '系统正式上线',
      details: [
        {
          type: 'feature',
          content: '实现需求搜索功能'
        },
        {
          type: 'feature',
          content: '实现需求详情展示'
        },
        {
          type: 'feature',
          content: '实现基本的页面布局'
        }
      ]
    }
  ]);

  // 类型标签配置
  const getTypeTag = (type) => {
    switch (type) {
      case 'feature':
        return <Tag color="green" icon={<PlusOutlined />}>新增功能</Tag>;
      case 'optimize':
        return <Tag color="blue" icon={<StarOutlined />}>优化改进</Tag>;
      case 'bugfix':
        return <Tag color="orange" icon={<BugOutlined />}>修复问题</Tag>;
      default:
        return <Tag color="gray" icon={<InfoCircleOutlined />}>其他</Tag>;
    }
  };

  // 版本类型标签配置
  const getVersionTypeTag = (type) => {
    switch (type) {
      case 'major':
        return <Tag color="red">重大更新</Tag>;
      case 'minor':
        return <Tag color="green">功能更新</Tag>;
      case 'patch':
        return <Tag color="blue">修复更新</Tag>;
      default:
        return <Tag color="gray">其他更新</Tag>;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* 页面头部 */}
        <div style={{
          padding: '40px 40px 30px',
          backgroundColor: '#f8f9ff',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <CalendarOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <Title level={2} style={{
                margin: 0,
                color: '#1890ff',
                fontWeight: 600
              }}>更新记录</Title>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditMode(false);
                  setCurrentEditIndex(null);
                  form.resetFields();
                  setDrawerVisible(true);
                }}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                添加更新记录
              </Button>
              <Button
                type={showEditButtons ? "primary" : "default"}
                icon={<EditOutlined />}
                onClick={() => setShowEditButtons(!showEditButtons)}
                style={{
                  borderRadius: '8px',
                  boxShadow: showEditButtons ? '0 2px 8px rgba(24, 144, 255, 0.2)' : 'none',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {showEditButtons ? '隐藏编辑按钮' : '编辑更新记录'}
              </Button>
            </div>
          </div>
          <Text type="secondary" style={{ fontSize: '16px', color: '#6b7280' }}>
            记录系统版本更新历史，展示功能变化和优化改进
          </Text>
        </div>

        {/* 主内容区域 */}
        <div style={{
          padding: '40px',
          minHeight: '500px'
        }}>
          {/* 更新记录时间轴 */}
          <Timeline mode="left" style={{ marginBottom: '40px' }}>
            {updateHistory.map((record, index) => (
              <Timeline.Item
                key={index}
                color="#1890ff"
                dot={<CodeOutlined style={{ fontSize: '16px' }} />}
              >
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)'
                    },
                    position: 'relative' // 为操作按钮提供定位上下文
                  }}
                >
                  {/* 操作按钮 - 仅在showEditButtons为true时显示，使用绝对定位 */}
                  {showEditButtons && (
                    <div style={{
                      position: 'absolute',
                      top: '120px',
                      right: '16px',
                      display: 'flex',
                      gap: '12px',
                      zIndex: 10
                    }}>
                      <Button
                        type="default"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          // 进入编辑模式
                          setEditMode(true);
                          setCurrentEditIndex(index);
                          // 回显表单数据
                          form.setFieldsValue({
                            version: record.version,
                            type: record.type,
                            date: dayjs(record.date),
                            description: record.description,
                            detailsList: record.details
                          });
                          // 打开抽屉
                          setDrawerVisible(true);
                        }}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                      >
                        编辑
                      </Button>
                      <Button
                        danger
                        size="small"
                        icon={<BugOutlined />}
                        onClick={() => {
                          // 删除记录确认
                          if (window.confirm('确定要删除这条更新记录吗？')) {
                            const newHistory = [...updateHistory];
                            newHistory.splice(index, 1);
                            setUpdateHistory(newHistory);
                          }
                        }}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                      >
                        删除
                      </Button>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Title level={4} style={{ margin: 0, color: '#1f2937', fontWeight: 600 }}>{record.version}</Title>
                        {getVersionTypeTag(record.type)}
                      </div>
                      <Text type="secondary" style={{ fontSize: '14px', color: '#6b7280' }}>
                        {record.date}
                      </Text>
                    </div>
                    <Text strong style={{ fontSize: '16px', color: '#374151', display: 'block', marginBottom: '16px' }}>
                      {record.description}
                    </Text>
                  </div>

                  {/* 折叠面板展示详细更新内容 */}
                  <Collapse defaultActiveKey={['0']} ghost>
                    <Panel header="查看详细更新内容" key="0">
                      <List
                        dataSource={record.details}
                        renderItem={(detail, detailIndex) => (
                          <List.Item style={{ padding: '8px 0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ marginTop: '4px' }}>{getTypeTag(detail.type)}</div>
                            <Text style={{ color: '#4b5563', lineHeight: '1.6' }}>{detail.content}</Text>
                          </List.Item>
                        )}
                      />
                    </Panel>
                  </Collapse>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>

          {/* 页脚信息 */}
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            marginTop: '40px',
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <Text>© 2026 原子需求管理系统 - 持续更新，不断优化</Text>
          </div>
        </div>

        {/* 添加/编辑更新记录的抽屉 */}
        <Drawer
          title={editMode ? "编辑更新记录" : "添加更新记录"}
          placement="right"
          onClose={() => {
            setDrawerVisible(false);
            // 重置表单和编辑模式
            form.resetFields();
            setEditMode(false);
            setCurrentEditIndex(null);
          }}
          open={drawerVisible}
          width={640}
          footer={null}
          style={{
            borderRadius: '16px 0 0 16px',
            boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.08)'
          }}
          headerStyle={{
            padding: '24px 32px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}
          bodyStyle={{ padding: '24px 32px' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              // 处理表单提交
              const newRecord = {
                version: values.version || 'v0.0.0',
                date: values.date.format('YYYY-MM-DD'),
                type: values.type || 'minor',
                description: values.description || '暂无介绍',
                details: values.detailsList.filter(item => item.content).map(item => ({
                  type: item.type,
                  content: item.content
                }))
              };

              if (editMode && currentEditIndex !== null) {
                // 编辑模式：更新现有记录
                const newHistory = [...updateHistory];
                newHistory[currentEditIndex] = newRecord;
                // 按版本号倒序排序
                newHistory.sort((a, b) => {
                  // 简单的版本号比较，实际项目中可能需要更复杂的版本号比较逻辑
                  return b.version.localeCompare(a.version);
                });
                setUpdateHistory(newHistory);
                // 编辑完成后隐藏编辑按钮
                setShowEditButtons(false);
              } else {
                // 添加模式：添加新记录
                setUpdateHistory([newRecord, ...updateHistory]);
              }

              // 关闭抽屉
              setDrawerVisible(false);
              // 重置表单
              form.resetFields();
              // 重置编辑模式
              setEditMode(false);
              setCurrentEditIndex(null);
            }}
          >
            <Form.Item
              name="version"
              label="版本号"
              initialValue=""
            >
              <Input placeholder="例如：v1.3.0" />
            </Form.Item>

            <Form.Item
              name="type"
              label="更新类型"
              initialValue="minor"
            >
              <Select placeholder="请选择更新类型">
                <Select.Option value="major">重大更新</Select.Option>
                <Select.Option value="minor">功能更新</Select.Option>
                <Select.Option value="patch">修复更新</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label="更新日期"
              rules={[{ required: true, message: '请选择更新日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="更新描述"
              initialValue=""
            >
              <Input.TextArea placeholder="例如：系统功能全面升级" rows={3} />
            </Form.Item>

            <Form.List
              name="detailsList"
              rules={[
                {
                  required: true,
                  validator: async (_, detailsList) => {
                    const hasValidContent = detailsList.some(item => item.content?.trim());
                    if (!hasValidContent) {
                      return Promise.reject(new Error('请至少添加一条详细更新内容'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              initialValue={[{ type: 'feature', content: '' }]}
            >
              {(fields, { add, remove }) => (
                <>
                  <Form.Item label="详细更新内容">
                    {fields.map((field) => {
                      // 解构field对象，排除key属性
                      const { key, ...restField } = field;
                      return (
                        <div
                          key={key} // 使用解构出的key作为div的key
                          style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}
                        >
                          <Form.Item
                            {...restField}
                            name={[field.name, 'type']}
                            noStyle
                          >
                            <Select
                              placeholder="选择更新类型"
                              style={{ width: 120 }}
                            >
                              <Select.Option value="feature">新增功能</Select.Option>
                              <Select.Option value="optimize">优化改进</Select.Option>
                              <Select.Option value="bugfix">修复问题</Select.Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            {...restField} // 只spread不包含key的属性
                            name={[field.name, 'content']}
                            noStyle
                          >
                            <Input.TextArea
                              placeholder="输入更新内容"
                              rows={2}
                              style={{ flex: 1 }}
                            />
                          </Form.Item>

                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => add({ type: 'feature', content: '' })}
                            style={{ alignSelf: 'center', marginLeft: 8 }}
                          >
                            添加
                          </Button>

                          {fields.length > 1 && (
                            <Button
                              danger
                              icon={<BugOutlined />}
                              onClick={() => remove(field.name)}
                              style={{ alignSelf: 'center', marginLeft: 8 }}
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      );
                    })}

                  </Form.Item>
                </>
              )}
            </Form.List>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setDrawerVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </div>
          </Form>
        </Drawer>
      </div>
    </div>
  );
}
