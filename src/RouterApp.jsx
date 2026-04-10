import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Typography, Avatar, Dropdown, Space, ConfigProvider, App, Button, message, Drawer } from 'antd';
import { PictureOutlined, CopyOutlined, BoxPlotOutlined, FileDoneOutlined, FileWordOutlined, VideoCameraOutlined, AliwangwangOutlined, CloudUploadOutlined, CodeOutlined, LineChartOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BarsOutlined, MessageOutlined, MenuOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ApiTestPage from './pages/ApiTestPage';
import HeartPage from './pages/HeartPage';
import LovePage from './pages/Love';
import G6RelationGraphPage from './pages/G6RelationGraph/G6RelationGraph';
import VirtualScrollPage from './pages/VirtualScrollPage';
import ThreeJs from '@/pages/threeJs';
import IndexedDBTestPage from './pages/IndexedDBTestPage';
import CanvasVirtualListPage from './pages/CanvasVirtualListPage'
import AIChatPage from './pages/AIChatPage';
import WebSocketChatPage from './pages/WebSocketChatPage';
import MarkdownToMermaidPage from './pages/markdownToMermaid/index.tsx';
import MarkdownPreviewPage from './pages/markdownPreview/index.tsx';
import FeishuEditorPage from './pages/FeishuEditor';
import ClipboardTestPage from './pages/ClipboardTestPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import LoginPage from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { logout, isAuthenticated, getUser } from './utils/auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 移动端断点
const MOBILE_BREAKPOINT = 768;

// 响应式检测 Hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' 
      ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < 992 
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < 992);
    };

    // 初始检测
    handleResize();

    // 添加监听
    window.addEventListener('resize', handleResize);
    
    // 监听屏幕方向变化（移动端横竖屏切换）
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return { isMobile, isTablet };
};

// 路由配置
const routes = [
  { path: '/home/apiTest', nameKey: 'menu.apiTest', icon: <CloudUploadOutlined /> },
  { path: '/home/ai-chat', nameKey: 'menu.aiChat', icon: <AliwangwangOutlined /> },
  { path: '/home/ws-chat', nameKey: 'menu.wsChat', icon: <MessageOutlined /> },
  { path: '/home/g6-dagre', nameKey: 'menu.g6Relation', icon: <LineChartOutlined /> },
  { path: '/home/virtual-scroll', nameKey: 'menu.virtualScroll', icon: <BarsOutlined /> },
  { path: '/home/canvas-virtual-list', nameKey: 'menu.canvasVirtualList', icon: <PictureOutlined /> },
  { path: '/home/threejs', nameKey: 'menu.threejs', icon: <VideoCameraOutlined /> },
  { path: '/home/indexeddb-test', nameKey: 'menu.indexeddbTest', icon: <CodeOutlined /> },
  { path: '/home/markdown-to-mermaid', nameKey: 'menu.markdownToMermaid', icon: <BoxPlotOutlined /> },
  { path: '/home/markdown-preview', nameKey: 'menu.markdownPreview', icon: <FileDoneOutlined /> },
  { path: '/home/feishu-editor', nameKey: 'menu.feishuEditor', icon: <FileWordOutlined /> },
  { path: '/home/clipboard-test', nameKey: 'menu.clipboardTest', icon: <CopyOutlined /> },
];

// 内容区域组件
const ContentArea = ({ isMobile, isTablet }) => {
  const { t } = useTranslation();
  const location = useLocation();

  // 响应式边距和内边距
  const contentMargin = isMobile ? 8 : isTablet ? 16 : 24;
  const contentPadding = isMobile ? 12 : 24;
  const contentHeight = isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 160px)';

  // 获取当前页面名称
  const currentRoute = routes.find(route => route.path === location.pathname);
  const pageName = currentRoute ? t(currentRoute.nameKey) : '';

  return (
    <Content
      style={{
        margin: `${contentMargin}px ${contentMargin}px`,
        padding: contentPadding,
        minHeight: 280,
        background: '#fff',
        borderRadius: isMobile ? '8px' : '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* 移动端顶部标题 */}
      {isMobile && (
        <div style={{
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#333',
          }}>
            {pageName}
          </h2>
        </div>
      )}

      {/* 页面内容 */}
      <div style={{ 
        height: contentHeight, 
        overflow: 'auto',
        // 移动端优化滚动
        ...(isMobile && {
          WebkitOverflowScrolling: 'touch',
        }),
      }}>
        <Outlet />
      </div>
    </Content>
  );
};

// 移动端抽屉菜单组件
const MobileDrawer = ({ visible, onClose, children }) => {
  return (
    <Drawer
      title={
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          导航菜单
        </span>
      }
      placement="left"
      onClose={onClose}
      open={visible}
      width={280}
      styles={{
        body: {
          padding: 0,
        },
        header: {
          background: '#001529',
          borderBottom: '1px solid #1f2f3f',
        },
      }}
      drawerStyle={{
        background: '#001529',
      }}
      closeIcon={
        <span style={{ color: '#fff', fontSize: 18 }}>×</span>
      }
    >
      {children}
    </Drawer>
  );
};

// 移动端侧边栏内容
const MobileSidebar = ({ onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo 区域 */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #1f2f3f',
        }}
      >
        {t('app.title')}
      </div>
      
      {/* 菜单 */}
      <Menu
        mode="inline"
        theme="dark"
        style={{ 
          borderRight: 0, 
          flex: 1,
          overflow: 'auto',
        }}
        selectedKeys={[location.pathname]}
        items={routes.map((route) => ({
          key: route.path,
          icon: route.icon,
          label: (
            <NavLink 
              to={route.path} 
              onClick={onClose}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              {t(route.nameKey)}
            </NavLink>
          ),
        }))}
      />
    </div>
  );
};

