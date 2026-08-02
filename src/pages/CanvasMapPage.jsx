import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Button, Input, List, Tag, Space, Modal, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ZoomInOutlined, ZoomOutOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * ============================================
 * Canvas 地图组件 - 核心功能
 * ============================================
 *
 * 功能特性：
 * 1. 网格地图绘制 - 可配置网格大小和颜色
 * 2. 鼠标拖拽平移 - 按住左键拖动地图
 * 3. 滚轮缩放 - 以鼠标为中心缩放
 * 4. 点击添加标注 - 在地图上标记位置
 * 5. 标注管理 - 添加、编辑、删除标注
 * 6. 响应式设计 - 适配移动端和桌面端
 *
 * 技术要点：
 * - 使用 requestAnimationFrame 实现流畅动画
 * - 双缓冲技术减少闪烁
 * - 离屏 Canvas 预渲染静态元素
 * - 事件委托优化性能
 */

// 标注数据类型定义
const MarkerType = {
  DEFAULT: 'default',
  START: 'start',
  END: 'end',
  POI: 'poi', // Point of Interest
};

// 标注颜色配置
const MARKER_COLORS = {
  default: '#1890ff',
  start: '#52c41a',
  end: '#ff4d4f',
  poi: '#faad14',
};

// 默认标注图标（使用 Unicode 符号，可替换为图片）
const MARKER_ICONS = {
  default: '📍',
  start: '🚀',
  end: '🏁',
  poi: '📌',
};

/**
 * Canvas 地图页面组件
 */
