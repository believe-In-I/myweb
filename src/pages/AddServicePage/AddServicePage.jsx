import React, { Component } from 'react';
import { Input, Tabs, Spin, Empty, Button, Divider, Tag, Modal, message } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, SwapOutlined, PlusOutlined } from '@ant-design/icons';
import AddBusinessModal from './components/AddBusinessModal';

/**
 * 添加服务页面
 *
 * 功能说明：
 * 1. 顶部导航栏：返回按钮 + 当前服务名称（可点击切换）+ 切换图标
 * 2. 左侧面板：显示当前一级服务下的二级服务列表（支持搜索）
 * 3. 右侧面板：显示选中服务的详细信息（包含基本信息和功能详情标签页）
 * 4. 支持拖拽调整左右面板宽度
 * 5. 支持切换一级服务，切换后自动重新加载对应数据
 */
class AddServicePage extends Component {
  constructor(props) {
    super(props);
    // ============ 模拟数据 ============
    // 所有一级服务列表
    const allServices = [
      { code: 'ATICC-JAva', name: 'ATICC-JAva' },
      { code: 'ATICC-Web', name: 'ATICC-Web' },
      { code: 'ATICC-JS', name: 'ATICC-JS' }
    ];

    this.state = {
      searchKeyword: '',                // 搜索关键词
      allServices: allServices,         // 所有一级服务列表（用于切换模态框显示）
      // 当前选中的一级服务（默认第一个）
      currentService: allServices[0],
      // 左侧列表数据（二级服务，根据当前一级服务 code 动态加载）
      services: [],
      // 所有二级服务完整列表（用于搜索过滤）
      allServicesList: [],
      // 右侧选中的服务详情对象
      selectedService: null,
      loading: false,                   // 加载状态
      leftWidth: 340,                   // 左侧面板宽度
      isDragging: false,                // 是否正在拖拽分割条
      moduleVisible: false,             // 切换服务模态框显示状态
      businessModalVisible: false,      // 新增业务链路弹窗显示状态
      // 弹窗初始值
      businessModalInitialValues: {},   // 弹窗表单初始值
      // 弹窗禁用字段
      businessModalDisabledFields: [],  // 弹窗禁用字段列表
    };
    this.containerRef = React.createRef();
    this.debounceTimer = null;
  }

  // ============ 生命周期方法 ============

  /**
   * 防抖处理
   * @param {Function} func 需要防抖执行的函数
   * @param {number} wait 等待时间（毫秒）
   */
  debounce = (func, wait) => {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  };

  /**
   * 组件挂载后
   * - 解析 URL query 参数
   * - 默认加载第一个服务的数据
   */
  componentDidMount() {
    // 获取 URL 中的 query 参数
    if (this.props.location) {
      const queryParams = new URLSearchParams(this.props.location.search);
      const id = queryParams.get('id');
      const name = queryParams.get('name');
      console.log('获取到的 query 参数:', { id, name });

      // 如果有参数，可以在这里做初始数据请求等操作
      if (id) {
        // this.fetchDataById(id);
      }
    }

    // 页面加载时默认请求第一个服务的数据
    this.loadServices(this.state.currentService.code);
  }

  /**
   * 组件卸载前清理定时器
   */
  componentWillUnmount() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ============ 数据加载方法 ============

  /**
   * 根据服务 code 加载左侧列表数据（模拟接口请求）
   * @param {string} code 一级服务的 code
   */
  loadServices = (code) => {
    this.setState({ loading: true, selectedService: null, searchKeyword: '' });

    setTimeout(() => {
      // 模拟接口：根据不同的 code 返回不同的数据
      const mockServices = {
        'ATICC-JAva': [
          { id: 'java-1', code: 'JAVA-001', name: 'Java 用户服务', description: '用户注册登录', category: '基础服务', version: 'v1.0.0' },
          { id: 'java-2', code: 'JAVA-002', name: 'Java 订单服务', description: '订单创建处理', category: '核心服务', version: 'v2.1.0' },
          { id: 'java-3', code: 'JAVA-003', name: 'Java 支付服务', description: '支付接口', category: '核心服务', version: 'v1.5.0' },
        ],
        'ATICC-Web': [
          { id: 'web-1', code: 'WEB-001', name: 'Web 前端服务', description: '页面渲染', category: '基础服务', version: 'v1.0.0' },
          { id: 'web-2', code: 'WEB-002', name: 'Web 网关服务', description: '请求路由', category: '核心服务', version: 'v2.0.0' },
        ],
        'ATICC-JS': []
      };

      const data = mockServices[code] || [];
      // 保存完整列表用于搜索过滤，同时更新显示列表
      this.setState({ 
        services: data, 
        allServicesList: data,
        loading: false 
      });
    }, 500);
  };

