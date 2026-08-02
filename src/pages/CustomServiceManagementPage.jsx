import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Tabs,
  Typography,
  Divider,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Form,
  Switch,
  Alert,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SyncOutlined,
  FileTextOutlined,
  ApiOutlined,
  NodeIndexOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * ============================================
 * 自定义关键服务接口管理页面
 * ============================================
 * 功能：
 * 1. 从下拉框选择模块的发布服务（数据来自3A或手动输入关键字查询）
 * 2. 选中服务后查看服务链路详情和功能详情md文件
 * 3. 将服务添加到自定义关键服务接口
 * 4. 判断受影响情况及通知逻辑
 */

// 模拟数据 - 实际应从API获取
const mockModules = [
  { id: 'module-1', name: '订单模块', code: 'order-service' },
  { id: 'module-2', name: '用户模块', code: 'user-service' },
  { id: 'module-3', name: '支付模块', code: 'payment-service' },
  { id: 'module-4', name: '商品模块', code: 'product-service' },
  { id: 'module-5', name: '库存模块', code: 'inventory-service' },
];

// 模拟服务列表
const mockServices = [
  {
    id: 'service-1',
    name: '创建订单',
    code: 'createOrder',
    moduleId: 'module-1',
    moduleName: '订单模块',
    description: '创建新的订单信息',
    type: 'REST',
    path: '/api/v1/orders',
    method: 'POST',
    isPublic: true,
    docUrl: '/docs/createOrder.md',
  },
  {
    id: 'service-2',
    name: '查询订单',
    code: 'queryOrder',
    moduleId: 'module-1',
    moduleName: '订单模块',
    description: '根据条件查询订单列表',
    type: 'REST',
    path: '/api/v1/orders/query',
    method: 'GET',
    isPublic: true,
    docUrl: '/docs/queryOrder.md',
  },
  {
    id: 'service-3',
    name: '用户登录',
    code: 'userLogin',
    moduleId: 'module-2',
    moduleName: '用户模块',
    description: '用户登录验证',
    type: 'REST',
    path: '/api/v1/auth/login',
    method: 'POST',
    isPublic: true,
    docUrl: '/docs/userLogin.md',
  },
  {
    id: 'service-4',
    name: '获取用户信息',
    code: 'getUserInfo',
    moduleId: 'module-2',
    moduleName: '用户模块',
    description: '获取指定用户的详细信息',
    type: 'REST',
    path: '/api/v1/users/{id}',
    method: 'GET',
    isPublic: false,
    docUrl: '/docs/getUserInfo.md',
  },
];

// 模拟链路详情
const mockChainDetails = [
  {
    id: 1,
    nodeName: 'API网关',
    nodeType: 'gateway',
    status: 'normal',
    responseTime: '15ms',
    qps: 1200,
  },
  {
    id: 2,
    nodeName: '订单服务',
    nodeType: 'service',
    status: 'normal',
    responseTime: '45ms',
    qps: 800,
    downstream: [
      { id: 3, nodeName: '库存服务', nodeType: 'service', status: 'normal', responseTime: '30ms', qps: 800 },
      { id: 4, nodeName: '支付服务', nodeType: 'service', status: 'warning', responseTime: '120ms', qps: 780 },
      { id: 5, nodeName: '用户服务', nodeType: 'service', status: 'normal', responseTime: '20ms', qps: 600 },
    ],
  },
  {
    id: 6,
    nodeName: '消息队列',
    nodeType: 'mq',
    status: 'normal',
    responseTime: '5ms',
    qps: 750,
  },
  {
    id: 7,
    nodeName: '数据库',
    nodeType: 'db',
    status: 'normal',
    responseTime: '8ms',
    qps: 500,
  },
];

// 模拟功能详情MD内容
const mockFunctionDoc = `# 创建订单接口

## 基本信息
- **接口名称**: 创建订单
- **接口编码**: createOrder
- **请求方式**: POST
- **服务路径**: /api/v1/orders

## 功能描述
该接口用于创建新的订单信息，包含订单基本信息、商品明细、支付信息等。

## 请求参数

### 请求头
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | String | 是 | 用户认证Token |

### 请求体
\`\`\`json
{
  "userId": "string",
  "products": [
    {
      "productId": "string",
      "quantity": number
    }
  ],
  "paymentMethod": "string"
}
\`\`\`

## 响应参数

### 成功响应
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "string",
    "orderNo": "string",
    "totalAmount": number,
    "status": "string"
  }
}
\`\`\`

## 错误码
| 错误码 | 说明 |
|--------|------|
| 1001 | 参数错误 |
| 1002 | 库存不足 |
| 1003 | 用户不存在 |
| 1004 | 支付失败 |

## 调用示例
\`\`\`bash
curl -X POST https://api.example.com/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"userId": "123", "products": [...]}'
\`\`\`
`;