// 桌面端侧边栏组件
const DesktopSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={200}
      style={{
        background: '#001529',
        minHeight: '100vh',
        // 响应式侧边栏宽度
      }}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        if (broken) {
          setCollapsed(true);
        }
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #1f2f3f',
          transition: 'font-size 0.2s',
        }}
      >
        {!collapsed && t('app.title')}
        {collapsed && <MenuOutlined />}
      </div>
      <Menu
        mode="inline"
        theme="dark"
        style={{ borderRight: 0 }}
        items={routes.map((route, index) => ({
          key: route.path,
          icon: route.icon,
          label: (
            <NavLink to={route.path} style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'block',
            }}>
              {t(route.nameKey)}
            </NavLink>
          ),
        }))}
      />
    </Sider>
  );
};

// 顶部栏组件
const TopHeader = ({ isMobile, onMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getUser();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const menu = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined /> {t('header.profile')}
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <SettingOutlined /> {t('header.settings')}
        </span>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <LogoutOutlined /> {t('header.logout')}
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  // 获取当前页面名称
  const currentRoute = routes.find(route => route.path === location.pathname);
  const pageName = currentRoute ? t(currentRoute.nameKey) : '';

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: isMobile ? '0 12px' : '0 24px',
        height: isMobile ? 56 : 64,
        lineHeight: isMobile ? '56px' : '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 左侧区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
        {/* 移动端汉堡菜单按钮 */}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 18 }} />}
            onClick={onMenuClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              color: '#333',
            }}
          />
        )}
        
        {/* 系统名称 */}
        <div style={{ 
          fontSize: isMobile ? 16 : 18, 
          fontWeight: 'bold', 
          color: '#1890ff',
          whiteSpace: 'nowrap',
        }}>
          {isMobile ? '' : t('app.systemName')}
        </div>
        
        {/* 面包屑导航 - 桌面端显示 */}
        {!isMobile && (
          <Breadcrumb 
            items={[
              { title: t('breadCrumb.home') },
              { title: pageName },
            ]} 
          />
        )}
      </div>

      {/* 右侧区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
        <Space size={isMobile ? 'small' : 'middle'}>
          <LanguageSwitcher />
          {/* 用户名 - 移动端隐藏 */}
          {!isMobile && (
            <span style={{ color: '#666' }}>{user?.username || t('header.admin')}</span>
          )}
          <Dropdown menu={{ items: menu }} trigger={isMobile ? ['click'] : ['hover']}>
            <Avatar 
              size={isMobile ? 32 : 'small'} 
              icon={<UserOutlined />} 
              style={{ 
                cursor: 'pointer',
                background: '#1890ff',
              }} 
            />
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

// 主应用布局组件
const MainLayout = () => {
  const { isMobile, isTablet } = useResponsive();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 打开抽屉菜单
  const showDrawer = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  // 关闭抽屉菜单
  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const auth = isAuthenticated();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <MobileDrawer visible={drawerVisible} onClose={closeDrawer}>
          <MobileSidebar onClose={closeDrawer} />
        </MobileDrawer>
      )}

      {/* 桌面端侧边栏 */}
      {!isMobile && <DesktopSidebar />}

      {/* 主内容区 */}
      <Layout style={{ 
        flex: 1,
        minWidth: 0, // 防止flex子元素溢出
        transition: 'margin-left 0.2s ease',
      }}>
        {/* 顶部栏 */}
        <TopHeader isMobile={isMobile} onMenuClick={showDrawer} />
        
        {/* 内容区域 */}
        <ContentArea isMobile={isMobile} isTablet={isTablet} />
      </Layout>
    </Layout>
  );
};

export default function RouterApp() {
  return (
    <HashRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 4,
          },
        }}
      >
        <App>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/heart" element={<HeartPage />} />
            <Route path="/love" element={<LovePage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/home/apiTest" replace />} />
              <Route path="/home" element={<Navigate to="/home/apiTest" replace />} />
              <Route path="/home/apiTest" element={
                <ProtectedRoute>
                  <ApiTestPage />
                </ProtectedRoute>
              } />
              <Route path="/home/ai-chat" element={
                <ProtectedRoute>
                  <AIChatPage />
                </ProtectedRoute>
              } />
              <Route path="/home/ws-chat" element={
                <ProtectedRoute>
                  <WebSocketChatPage />
                </ProtectedRoute>
              } />
              <Route path="/home/g6-dagre" element={
                <ProtectedRoute>
                  <G6RelationGraphPage />
                </ProtectedRoute>
              } />
              <Route path="/home/virtual-scroll" element={
                <ProtectedRoute>
                  <VirtualScrollPage />
                </ProtectedRoute>
              } />
              <Route path="/home/canvas-virtual-list" element={
                <ProtectedRoute>
                  <CanvasVirtualListPage />
                </ProtectedRoute>
              } />
              <Route path="/home/threejs" element={
                <ProtectedRoute>
                  <ThreeJs />
                </ProtectedRoute>
              } />
              <Route path="/home/indexeddb-test" element={
                <ProtectedRoute>
                  <IndexedDBTestPage />
                </ProtectedRoute>
              } />


              <Route path="/home/markdown-to-mermaid" element={
                <ProtectedRoute>
                  <MarkdownToMermaidPage />
                </ProtectedRoute>
              } />
              <Route path="/home/markdown-preview" element={
                <ProtectedRoute>
                  <MarkdownPreviewPage />
                </ProtectedRoute>
              } />
              <Route path="/home/feishu-editor" element={
                <ProtectedRoute>
                  <FeishuEditorPage />
                </ProtectedRoute>
              } />
              <Route path="/home/clipboard-test" element={
                <ProtectedRoute>
                  <ClipboardTestPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </App>
      </ConfigProvider>
    </HashRouter>
  );
}