  /**
   * 搜索服务（前端过滤，搜索已加载的二级服务列表）
   * @param {string} keyword 搜索关键词
   */
  searchServices = (keyword) => {
    const { allServicesList } = this.state;
    // 不显示 loading，直接过滤
    const filtered = allServicesList.filter(item => 
      item.name.toLowerCase().includes(keyword.toLowerCase()) ||
      item.code.toLowerCase().includes(keyword.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(keyword.toLowerCase()))
    );
    this.setState({ services: filtered });
  };

  // ============ 事件处理方法 ============

  /**
   * 执行搜索（点击放大镜或回车时调用）
   */
  executeSearch = () => {
    const { searchKeyword, allServicesList } = this.state;
    if (searchKeyword.trim()) {
      this.searchServices(searchKeyword);
    } else {
      // 搜索清空时，恢复显示所有服务
      this.setState({ services: allServicesList, selectedService: null });
    }
  };

  /**
   * 搜索框输入变化（实时搜索，带防抖）
   * @param {Event} e 事件对象
   */
  handleSearchChange = (e) => {
    const keyword = e.target.value;
    this.setState({ searchKeyword: keyword });

    // 防抖处理：延迟 300ms 执行搜索
    this.debounce(() => {
      if (keyword.trim()) {
        this.searchServices(keyword);
      } else {
        // 搜索清空时，恢复显示所有服务
        const { allServicesList } = this.state;
        this.setState({ services: allServicesList, selectedService: null });
      }
    }, 300);
  };

  /**
   * 点击放大镜图标
   */
  handleSearchClick = () => {
    this.executeSearch();
  };

  /**
   * 回车键触发搜索
   * @param {Event} e 事件对象
   */
  handlePressEnter = (e) => {
    this.executeSearch();
  };

  /**
   * 点击左侧服务列表项
   * @param {Object} service 服务对象
   */
  handleSelectService = (service) => {
    this.setState({ selectedService: service });
  };

  /**
   * 打开切换服务模态框
   */
  showModuleModal = () => {
    this.setState({ moduleVisible: true });
  };

  /**
   * 关闭模态框
   */
  hideModuleModal = () => {
    this.setState({ moduleVisible: false });
  };

  /**
   * 从模态框中选择一级服务
   * @param {Object} service 一级服务对象
   */
  handleSelectModule = (service) => {
    this.setState({
      currentService: service,
      moduleVisible: false,
      selectedService: null, // 清空右侧选���
    });
    // 加载该服务的左侧列表数据
    this.loadServices(service.code);
  };

  /**
   * 跳转方法（类组件版本）
   * @param {Object} options 跳转选项
   * @param {string} options.pathname 目标路径
   * @param {Object} options.query query 参数对象
   */
  go = (options) => {
    const { pathname, query = {} } = options;
    // 将 query 对象转换为 URLSearchParams
    const searchParams = new URLSearchParams(query).toString();
    const url = searchParams ? `${pathname}?${searchParams}` : pathname;
    this.props.navigate(url);
  };

  /**
   * 返回上一页
   */
  handleGoBack = () => {
    this.props.navigate(-1);
  };

  /**
   * 打开新增业务链路弹窗（模式1：传入targetServiceUnit和callServiceName）
   */
  openBusinessModal1 = () => {
    // 获取当前选中服务的数据作为默认值
    const { selectedService } = this.state;
    const initialValues = {
      targetServiceUnit: selectedService?.name || '默认服务单元',
      callServiceName: selectedService?.code || '默认调用名称',
    };
    this.setState({ 
      businessModalVisible: true,
      businessModalInitialValues: initialValues,
      businessModalDisabledFields: ['targetServiceUnit', 'callServiceName'],
    });
  };

