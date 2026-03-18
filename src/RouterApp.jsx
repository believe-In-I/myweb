import React, { useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Typography, Avatar, Dropdown, Space, ConfigProvider, App, Button, message } from 'antd';
import { HomeOutlined, CodeOutlined, LineChartOutlined, HistoryOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BarsOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ApiTestPage from './pages/ApiTestPage';
import UpdateHistoryPage from './pages/UpdateHistoryPage';
import G6RelationGraphPage from './pages/G6RelationGraph/G6RelationGraph';
import VirtualScrollPage from './pages/VirtualScrollPage';
import ThreeJs from '@/pages/threeJs';
import IndexedDBTestPage from './pages/IndexedDBTestPage';
import CanvasVirtualListPage from './pages/CanvasVirtualListPage'
import AIChatPage from './pages/AIChatPage';
import MarkdownToMermaidPage from './pages/markdownToMermaid/index.tsx';
import MarkdownPreviewPage from './pages/markdownPreview/index.tsx';
import FeishuEditorPage from './pages/FeishuEditor';
import LanguageSwitcher from './components/LanguageSwitcher';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { logout, isAuthenticated, getUser } from './utils/auth';



const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 路由配置
const routes = [
  { path: '/home/apiTest', nameKey: 'menu.apiTest', icon: <HomeOutlined /> },
  { path: '/home/ai-chat', nameKey: 'menu.aiChat', icon: <RobotOutlined /> },
  { path: '/home/g6-dagre', nameKey: 'menu.g6Relation', icon: <LineChartOutlined /> },
  { path: '/home/update-history', nameKey: 'menu.updateHistory', icon: <HistoryOutlined /> },
  { path: '/home/virtual-scroll', nameKey: 'menu.virtualScroll', icon: <BarsOutlined /> },
  { path: '/home/canvas-virtual-list', nameKey: 'menu.canvasVirtualList', icon: <BarsOutlined /> },
  { path: '/home/threejs', nameKey: 'menu.threejs', icon: <BarsOutlined /> },
  { path: '/home/indexeddb-test', nameKey: 'menu.indexeddbTest', icon: <CodeOutlined /> },
  { path: '/home/markdown-to-mermaid', nameKey: 'menu.markdownToMermaid', icon: <BarsOutlined /> },
  { path: '/home/markdown-preview', nameKey: 'menu.markdownPreview', icon: <BarsOutlined /> },
  { path: '/home/feishu-editor', nameKey: 'menu.feishuEditor', icon: <BarsOutlined /> },
];

// 内容区域组件
const ContentArea = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Content
      style={{
        margin: '24px 16px',
        padding: 24,
        minHeight: 280,
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: t('breadCrumb.home') },
        { title: t(routes.find(route => route.path === location.pathname)?.nameKey || 'breadCrumb.unknown') },
      ]} />

      {/* 页面内容 */}
      <div style={{height:'calc(100vh - 220px)',overflow:'auto'}}>
        <Outlet />
      </div>

    </Content>
  );
};

// 侧边栏组件
const Sidebar = () => {
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
      }}
    >
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
        {!collapsed && t('app.title')}
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
const TopHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getUser();
  
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
  
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '0 24px',
        height: 64,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
        {t('app.systemName')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Space size="middle">
          <LanguageSwitcher />
          <span style={{ color: '#666' }}>{user?.username || t('header.admin')}</span>
          <Dropdown menu={{ items: menu }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

// 主应用布局组件
const MainLayout = () => {
  const auth = isAuthenticated();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar />
      <Layout style={{ flex: 1 }}>
        {/* 顶部栏 */}
        <TopHeader />
        {/* 内容区域 */}
        <ContentArea />
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
              <Route path="/home/update-history" element={
                <ProtectedRoute>
                  <UpdateHistoryPage />
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
            </Route>
          </Routes>
        </App>
      </ConfigProvider>
    </HashRouter>
  );
}
