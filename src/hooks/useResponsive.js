import { useState, useEffect } from 'react';

// 移动端断点
export const BREAKPOINTS = {
  xs: 480,   // 超小屏幕 - 大屏手机
  sm: 576,   // 小屏幕 - 手机
  md: 768,   // 中等屏幕 - 平板
  lg: 992,    // 大屏幕 - 小笔记本
  xl: 1200,   // 超大屏幕 - 桌面
  xxl: 1600,  // 极大屏幕
};

// 响应式检测 Hook
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < BREAKPOINTS.md);
      setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg);
      setIsDesktop(width >= BREAKPOINTS.md);
    };

    // 初始检测
    handleResize();

    // 添加监听
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    ...screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isXs: screenSize.width < BREAKPOINTS.xs,
    isSm: screenSize.width >= BREAKPOINTS.xs && screenSize.width < BREAKPOINTS.sm,
    isLg: screenSize.width >= BREAKPOINTS.lg,
    isXl: screenSize.width >= BREAKPOINTS.xl,
  };
};

export default useResponsive;

// 响应式样式工具函数
export const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
  if (typeof window === 'undefined') return desktopValue;
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.md) return mobileValue;
  if (width < BREAKPOINTS.lg) return tabletValue;
  return desktopValue;
};

// 响应式内边距
export const getResponsivePadding = () => {
  if (typeof window === 'undefined') return 20;
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.xs) return 8;
  if (width < BREAKPOINTS.sm) return 10;
  if (width < BREAKPOINTS.md) return 12;
  if (width < BREAKPOINTS.lg) return 16;
  return 20;
};

// 响应式外边距
export const getResponsiveMargin = () => {
  if (typeof window === 'undefined') return 20;
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.md) return 8;
  return 20;
};

// 响应式 Modal 宽度
export const getResponsiveModalWidth = (defaultWidth = 520) => {
  if (typeof window === 'undefined') return defaultWidth;
  
  const width = window.innerWidth;
  const maxWidth = width - 32; // 两侧各留 16px
  
  return Math.min(defaultWidth, maxWidth);
};

// 响应式聊天消息最大宽度
export const getResponsiveChatMaxWidth = (defaultPercent = 70) => {
  if (typeof window === 'undefined') return `${defaultPercent}%`;
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.sm) return '85%';
  if (width < BREAKPOINTS.md) return '80%';
  if (width < BREAKPOINTS.lg) return '75%';
  return `${defaultPercent}%`;
};

// 响应式表格列宽
export const getResponsiveTableColumns = (columns, isMobile) => {
  if (!isMobile) return columns;
  
  // 移动端简化列，只显示关键信息
  return columns.filter(col => 
    ['preview', 'name', 'size', 'action'].includes(col.key) ||
    ['key', 'name'].includes(col.dataIndex)
  ).map(col => {
    if (col.key === 'action') {
      return {
        ...col,
        width: 100,
        title: '操作',
      };
    }
    if (col.dataIndex === 'key' || col.key === 'name') {
      return {
        ...col,
        ellipsis: true,
      };
    }
    return {
      ...col,
      width: undefined,
    };
  });
};