  /**
   * 打开新增业务链路弹窗（模式2：只传入targetServiceUnit）
   */
  openBusinessModal2 = () => {
    // 获取当前选中服务的数据作为默认值
    const { selectedService } = this.state;
    const initialValues = {
      targetServiceUnit: selectedService?.name || '默认服务单元',
    };
    this.setState({ 
      businessModalVisible: true,
      businessModalInitialValues: initialValues,
      businessModalDisabledFields: ['targetServiceUnit'],
    });
  };

  /**
   * 关闭新增业务链路弹窗
   */
  closeBusinessModal = () => {
    this.setState({ 
      businessModalVisible: false,
      businessModalInitialValues: {},
      businessModalDisabledFields: [],
    });
  };

  /**
   * 处理业务链路表单提交
   */
  handleBusinessSubmit = (values) => {
    console.log('业务链路表单提交数据：', values);
    message.success('业务链路添加成功！');
    this.setState({ businessModalVisible: false });
  };

  // ============ 拖拽处理 ============

  /**
   * 鼠标按下事件（开始拖拽）
   * @param {Event} e 事件对象
   */
  handleMouseDown = (e) => {
    e.preventDefault();
    this.setState({ isDragging: true });
    this.bindDragEvents();
  };

  /**
   * 绑定拖拽事件
   */
  bindDragEvents = () => {
    const handleMouseMove = (e) => {
      if (!this.containerRef.current) return;

      const containerRect = this.containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      const minWidth = 250;                       // 最小宽度
      const maxWidth = containerRect.width - 400; // 最大宽度（右侧预留 400px）

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        this.setState({ leftWidth: newWidth });
      }
    };