// 初始化的自定义服务列表
const initialCustomServices = [
  {
    id: 'custom-1',
    serviceId: 'service-1',
    serviceName: '创建订单',
    serviceCode: 'createOrder',
    moduleName: '订单模块',
    addedAt: '2026-04-08 14:30:00',
    affectEnabled: true,
    notifyEnabled: true,
    status: 'normal',
    recentChangeCount: 3,
  },
  {
    id: 'custom-2',
    serviceId: 'service-3',
    serviceName: '用户登录',
    serviceCode: 'userLogin',
    moduleName: '用户模块',
    addedAt: '2026-04-07 10:20:00',
    affectEnabled: true,
    notifyEnabled: true,
    status: 'warning',
    recentChangeCount: 1,
  },
];

const CustomServiceManagementPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [customServices, setCustomServices] = useState(initialCustomServices);
  const [selectedService, setSelectedService] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [serviceList, setServiceList] = useState(mockServices);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingService, setViewingService] = useState(null);

  // 筛选服务列表
  const filteredServices = serviceList.filter(service => {
    const matchKeyword = !searchKeyword || 
      service.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      service.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      service.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchModule = !moduleFilter || service.moduleId === moduleFilter;
    return matchKeyword && matchModule;
  });

  // 处理选择服务
  const handleSelectService = (service) => {
    setSelectedService(service);
  };

  // 添加服务到自定义列表
  const handleAddService = () => {
    if (!selectedService) {
      message.warning(t('customService.selectServiceWarning'));
      return;
    }

    // 检查是否已存在
    if (customServices.some(cs => cs.serviceId === selectedService.id)) {
      message.warning(t('customService.serviceExistsWarning'));
      return;
    }

    const newCustomService = {
      id: `custom-${Date.now()}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceCode: selectedService.code,
      moduleName: selectedService.moduleName,
      addedAt: new Date().toLocaleString('zh-CN'),
      affectEnabled: true,
      notifyEnabled: true,
      status: 'normal',
      recentChangeCount: 0,
    };

    setCustomServices([...customServices, newCustomService]);
    setSelectedService(null);
    setAddModalVisible(false);
    message.success(t('customService.addSuccess'));
  };

  // 删除自定义服务
  const handleDeleteService = (id) => {
    Modal.confirm({
      title: t('customService.confirmDelete'),
      icon: <DeleteOutlined />,
      content: t('customService.deleteConfirmMessage'),
      okText: t('customService.common.confirm'),
      cancelText: t('customService.common.cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        setCustomServices(customServices.filter(cs => cs.id !== id));
        message.success(t('customService.deleteSuccess'));
      },
    });
  };

  // 查看服务详情
  const handleViewDetail = (service) => {
    setViewingService(service);
    setDetailModalVisible(true);
  };

  // 切换影响判断开关
  const handleToggleAffect = (id, checked) => {
    setCustomServices(customServices.map(cs => 
      cs.id === id ? { ...cs, affectEnabled: checked } : cs
    ));
    message.success(checked ? t('customService.enableAffect') : t('customService.disableAffect'));
  };

  // 切换通知开关
  const handleToggleNotify = (id, checked) => {
    setCustomServices(customServices.map(cs => 
      cs.id === id ? { ...cs, notifyEnabled: checked } : cs
    ));
    message.success(checked ? t('customService.enableNotify') : t('customService.disableNotify'));
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success(t('customService.refreshSuccess'));
    }, 1000);
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'green';
      case 'warning': return 'orange';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return t('customService.status.normal');
      case 'warning': return t('customService.status.warning');
      case 'error': return t('customService.status.error');
      default: return status;
    }
  };

  // 自定义服务列表列配置
  const columns = [
    {
      title: t('customService.table.serviceName'),
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 150,
      render: (text, record) => (
        <Space>
          <ApiOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: t('customService.table.serviceCode'),
      dataIndex: 'serviceCode',
      key: 'serviceCode',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: t('customService.table.moduleName'),
      dataIndex: 'moduleName',
      key: 'moduleName',
      width: 100,
    },
    {
      title: t('customService.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge status={getStatusColor(status)} text={getStatusText(status)} />
      ),
    },
    {
      title: t('customService.table.affectCheck'),
      dataIndex: 'affectEnabled',
      key: 'affectEnabled',
      width: 120,
      render: (enabled, record) => (
        <Tooltip title={t('customService.table.affectTip')}>
          <Switch
            checked={enabled}
            onChange={(checked) => handleToggleAffect(record.id, checked)}
            checkedChildren={t('customService.common.on')}
            unCheckedChildren={t('customService.common.off')}
          />
        </Tooltip>
      ),
    },
    {
      title: t('customService.table.notifyCheck'),
      dataIndex: 'notifyEnabled',
      key: 'notifyEnabled',
      width: 120,
      render: (enabled, record) => (
        <Tooltip title={t('customService.table.notifyTip')}>
          <Switch
            checked={enabled}
            onChange={(checked) => handleToggleNotify(record.id, checked)}
            checkedChildren={t('customService.common.on')}
            unCheckedChildren={t('customService.common.off')}
          />
        </Tooltip>
      ),
    },
    {
      title: t('customService.table.recentChanges'),
      dataIndex: 'recentChangeCount',
      key: 'recentChangeCount',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'orange' : 'green'}>
          {count} {t('customService.table.changesUnit')}
        </Tag>
      ),
    },
    {
      title: t('customService.table.addedAt'),
      dataIndex: 'addedAt',
      key: 'addedAt',
      width: 150,
    },
    {
      title: t('customService.table.action'),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('customService.table.viewDetail')}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title={t('customService.table.delete')}>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteService(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 渲染链路树
  const renderChainTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: level * 24 }}>
        <div style={{ 
          padding: '8px 12px', 
          marginBottom: 8,
          background: node.status === 'warning' ? '#fffbe6' : 
                     node.status === 'error' ? '#fff1f0' : '#f6ffed',
          borderRadius: 4,
          border: `1px solid ${node.status === 'warning' ? '#ffe58f' : 
                              node.status === 'error' ? '#ffccc7' : '#b7eb8f'}`
        }}>
          <Space>
            {node.nodeType === 'gateway' && <Tag color="blue">{t('customService.chain.gateway')}</Tag>}
            {node.nodeType === 'service' && <Tag color="purple">{t('customService.chain.service')}</Tag>}
            {node.nodeType === 'mq' && <Tag color="cyan">MQ</Tag>}
            {node.nodeType === 'db' && <Tag color="orange">{t('customService.chain.database')}</Tag>}
            <Text strong>{node.nodeName}</Text>
            <Tag icon={node.status === 'normal' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={getStatusColor(node.status)}>
              {getStatusText(node.status)}
            </Tag>
            <Text type="secondary">|</Text>
            <Text type="secondary">{t('customService.chain.responseTime')}: {node.responseTime}</Text>
            <Text type="secondary">|</Text>
            <Text type="secondary">QPS: {node.qps}</Text>
          </Space>
        </div>
        {node.downstream && renderChainTree(node.downstream, level + 1)}
      </div>
    ));
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: 8 }} />
          {t('customService.title')}
        </Title>
        <Text type="secondary">{t('customService.subtitle')}</Text>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Spin indicator={<SyncOutlined spin />} />
        </div>
      )}

      <Row gutter={24}>
        {/* ========== 左侧：自定义服务列表 ========== */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <ApiOutlined />
                <span>{t('customService.leftPanel.title')}</span>
                <Badge count={customServices.length} style={{ marginLeft: 8 }} />
              </Space>
            }
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setAddModalVisible(true)}
                >
                  {t('customService.leftPanel.addService')}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                  {t('customService.common.refresh')}
                </Button>
              </Space>
            }
          >
            {customServices.length === 0 ? (
              <Empty 
                description={t('customService.leftPanel.empty')} 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => setAddModalVisible(true)}>
                  {t('customService.leftPanel.addFirst')}
                </Button>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={customServices}
                rowKey="id"
                pagination={{
                  total: customServices.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `${t('customService.table.total')} ${total} ${t('customService.table.items')}`,
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ========== 添加服务弹窗 ========== */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>{t('customService.addModal.title')}</span>
          </Space>
        }
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedService(null);
          setSearchKeyword('');
          setModuleFilter('');
        }}
        footer={
          <Space>
            <Button onClick={() => setAddModalVisible(false)}>
              {t('customService.common.cancel')}
            </Button>
            <Button 
              type="primary" 
              onClick={handleAddService}
              disabled={!selectedService}
            >
              {t('customService.common.add')}
            </Button>
          </Space>
        }
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          {/* 搜索过滤区域 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Input
                placeholder={t('customService.addModal.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={12}>
              <Select
                placeholder={t('customService.addModal.moduleFilter')}
                value={moduleFilter || undefined}
                onChange={setModuleFilter}
                style={{ width: '100%' }}
                allowClear
              >
                {mockModules.map(module => (
                  <Option key={module.id} value={module.id}>
                    {module.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* 选中提示 */}
          {selectedService && (
            <Alert
              message={t('customService.addModal.selected')}
              description={
                <Space>
                  <Tag color="blue">{selectedService.name}</Tag>
                  <Text>{selectedService.description}</Text>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 服务列表 */}
          <List
            size="small"
            bordered
            dataSource={filteredServices}
            style={{ maxHeight: 400, overflow: 'auto' }}
            renderItem={(service) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: selectedService?.id === service.id ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => handleSelectService(service)}
                actions={[
                  <Tag color={service.isPublic ? 'green' : 'orange'}>
                    {service.isPublic ? t('customService.addModal.public') : t('customService.addModal.private')}
                  </Tag>,
                  <Tag>{service.method}</Tag>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{service.name}</Text>
                      <Text type="secondary">@{service.moduleName}</Text>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary" code>{service.path}</Text>
                      <Text type="secondary">{service.description}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText: t('customService.addModal.noServices'),
            }}
          />
        </div>
      </Modal>

      {/* ========== 服务详情弹窗 ========== */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>{t('customService.detailModal.title')}</span>
            {viewingService && (
              <Tag color="blue">{viewingService.serviceName}</Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setViewingService(null);
        }}
        footer={
          <Button type="primary" onClick={() => setDetailModalVisible(false)}>
            {t('customService.common.close')}
          </Button>
        }
        width={1000}
      >
        {viewingService && (
          <Tabs defaultActiveKey="1" type="card">
            {/* ========== 链路详情 ========== */}
            <TabPane
              tab={
                <span>
                  <NodeIndexOutlined />
                  {t('customService.detailModal.chainTab')}
                </span>
              }
              key="1"
            >
              <Card size="small">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>{t('customService.detailModal.chainTitle')}: </Text>
                  <Tag color="blue">{viewingService.serviceName}</Tag>
                  <Tag>{viewingService.serviceCode}</Tag>
                </div>
                <Divider style={{ margin: '16px 0' }} />
                {renderChainTree(mockChainDetails)}
              </Card>
            </TabPane>

            {/* ========== 功能详情MD ========== */}
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  {t('customService.detailModal.docTab')}
                </span>
              }
              key="2"
            >
              <Card size="small">
                <Typography>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 500,
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}>
                    {mockFunctionDoc}
                  </pre>
                </Typography>
              </Card>
            </TabPane>

            {/* ========== 影响分析 ========== */}
            <TabPane
              tab={
                <span>
                  <NotificationOutlined />
                  {t('customService.detailModal.impactTab')}
                </span>
              }
              key="3"
            >
              <Card size="small">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Statistic 
                      title={t('customService.detailModal.totalImpacts')} 
                      value={12} 
                      valueStyle={{ color: '#1890ff' }} 
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={t('customService.detailModal.highRisk')} 
                      value={3} 
                      valueStyle={{ color: '#ff4d4f' }} 
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={t('customService.detailModal.mediumRisk')} 
                      value={5} 
                      valueStyle={{ color: '#faad14' }} 
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={t('customService.detailModal.lowRisk')} 
                      value={4} 
                      valueStyle={{ color: '#52c41a' }} 
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '16px 0' }} />
                <List
                  size="small"
                  dataSource={[
                    { id: 1, module: '库存模块', interface: '扣减库存', risk: 'high', desc: '直接调用，变更影响大' },
                    { id: 2, module: '支付模块', interface: '发起支付', risk: 'high', desc: '核心支付流程' },
                    { id: 3, module: '消息模块', interface: '发送通知', risk: 'medium', desc: '异步调用，影响延迟通知' },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={item.risk === 'high' ? 'red' : item.risk === 'medium' ? 'orange' : 'green'}>
                            {item.risk.toUpperCase()}
                          </Tag>
                        }
                        title={`${item.module} - ${item.interface}`}
                        description={item.desc}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default CustomServiceManagementPage;
