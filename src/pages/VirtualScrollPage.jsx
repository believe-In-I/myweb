import React, { useState, useRef, useEffect, useMemo } from 'react';
import { List, Typography, Spin, Input, Space, Button, Card, Tag, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text } = Typography;

/**
 * 虚拟滚动页面组件
 * 功能：高效处理大量数据的渲染，只渲染可视区域内的内容
 */
export default function VirtualScrollPage() {
  // 响应式状态
  const { isMobile, isTablet } = useResponsive();
  
  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [total, setTotal] = useState(10000);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleData, setVisibleData] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(pageSize);
  
  // 引用
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  
  // 生成模拟数据
  const generateMockData = (count) => {
    const mockData = [];
    for (let i = 0; i < count; i++) {
      mockData.push({
        id: i + 1,
        name: `用户 ${i + 1}`,
        email: `user${i + 1}@example.com`,
        phone: `1380013800${i % 10}`,
        address: `北京市朝阳区建国路 ${i + 1} 号`,
        status: ['active', 'inactive', 'pending'][i % 3],
        role: ['admin', 'user', 'guest'][i % 3],
      });
    }
    return mockData;
  };
  
  // 初始化数据
  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      const mockData = generateMockData(total);
      setData(mockData);
      setVisibleData(mockData.slice(0, pageSize));
      setLoading(false);
    }, 1000);
  }, [total]);
  
  // 处理滚动事件
  const handleScroll = () => {
    if (!containerRef.current || !contentRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    setScrollTop(scrollTop);
    
    // 计算可见区域的起始和结束索引
    const itemHeight = 80; // 每个列表项的高度
    const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5); // 提前渲染5个
    const newEndIndex = Math.min(
      total,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + 5 // 延后渲染5个
    );
    
    if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
      setVisibleData(data.slice(newStartIndex, newEndIndex));
    }
  };
  
  // 计算内容高度和偏移量
  const contentStyle = useMemo(() => {
    const itemHeight = 80;
    const totalHeight = total * itemHeight;
    const offsetTop = startIndex * itemHeight;
    
    return {
      height: `${totalHeight}px`,
      position: 'relative',
    };
  }, [total, startIndex]);
  
  const visibleContentStyle = useMemo(() => {
    const itemHeight = 80;
    const offsetTop = startIndex * itemHeight;
    
    return {
      position: 'absolute',
      top: `${offsetTop}px`,
      left: 0,
      right: 0,
    };
  }, [startIndex]);
  
  // 获取状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'active':
        return <Tag color="green">活跃</Tag>;
      case 'inactive':
        return <Tag color="red"> inactive</Tag>;
      case 'pending':
        return <Tag color="orange">待处理</Tag>;
      default:
        return <Tag color="gray">未知</Tag>;
    }
  };
  
  // 获取角色标签
  const getRoleTag = (role) => {
    switch (role) {
      case 'admin':
        return <Tag color="blue">管理员</Tag>;
      case 'user':
        return <Tag color="purple">普通用户</Tag>;
      case 'guest':
        return <Tag color="gray">访客</Tag>;
      default:
        return <Tag color="gray">未知</Tag>;
    }
  };
  
  // 调整每页显示数量
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setEndIndex(size);
    setVisibleData(data.slice(0, size));
  };
  
  // 调整总数据量
  const handleTotalChange = (newTotal) => {
    setTotal(newTotal);
    setLoading(true);
  };
  
  // 响应式配置
  const containerHeight = isMobile ? 400 : 600;
  const paddingSize = isMobile ? 12 : 20;
  const itemHeight = isMobile ? 100 : 80;
  
  return (
    <div style={{ padding: paddingSize }}>
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Title level={isMobile ? 4 : 2} style={{ marginBottom: isMobile ? 8 : 16 }}>虚拟滚动演示</Title>
        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
          本页面展示了虚拟滚动技术，可以高效处理大量数据的渲染，只渲染可视区域内的内容。
          当前总数据量：{total} 条，每页显示：{pageSize} 条
        </Text>
      </div>
      
      {/* 控制区域 */}
      <Card style={{ marginBottom: isMobile ? 12 : 24 }} size="small">
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>总数据量：</Text>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={total === 1000 ? 'primary' : 'default'}
            onClick={() => handleTotalChange(1000)}
          >
            1,000
          </Button>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={total === 10000 ? 'primary' : 'default'}
            onClick={() => handleTotalChange(10000)}
          >
            10,000
          </Button>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={total === 100000 ? 'primary' : 'default'}
            onClick={() => handleTotalChange(100000)}
          >
            100,000
          </Button>
          
          <Divider type="vertical" style={{ margin: isMobile ? '0 4px' : undefined }}/>
          
          <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>每页显示：</Text>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={pageSize === 10 ? 'primary' : 'default'}
            onClick={() => handlePageSizeChange(10)}
          >
            10
          </Button>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={pageSize === 20 ? 'primary' : 'default'}
            onClick={() => handlePageSizeChange(20)}
          >
            20
          </Button>
          <Button 
            size={isMobile ? 'small' : 'middle'}
            type={pageSize === 50 ? 'primary' : 'default'}
            onClick={() => handlePageSizeChange(50)}
          >
            50
          </Button>
        </Space>
      </Card>
      
      {/* 统计信息 */}
      <Card style={{ marginBottom: isMobile ? 12 : 24 }} size="small">
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Text style={{ fontSize: isMobile ? 11 : 14 }}>滚动位置：{Math.round(scrollTop)}px</Text>
          <Text style={{ fontSize: isMobile ? 11 : 14 }}>显示：{visibleData.length}/{total}</Text>
        </Space>
      </Card>
      
      {/* 虚拟滚动容器 */}
      <div
        ref={containerRef}
        style={{
          height: containerHeight,
          overflow: 'auto',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          position: 'relative',
          backgroundColor: '#fafafa',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={handleScroll}
      >
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Spin size="large" description="加载数据中..." />
          </div>
        ) : (
          <div ref={contentRef} style={{
            height: total * itemHeight,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: startIndex * itemHeight,
              left: 0,
              right: 0,
            }}>
              {visibleData.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{
                    margin: isMobile ? '4px' : '8px',
                    borderRadius: '4px',
                    border: '1px solid #e8e8e8',
                    backgroundColor: '#fff',
                  }}
                >
                  {isMobile ? (
                    // 移动端简化布局
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: '50%', 
                        backgroundColor: '#e6f7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                          {getStatusTag(item.status)}
                        </div>
                        <Text style={{ fontSize: 11, color: '#666' }}>{item.email}</Text>
                      </div>
                    </div>
                  ) : (
                    // 桌面端完整布局
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        backgroundColor: '#e6f7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                          {getStatusTag(item.status)}
                          {getRoleTag(item.role)}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#666' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IdcardOutlined style={{ fontSize: 12 }} />
                            <Text>ID: {item.id}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MailOutlined style={{ fontSize: 12 }} />
                            <Text>{item.email}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <PhoneOutlined style={{ fontSize: 12 }} />
                            <Text>{item.phone}</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 性能说明 */}
      <Card style={{ marginTop: isMobile ? 12 : 24 }} size="small">
        <Title level={isMobile ? 5 : 4}>虚拟滚动原理</Title>
        <List
          size="small"
          dataSource={[
            '1. 只渲染可视区域内的数据',
            '2. 计算可见区域的起始和结束索引',
            '3. 使用绝对定位模拟滚动效果',
            '4. 提前和延后渲染数据避免空白',
          ]}
          renderItem={(item, index) => (
            <List.Item style={{ padding: isMobile ? '4px 0' : undefined }}>
              <Text style={{ fontSize: isMobile ? 12 : 14 }}>{item}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