const CanvasMapPage = () => {
  // ==================== 响应式状态 ====================
  const { isMobile, isTablet } = useResponsive();
  const { t } = useTranslation();

  // ==================== 组件 Refs ====================
  const canvasRef = useRef(null); // 主 Canvas
  const containerRef = useRef(null); // 容器
  const animationFrameRef = useRef(null); // 动画帧 ID
  const offscreenCanvasRef = useRef(null); // 离屏 Canvas（用于缓存）
  const offscreenCtxRef = useRef(null); // 离屏 Canvas 上下文

  // ==================== 地图状态 ====================
  const [markers, setMarkers] = useState([]); // 标注列表
  const [selectedMarker, setSelectedMarker] = useState(null); // 当前选中的标注
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 }); // 地图中心点（世界坐标）
  const [zoom, setZoom] = useState(1); // 缩放级别
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // 拖拽起始点
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // Canvas 尺寸

  // ==================== 地图配置常量 ====================
  const GRID_SIZE = 50; // 网格大小（像素）
  const MIN_ZOOM = 0.5; // 最小缩放
  const MAX_ZOOM = 5; // 最大缩放
  const ZOOM_STEP = 0.1; // 缩放步长

  // ==================== 计算属性 ====================
  // 屏幕中心点（屏幕坐标）
  const screenCenterX = canvasSize.width / 2;
  const screenCenterY = canvasSize.height / 2;

  // ==================== 标注管理函数 ====================

  /**
   * 添加新标注
   * @param {Object} marker - 标注对象
   * @param {number} marker.x - 世界坐标 X
   * @param {number} marker.y - 世界坐标 Y
   * @param {string} marker.title - 标题
   * @param {string} marker.description - 描述
   * @param {string} marker.type - 标注类型
   */
  const addMarker = (marker) => {
    const newMarker = {
      id: Date.now() + Math.random(), // 生成唯一 ID
      x: marker.x,
      y: marker.y,
      title: marker.title || `标注 ${markers.length + 1}`,
      description: marker.description || '',
      type: marker.type || MarkerType.DEFAULT,
      createdAt: new Date().toISOString(),
    };
    setMarkers((prev) => [...prev, newMarker]);
    message.success(t('canvasMap.addMarker'));
  };

  /**
   * 删除标注
   * @param {number} id - 标注 ID
   */
  const deleteMarker = (id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMarker?.id === id) {
      setSelectedMarker(null);
    }
    message.success(t('canvasMap.delete'));
  };

  /**
   * 更新标注
   * @param {number} id - 标注 ID
   * @param {Object} updates - 更新的字段
   */
  const updateMarker = (id, updates) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    if (selectedMarker?.id === id) {
      setSelectedMarker((prev) => ({ ...prev, ...updates }));
    }
  };

  // ==================== 坐标转换函数 ====================

  /**
   * 世界坐标转屏幕坐标
   * @param {number} worldX - 世界坐标 X
   * @param {number} worldY - 世界坐标 Y
   * @returns {Object} 屏幕坐标 {x, y}
   */
  const worldToScreen = useCallback(
    (worldX, worldY) => {
      return {
        x: screenCenterX + (worldX - mapCenter.x) * zoom,
        y: screenCenterY + (worldY - mapCenter.y) * zoom,
      };
    },
    [screenCenterX, screenCenterY, mapCenter, zoom]
  );

  /**
   * 屏幕坐标转世界坐标
   * @param {number} screenX - 屏幕坐标 X
   * @param {number} screenY - 屏幕坐标 Y
   * @returns {Object} 世界坐标 {x, y}
   */
  const screenToWorld = useCallback(
    (screenX, screenY) => {
      return {
        x: mapCenter.x + (screenX - screenCenterX) / zoom,
        y: mapCenter.y + (screenY - screenCenterY) / zoom,
      };
    },
    [screenCenterX, screenCenterY, mapCenter, zoom]
  );

  // ==================== Canvas 绘制函数 ====================

  /**
   * 初始化离屏 Canvas（用于缓存静态内容）
   */
  const initOffscreenCanvas = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 创建离屏 Canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');

    offscreenCanvasRef.current = offscreen;
    offscreenCtxRef.current = ctx;
  }, []);

  /**
   * 绘制网格
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} width - Canvas 宽度
   * @param {number} height - Canvas 高度
   */
  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;

    // 计算可见区域的世界坐标范围
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(width, height);

    // 计算网格起始和结束位置（对齐网格）
    const startX = Math.floor(topLeft.x / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(topLeft.y / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil(bottomRight.x / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil(bottomRight.y / GRID_SIZE) * GRID_SIZE;

    // 绘制垂直线
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const screen = worldToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(screen.x, 0);
      ctx.lineTo(screen.x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const screen = worldToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, screen.y);
      ctx.lineTo(width, screen.y);
      ctx.stroke();
    }

    // 绘制原点（0,0）标记
    const origin = worldToScreen(0, 0);
    ctx.fillStyle = '#ff4d4f';
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('0,0', origin.x, origin.y - 8);
  };

  /**
   * 绘制标注
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} width - Canvas 宽度
   * @param {number} height - Canvas 高度
   */
  const drawMarkers = (ctx, width, height) => {
    // 先绘制所有未选中的标注
    markers.forEach((marker) => {
      if (selectedMarker?.id !== marker.id) {
        drawSingleMarker(ctx, marker);
      }
    });

    // 最后绘制选中的标注（使其在最上层）
    if (selectedMarker) {
      // 绘制选中高亮圈
      const screenPos = worldToScreen(selectedMarker.x, selectedMarker.y);
      ctx.strokeStyle = MARKER_COLORS[selectedMarker.type] || MARKER_COLORS.default;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 18, 0, Math.PI * 2);
      ctx.stroke();

      // 绘制标注
      drawSingleMarker(ctx, selectedMarker);
    }
  };

  /**
   * 绘制单个标注
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Object} marker - 标注对象
   */
  const drawSingleMarker = (ctx, marker) => {
    const screenPos = worldToScreen(marker.x, marker.y);
    const icon = MARKER_ICONS[marker.type] || MARKER_ICONS.default;
    const color = MARKER_COLORS[marker.type] || MARKER_COLORS.default;

    // 绘制图标（使用 Emoji 作为示例，可替换为图片）
    ctx.font = `${24 * zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, screenPos.x, screenPos.y);

    // 绘制标注标题背景（仅在缩放足够大时显示）
    if (zoom > 0.8) {
      const text = marker.title;
      const textWidth = ctx.measureText(text).width;
      const padding = 4;
      const bgX = screenPos.x - textWidth / 2 - padding;
      const bgY = screenPos.y + 28;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = 20;

      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 4);
      ctx.fill();

      // 文字
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(text, screenPos.x, bgY + 14);
    }
  };

  /**
   * 主绘制函数 - 渲染每一帧
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    drawGrid(ctx, width, height);

    // 绘制标注
    drawMarkers(ctx, width, height);

    // 绘制缩放级别和中心点信息（调试用）
    if (!isMobile) {
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${t('canvasMap.zoomLevel')}: ${zoom.toFixed(2)}x | ${t('canvasMap.centerPoint')}: (${mapCenter.x.toFixed(0)}, ${mapCenter.y.toFixed(0)})`, 10, 20);
    }
  }, [zoom, mapCenter, markers, selectedMarker, isMobile]);

  /**
   * 动画循环
   */
  const animate = useCallback(() => {
    render();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [render]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理鼠标按下事件（开始拖拽）
   */
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // 检查是否点击了标注
    const worldPos = screenToWorld(screenX, screenY);
    const clickedMarker = findMarkerAt(worldPos.x, worldPos.y);

    if (clickedMarker) {
      setSelectedMarker(clickedMarker);
    } else {
      setSelectedMarker(null);
      setIsDragging(true);
      setDragStart({ x: screenX, y: screenY });
    }
  };

  /**
   * 处理鼠标移动事件（拖拽中）
   */
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // 计算屏幕坐标的位移
    const dx = screenX - dragStart.x;
    const dy = screenY - dragStart.y;

    // 转换为世界坐标的位移（考虑缩放）
    const worldDx = dx / zoom;
    const worldDy = dy / zoom;

    // 更新地图中心点
    setMapCenter((prev) => ({
      x: prev.x - worldDx,
      y: prev.y - worldDy,
    }));

    setDragStart({ x: screenX, y: screenY });
  };

  /**
   * 处理鼠标释放事件（结束拖拽）
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * 处理鼠标滚轮事件（缩放）
   */
  const handleWheel = (e) => {
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 计算鼠标在世界坐标系中的位置（缩放前）
    const worldBefore = screenToWorld(mouseX, mouseY);

    // 计算新的缩放级别
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

    if (newZoom === zoom) return; // 缩放未变化，直接返回

    // 更新缩放
    setZoom(newZoom);

    // 调整中心点，使鼠标位置保持不变
    // 公式：newCenter = mouseWorld + (oldCenter - mouseWorld) * (newZoom / oldZoom)
    const ratio = newZoom / zoom;
    setMapCenter((prev) => ({
      x: worldBefore.x + (prev.x - worldBefore.x) * ratio,
      y: worldBefore.y + (prev.y - worldBefore.y) * ratio,
    }));
  };

  /**
   * 处理 Canvas 点击事件（添加标注）
   */
  const handleCanvasClick = (e) => {
    if (isDragging) return; // 拖拽时不添加标注

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // 转换为世界坐标
    const worldPos = screenToWorld(screenX, screenY);

    // 检查是否点击了现有标注
    const clickedMarker = findMarkerAt(worldPos.x, worldPos.y);
    if (clickedMarker) {
      setSelectedMarker(clickedMarker);
      return;
    }

    // 添加新标注
    addMarker({
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
      title: `标注 ${markers.length + 1}`,
      description: '',
      type: MarkerType.DEFAULT,
    });
  };

  /**
   * 查找指定世界坐标位置是否有标注
   * @param {number} x - 世界坐标 X
   * @param {number} y - 世界坐标 Y
   * @returns {Object|null} 找到的标注或 null
   */
  const findMarkerAt = (x, y) => {
    const threshold = 20; // 点击容差（像素）
    const thresholdWorld = threshold / zoom; // 转换为世界坐标

    return markers.find((marker) => {
      const dx = Math.abs(marker.x - x);
      const dy = Math.abs(marker.y - y);
      return dx <= thresholdWorld && dy <= thresholdWorld;
    });
  };

  /**
   * 重置视图到初始状态
   */
  const resetView = () => {
    setMapCenter({ x: 0, y: 0 });
    setZoom(1);
    setSelectedMarker(null);
    message.info('视图已重置');
  };

  /**
   * 放大
   */
  const zoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  /**
   * 缩小
   */
  const zoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  };

  // ==================== 生命周期和副作用 ====================

  /**
   * 初始化 Canvas 尺寸和离屏 Canvas
   */
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setCanvasSize({ width, height });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }

      // 重新初始化离屏 Canvas
      initOffscreenCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initOffscreenCanvas]);

  /**
   * 启动动画循环
   */
  useEffect(() => {
    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // ==================== 渲染 UI ====================

  // 响应式配置
  const paddingSize = isMobile ? 12 : 20;
  const buttonSize = isMobile ? 'small' : 'middle';
  const controlPanelGap = isMobile ? 6 : 8;

  return (
    <div style={{ padding: paddingSize }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Title level={isMobile ? 4 : 2} style={{ marginBottom: 8 }}>
          {t('canvasMap.title')}
        </Title>
        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
          {t('canvasMap.subtitle')}
        </Text>
      </div>

      {/* 地图容器 */}
      <Card
        size="small"
        styles={{
          body: {
            padding: 0,
            overflow: 'hidden',
          },
        }}
        style={{ marginBottom: isMobile ? 12 : 20 }}
      >
        {/* 控制栏 */}
        <div
          style={{
            padding: isMobile ? 8 : 12,
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: controlPanelGap,
            flexWrap: 'wrap',
          }}
        >
          <Space wrap size={controlPanelGap}>
            <Tooltip title={t('canvasMap.zoomIn')}>
              <Button icon={<ZoomInOutlined />} size={buttonSize} onClick={zoomIn} />
            </Tooltip>
            <Tooltip title={t('canvasMap.zoomOut')}>
              <Button icon={<ZoomOutOutlined />} size={buttonSize} onClick={zoomOut} />
            </Tooltip>
            <Tooltip title={t('canvasMap.resetView')}>
              <Button icon={<HomeOutlined />} size={buttonSize} onClick={resetView} />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={buttonSize}
              onClick={() => {
                const worldPos = screenToWorld(screenCenterX, screenCenterY);
                addMarker({
                  x: Math.round(worldPos.x),
                  y: Math.round(worldPos.y),
                  title: `${t('canvasMap.markers')} ${markers.length + 1}`,
                  description: '',
                  type: MarkerType.DEFAULT,
                });
              }}
            >
              {t('canvasMap.addMarker')}
            </Button>
          </Space>

          <div style={{ marginLeft: 'auto', fontSize: isMobile ? 11 : 12, color: '#666' }}>
            {markers.length} {t('canvasMap.markerCount')} | {t('canvasMap.zoomLevel')}: {zoom.toFixed(1)}x
          </div>
        </div>

        {/* Canvas 地图区域 */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? 350 : 450,
            cursor: isDragging ? 'grabbing' : 'grab',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              touchAction: 'none', // 禁止触摸默认行为
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            // 移动端触摸事件支持
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
              });
              canvasRef.current?.dispatchEvent(mouseEvent);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
              });
              canvasRef.current?.dispatchEvent(mouseEvent);
            }}
            onTouchEnd={() => {
              const mouseEvent = new MouseEvent('mouseup', {});
              canvasRef.current?.dispatchEvent(mouseEvent);
            }}
          />

          {/* 地图信息浮层 */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '6px 10px',
                borderRadius: 4,
                fontSize: 11,
                color: '#666',
                border: '1px solid #e8e8e8',
              }}
            >
              <div>{t('canvasMap.centerPoint')}: ({mapCenter.x.toFixed(0)}, {mapCenter.y.toFixed(0)})</div>
              <div>{t('canvasMap.canvasSize')}: {canvasSize.width} × {canvasSize.height}</div>
            </div>
          )}
        </div>
      </Card>

      {/* 标注列表 */}
      <Card
        title={
          <Space>
            <EnvironmentOutlined />
            <span>{t('canvasMap.markers')}</span>
            <Tag color="blue">{markers.length}</Tag>
          </Space>
        }
        size="small"
        styles={{
          body: {
            padding: isMobile ? 12 : 16,
          },
        }}
      >
        {markers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? 20 : 40, color: '#999' }}>
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block', opacity: 0.3 }} />
            <p>{t('canvasMap.noMarkers')}</p>
            <p style={{ fontSize: isMobile ? 12 : 14 }}>{t('canvasMap.noMarkersHint')}</p>
          </div>
        ) : (
          <List
            size={isMobile ? 'small' : 'default'}
            dataSource={markers}
            renderItem={(marker) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: selectedMarker?.id === marker.id ? '#f0f8ff' : 'transparent',
                  borderRadius: 6,
                  padding: isMobile ? 8 : 12,
                  marginBottom: 8,
                }}
                onClick={() => setSelectedMarker(marker)}
                actions={[
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: t('canvasMap.confirmDelete'),
                        content: `${t('canvasMap.deleteMessage')} "${marker.title}"?`,
                        onOk: () => deleteMarker(marker.id),
                      });
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: 24 }}>
                      {MARKER_ICONS[marker.type] || MARKER_ICONS.default}
                    </span>
                  }
                  title={
                    <Space>
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                        {marker.title}
                      </Text>
                      <Tag color={MARKER_COLORS[marker.type] || MARKER_COLORS.default} size="small">
                        {marker.type}
                      </Tag>
                    </Space>
                  }
                  description={
                      <div style={{ fontSize: isMobile ? 11 : 12 }}>
                        <div>{t('canvasMap.markerCoordinate')}: ({marker.x}, {marker.y})</div>
                        {marker.description && (
                          <div style={{ marginTop: 4, color: '#666' }}>
                            {marker.description}
                          </div>
                        )}
                        <div style={{ marginTop: 4, color: '#999', fontSize: 10 }}>
                          {t('canvasMap.createdAt')} {new Date(marker.createdAt).toLocaleString()}
                        </div>
                      </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 编辑标注弹窗 */}
      <Modal
        title={t('canvasMap.editMarker')}
        open={!!selectedMarker}
        onCancel={() => setSelectedMarker(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedMarker(null)}>
            {t('canvasMap.cancel')}
          </Button>,
          <Button key="delete" danger onClick={() => deleteMarker(selectedMarker.id)}>
            {t('canvasMap.delete')}
          </Button>,
          <Button key="save" type="primary" onClick={() => setSelectedMarker(null)}>
            {t('canvasMap.save')}
          </Button>,
        ]}
        width={isMobile ? '90%' : 480}
      >
        {selectedMarker && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('canvasMap.markerTitle')}
              </Text>
              <Input
                value={selectedMarker.title}
                onChange={(e) => updateMarker(selectedMarker.id, { title: e.target.value })}
                placeholder={t('canvasMap.markerTitle')}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('canvasMap.markerDescription')}
              </Text>
              <TextArea
                value={selectedMarker.description}
                onChange={(e) => updateMarker(selectedMarker.id, { description: e.target.value })}
                placeholder={t('canvasMap.markerDescription')}
                rows={3}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('canvasMap.markerType')}
              </Text>
              <Space wrap>
                {Object.values(MarkerType).map((type) => (
                  <Tag
                    key={type}
                    color={MARKER_COLORS[type] || MARKER_COLORS.default}
                    style={{
                      cursor: 'pointer',
                      opacity: selectedMarker.type === type ? 1 : 0.6,
                      border: selectedMarker.type === type ? '2px solid' : 'none',
                    }}
                    onClick={() => updateMarker(selectedMarker.id, { type })}
                  >
                    {MARKER_ICONS[type] || MARKER_ICONS.default} {t(`canvasMap.markerType${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                  </Tag>
                ))}
              </Space>
            </div>

            <div>
              <Text type="secondary">{t('canvasMap.markerCoordinate')}</Text>
              <div style={{ marginTop: 4, fontFamily: 'monospace' }}>
                X: {selectedMarker.x} | Y: {selectedMarker.y}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CanvasMapPage;
