import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Typography, Avatar, Dropdown, Space, ConfigProvider } from 'antd';
import { HomeOutlined, CodeOutlined, LineChartOutlined, HistoryOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BarsOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ApiTestPage from './pages/ApiTestPage';
import UpdateHistoryPage from './pages/UpdateHistoryPage';
import G6RelationGraphPage from './pages/G6RelationGraph/G6RelationGraph';
import VirtualScrollPage from './pages/VirtualScrollPage';
import ThreeJs from '@/pages/threeJs';
import IndexedDBTestPage from './pages/IndexedDBTestPage';
import CanvasVirtualListPage from './pages/CanvasVirtualListPage'
import TestView from './pages/testView'
import AIChatPage from './pages/AIChatPage';
import LLMAi from './pages/LLMAI'
import MarkdownToMermaidPage from './pages/markdownToMermaid/index.tsx';
import LanguageSwitcher from './components/LanguageSwitcher';



const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 路由配置
const routes = [
  { path: '/', nameKey: 'menu.apiTest', icon: <HomeOutlined /> },
  { path: '/ai-chat', nameKey: 'menu.aiChat', icon: <RobotOutlined /> },
  { path: '/g6-dagre', nameKey: 'menu.g6Relation', icon: <LineChartOutlined /> },
  { path: '/update-history', nameKey: 'menu.updateHistory', icon: <HistoryOutlined /> },
  { path: '/virtual-scroll', nameKey: 'menu.virtualScroll', icon: <BarsOutlined /> },
  { path: '/canvas-virtual-list', nameKey: 'menu.canvasVirtualList', icon: <BarsOutlined /> },
  { path: '/threejs', nameKey: 'menu.threejs', icon: <BarsOutlined /> },
  { path: '/indexeddb-test', nameKey: 'menu.indexeddbTest', icon: <CodeOutlined /> },
  { path: '/test-view', nameKey: 'menu.testView', icon: <CodeOutlined /> },
  { path: '/llm-ai', nameKey: 'menu.llmAi', icon: <CodeOutlined /> },
  { path: '/markdown-to-mermaid', nameKey: 'menu.markdownToMermaid', icon: <BarsOutlined /> },
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
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>{t('breadCrumb.home')}</Breadcrumb.Item>
        <Breadcrumb.Item>
          {t(routes.find(route => route.path === location.pathname)?.nameKey || 'breadCrumb.unknown')}
        </Breadcrumb.Item>
      </Breadcrumb>
      
      {/* 页面内容 */}
      <div style={{height:'calc(100vh - 220px)',overflow:'auto'}}>
        <Routes>
          <Route path="/" element={<ApiTestPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/update-history" element={<UpdateHistoryPage />} />
          <Route path="/g6-dagre" element={<G6RelationGraphPage />} />
          <Route path="/virtual-scroll" element={<VirtualScrollPage />} />
          <Route path="/canvas-virtual-list" element={<CanvasVirtualListPage />} />
          <Route path="/threejs" element={<ThreeJs />} />
          <Route path="/indexeddb-test" element={<IndexedDBTestPage />} />
          <Route path="/test-view" element={<TestView />} />
          <Route path="/llm-ai" element={<LLMAi />} />
          <Route path="/markdown-to-mermaid" element={<MarkdownToMermaidPage />} />
        </Routes>
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
          <span style={{ color: '#666' }}>{t('header.admin')}</span>
          <Dropdown menu={{ items: menu }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default function RouterApp() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 4,
          },
        }}
      >
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
      </ConfigProvider>
    </BrowserRouter>
  );
}