    const handleMouseUp = () => {
      this.setState({ isDragging: false });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // ============ 渲染方法 ============

  render() {
    const {
      searchKeyword,
      services,
      selectedService,
      loading,
      leftWidth,
      isDragging,
      currentService,
      moduleVisible,
      allServicesList
    } = this.state;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
        {/* ============ 顶部导航栏 ============ */}
        <div style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,21,41,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* 返回按钮：点击返回上一页 */}
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={this.handleGoBack}
                style={{ borderRadius: '6px' }}
              >
                返回
              </Button>

              {/* 当前服务名称 + 切换图标：点击打开切换服务模态框 */}
              <Button
                type="text"
                onClick={this.showModuleModal}
                style={{
                  padding: '4px 12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#262626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{currentService.name}</span>
                <SwapOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* 新增业务链路按钮1：传入targetServiceUnit和callServiceName，禁用这两个输入框 */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={this.openBusinessModal1}
                style={{ borderRadius: '6px' }}
              >
                新增业务链路1
              </Button>
              {/* 新增业务链路按钮2：只传入targetServiceUnit，禁用该输入框 */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={this.openBusinessModal2}
                style={{ borderRadius: '6px' }}
              >
                新增业务链路2
              </Button>
            </div>
          </div>
        </div>

        {/* ============ 主体内容区域 ============ */}
        <div
          ref={this.containerRef}
          style={{
            flex: 1,
            display: 'flex',
            gap: 0,
            padding: '16px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* ============ 左侧面板：服务列表 ============ */}
          <div style={{
            width: leftWidth,
            minWidth: 250,
            background: '#fff',
            borderRadius: '12px 0 0 12px',
            padding: '20px',
            overflow: 'auto',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            {/* 搜索框区域 */}
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder="搜索服务名称、编码..."
                prefix={
                  <SearchOutlined
                    onClick={this.handleSearchClick}
                    style={{
                      color: '#bfbfbf',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  />
                }
                onChange={this.handleSearchChange}
                onPressEnter={this.handlePressEnter}
                value={searchKeyword}
                size="large"
                allowClear
                style={{ borderRadius: '8px' }}
              />
            
            </div>

            {/* 列表标题：显示当前一级服务名称 */}
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#262626',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{currentService.name} 服务列表</span>
              <Tag style={{ margin: 0, fontSize: '12px', borderRadius: '4px' }}>{services.length}</Tag>
            </div>

            <Divider style={{ margin: '0 0 12px 0', borderColor: '#f0f0f0' }} />

            {/* 服务列表 */}
            <Spin spinning={loading} size="medium">
              {services.length > 0 ? (
                <div>
                  {services.map(item => (
                    <div
                      key={item.id}
                      onClick={() => this.handleSelectService(item)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        border: selectedService?.id === item.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                        background: selectedService?.id === item.id ? '#f0f7ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedService?.id === item.id ? '0 2px 8px rgba(24,144,255,0.15)' : '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        {/* 服务名称 */}
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: selectedService?.id === item.id ? '#1890ff' : '#262626',
                          marginBottom: '4px'
                        }}>
                          {item.name}
                        </div>
                        {/* 服务描述 */}
                        <div style={{
                          fontSize: '12px',
                          color: '#8c8c8c',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.description}
                        </div>
                        {/* 分类标签和版本号 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tag
                            color={item.category === '核心服务' ? 'blue' : 'green'}
                            style={{ margin: 0, fontSize: '11px', borderRadius: '4px' }}
                          >
                            {item.category}
                          </Tag>
                          <span style={{
                            fontSize: '11px',
                            color: '#52c41a',
                            background: '#f6ffed',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            {item.version}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  description={
                    searchKeyword ? (
                      <span style={{ color: '#8c8c8c' }}>搜索为空</span>
                    ) : allServicesList.length > 0 ? (
                      <span style={{ color: '#8c8c8c' }}>输入关键字搜索服务</span>
                    ) : (
                      <div>
                        <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>当前服务单元暂无数据</div>
                        <Button
                          type="link"
                          icon={<SwapOutlined />}
                          onClick={this.showModuleModal}
                          style={{ padding: 0, color: '#1890ff' }}
                        >
                          切换服务单元
                        </Button>
                      </div>
                    )
                  }
                  style={{ padding: '40px 0' }}
                />
              )}
            </Spin>
          </div>

          {/* ============ 拖拽分割条 ============ */}
          <div
            onMouseDown={this.handleMouseDown}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '48px',
              background: isDragging ? '#1890ff' : '#e8e8e8',
              borderRadius: '2px',
              transition: 'background 0.2s',
            }} />
          </div>

          {/* ============ 右侧面板：详情展示 ============ */}
          <div style={{
            flex: 1,
            background: '#fff',
            borderRadius: '0 12px 12px 0',
            padding: '20px',
            overflow: 'auto',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            {/* 已选中服务：显示详情 */}
            {selectedService ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 标题栏 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '4px',
                    height: '20px',
                    background: '#1890ff',
                    borderRadius: '2px'
                  }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                    {selectedService.name}
                  </h3>
                  <Tag color="blue" style={{ margin: 0 }}>{selectedService.category}</Tag>
                </div>

                <Divider style={{ margin: '0 0 16px 0', borderColor: '#f0f0f0' }} />

                {/* 标签页：链路详情、功能详情 */}
                <Tabs
                  defaultActiveKey="details"
                  style={{ flex: 1 }}
                  tabBarStyle={{ marginBottom: '16px' }}
                  items={[
                    {
                      key: 'details',
                      label: '链路详情',
                      children: (
                        <div style={{ padding: '4px 0' }}>
                          {/* 基本信息区块 */}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#262626',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ width: '4px', height: '4px', background: '#1890ff', borderRadius: '50%' }} />
                            基本信息
                          </div>

                          {/* 信息网格：两列布局 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div style={{
                              background: '#fafafa',
                              padding: '16px',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>服务名称</div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>{selectedService.name}</div>
                            </div>
                            <div style={{
                              background: '#fafafa',
                              padding: '16px',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>服务编码</div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>{selectedService.id}</div>
                            </div>
                            <div style={{
                              background: '#fafafa',
                              padding: '16px',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>服务分类</div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>{selectedService.category}</div>
                            </div>
                            <div style={{
                              background: '#fafafa',
                              padding: '16px',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>版本号</div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#52c41a' }}>{selectedService.version}</div>
                            </div>
                          </div>

                          {/* 服务调用链路区块 */}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#262626',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ width: '4px', height: '4px', background: '#1890ff', borderRadius: '50%' }} />
                            服务调用链路
                          </div>
                          {/* 链路图占位区域 */}
                          <div style={{
                            background: '#fafafa',
                            border: '1px dashed #d9d9d9',
                            borderRadius: '8px',
                            padding: '48px',
                            textAlign: 'center',
                            color: '#bfbfbf',
                            fontSize: '14px'
                          }}>
                            <div style={{ marginBottom: '8px', fontSize: '24px' }}>🔗</div>
                            链路图展示区域
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'features',
                      label: '功能详情',
                      children: (
                        <div style={{ padding: '4px 0' }}>
                          {/* 功能特性区块 */}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#262626',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ width: '4px', height: '4px', background: '#1890ff', borderRadius: '50%' }} />
                            功能特性
                          </div>

                          {/* 功能描述卡片 */}
                          <div style={{
                            background: '#fafafa',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '13px',
                            lineHeight: '1.8',
                            color: '#595959',
                            marginBottom: '24px'
                          }}>
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ color: '#262626' }}>核心功能</strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              <li>用户注册登录</li>
                              <li>权限管理</li>
                              <li>数据统计分析</li>
                            </ul>
                            <div style={{ marginBottom: '12px', marginTop: '16px' }}>
                              <strong style={{ color: '#262626' }}>扩展功能</strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              <li>第三方集成</li>
                              <li>自定义配置</li>
                              <li>多语言支��</li>
                            </ul>
                          </div>

                          {/* 技术栈区块 */}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#262626',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ width: '4px', height: '4px', background: '#1890ff', borderRadius: '50%' }} />
                            技术栈
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Tag color="processing" style={{ padding: '4px 12px', fontSize: '13px' }}>JavaScript</Tag>
                            <Tag color="processing" style={{ padding: '4px 12px', fontSize: '13px' }}>TypeScript</Tag>
                            <Tag color="success" style={{ padding: '4px 12px', fontSize: '13px' }}>React</Tag>
                            <Tag color="success" style={{ padding: '4px 12px', fontSize: '13px' }}>Ant Design</Tag>
                            <Tag color="warning" style={{ padding: '4px 12px', fontSize: '13px' }}>MySQL</Tag>
                            <Tag color="warning" style={{ padding: '4px 12px', fontSize: '13px' }}>MongoDB</Tag>
                          </div>
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            ) : (
              /* 未选中服务：空状态提示 */
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#bfbfbf'
              }}>
                <div style={{ fontSize: '68px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '24px', color: '#8c8c8c' }}>请选择左侧服务查看详情</div>
              </div>
            )}
          </div>
        </div>

        {/* ============ 切换服务模态框 ============ */}
        <Modal
          title="选择服务"
          open={moduleVisible}
          onCancel={this.hideModuleModal}
          footer={null}
          width={600}
          destroyOnHidden
          styles={{
            body: {
              maxHeight: '60vh',
              overflowY: 'auto',
            }
          }}
        >
          <Spin spinning={loading}>
            <div>
              {this.state.allServices.map(item => (
                <div
                  key={item.code}
                  onClick={() => this.handleSelectModule(item)}
                  style={{
                    padding: '16px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    border: currentService?.code === item.code ? '1px solid #1890ff' : '1px solid #f0f0f0',
                    background: currentService?.code === item.code ? '#f0f7ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    {/* 服务名称 */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: currentService?.code === item.code ? '#1890ff' : '#262626',
                    }}>
                      {item.name}
                    </div>
                    {/* 服务编码 */}
                    <div style={{
                      fontSize: '12px',
                      color: '#8c8c8c',
                      marginTop: '4px'
                    }}>
                      Code: {item.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Spin>
        </Modal>

        {/* ============ 新增业务链路弹窗 ============ */}
        <AddBusinessModal
          visible={this.state.businessModalVisible}
          initialValues={this.state.businessModalInitialValues}
          disabledFields={this.state.businessModalDisabledFields}
          onCancel={this.closeBusinessModal}
          onSubmit={this.handleBusinessSubmit}
        />
      </div>
    );
  }
}

export default AddServicePage;
