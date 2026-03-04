import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button, Slider, message } from 'antd';

/**
 * Canvas + 瓦片虚拟列表组件
 * 
 * 实现原理：
 * 1. 将大量数据分成多个固定大小的"瓦片"（Tile），每个瓦片包含多个列表项
 * 2. 使用离屏 Canvas 预渲染每个瓦片并缓存起来
 * 3. 滚动时只绘制可见区域内的瓦片，直接复制缓存的图像，避免重复绘制
 * 4. 大幅减少滚动时的重绘开销，提升性能
 * 
 * 适用场景：
 * - 数据量非常大的列表（数万到数十万条）
 * - 需要高帧率滚动的场景
 * - 列表项内容复杂（包含图片、图形等）
 */
const CanvasVirtualListPage = () => {
  // ==================== i18n 翻译函数 ====================
  const { t } = useTranslation();
  
  // ==================== 状态定义 ====================
  
  /** 总数据量 */
  const [dataSize, setDataSize] = useState(10000);
  
  /** 每个瓦片包含的列表项数量（瓦片大小） */
  const [tileSize, setTileSize] = useState(20);
  
  /** 单个列表项的高度（像素） */
  const [itemHeight, setItemHeight] = useState(40);
  
  /** 列表数据数组 */
  const [data, setData] = useState([]);
  
  /** 滚动条位置（距离顶部的像素值） */
  const [scrollTop, setScrollTop] = useState(0);

  // ==================== Ref 定义 ====================
  
  /** Canvas DOM 引用 */
  const canvasRef = useRef(null);
  
  /** 滚动容器 DOM 引用 */
  const containerRef = useRef(null);
  
  /** 外层容器 DOM 引用（用于点击事件坐标计算） */
  const outerContainerRef = useRef(null);
  
  /** 
   * 瓦片缓存容器
   * key: 瓦片索引（tileIndex）
   * value: 离屏 Canvas 对象
   * 
   * 使用 useRef 而非 useState，因为：
   * 1. 缓存数据不需要触发组件重渲染
   * 2. 需要在多个 useEffect 之间共享和修改
   */
  const tileCacheRef = useRef({});

  // ==================== 常量计算 ====================
  
  /** 
   * 单个瓦片的像素高度
   * = 瓦片包含的项数 × 单项高度
   */
  const TILE_PIXEL_HEIGHT = tileSize * itemHeight;
  
  /** 
   * 瓦片总数
   * = 总数据量 ÷ 瓦片大小，向上取整
   */
  const tileCount = Math.ceil(dataSize / tileSize);

  // ==================== 数据生成 ====================
  
  /**
   * 生成模拟数据
   * 在实际应用中，这里可能是从 API 获取数据
   */
  const generateData = () => {
    const newData = [];
    for (let i = 0; i < dataSize; i++) {
      newData.push({
        id: i,                              // 唯一标识
        text: `Item ${i + 1}: This is a test item with some content.`,  // 显示文本
        color: `hsl(${Math.random() * 360}, 70%, 80%)`  // 随机背景色
      });
    }
    return newData;
  };

  // 数据量变化时重新生成数据
  useEffect(() => {
    setData(generateData());
  }, [dataSize]);

  // ==================== 瓦片缓存管理 ====================
  
  /**
   * 清除所有瓦片缓存
   * 当配置参数变化时需要调用
   */
  const clearTileCache = () => {
    tileCacheRef.current = {};
  };

  /**
   * 计算当前可见的瓦片范围
   * 
   * 算法：
   * 1. 根据 scrollTop 计算可见区域起始瓦片
   * 2. 根据容器高度计算可见区域结束瓦片
   * 3. 前后各多渲染 1 个瓦片作为缓冲，避免快速滚动时出现空白
   * 
   * @returns {Object} { startTile, endTile } 可见瓦片的起止索引
   */
  const getVisibleTileRange = () => {
    if (!containerRef.current) {
      return { startTile: 0, endTile: 0 };
    }
    
    // 获取容器可见高度
    const containerHeight = containerRef.current.clientHeight;
    
    // 计算可见区域起始瓦片索引（滚动位置 / 瓦片高度）
    const startTile = Math.max(0, Math.floor(scrollTop / TILE_PIXEL_HEIGHT) - 1);
    
    // 计算可见区域结束瓦片索引
    // (滚动位置 + 容器高度) / 瓦片高度，向上取整
    const endTile = Math.min(
      tileCount,
      Math.ceil((scrollTop + containerHeight) / TILE_PIXEL_HEIGHT) + 1
    );
    
    return { startTile, endTile };
  };

  /**
   * 将指定瓦片渲染到离屏 Canvas 并缓存
   * 
   * 离屏渲染的优势：
   * - 复杂的内容只需绘制一次
   * - 后续滚动直接复制图像，性能极高
   * 
   * @param {number} tileIndex - 瓦片索引
   * @param {Array} tileData - 该瓦片包含的数据
   * @returns {HTMLCanvasElement} 渲染好的离屏 Canvas
   */
  const renderTileToOffscreen = (tileIndex, tileData) => {
    // 1. 创建离屏 Canvas
    const offscreenCanvas = document.createElement('canvas');
    
    // 2. 设置离屏 Canvas 尺寸
    offscreenCanvas.width = containerRef.current?.clientWidth || 800;
    offscreenCanvas.height = TILE_PIXEL_HEIGHT;
    
    // 3. 获取 2D 渲染上下文
    const ctx = offscreenCanvas.getContext('2d');
    
    // 4. 遍历瓦片内的所有数据项进行绘制
    tileData.forEach((item, indexInTile) => {
      // 计算该项在瓦片内的 Y 坐标
      const y = indexInTile * itemHeight;
      
      // 绘制背景色块
      ctx.fillStyle = item.color;
      ctx.fillRect(0, y, offscreenCanvas.width, itemHeight - 1);
      
      // 绘制文字
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.fillText(item.text, 10, y + itemHeight / 2 + 5);
    });
    
    // 5. 缓存到 Ref 中
    tileCacheRef.current[tileIndex] = offscreenCanvas;
    
    return offscreenCanvas;
  };

  // ==================== 瓦片预渲染 ====================
  
  /**
   * 预渲染可见区域内的瓦片
   * 
   * 当滚动位置或数据变化时：
   * 1. 计算可见瓦片范围
   * 2. 对未缓存的瓦片进行离屏渲染
   * 3. 将渲染好的瓦片存入缓存
   */
  useEffect(() => {
    // 数据为空或容器未初始化时跳过
    if (!containerRef.current || data.length === 0) return;

    // 获取可见瓦片范围
    const { startTile, endTile } = getVisibleTileRange();

    // 遍历可见范围内的瓦片
    for (let i = startTile; i < endTile; i++) {
      // 如果该瓦片尚未缓存，则进行渲染
      if (!tileCacheRef.current[i]) {
        // 计算该瓦片包含的数据起始和结束索引
        const start = i * tileSize;
        const end = Math.min(start + tileSize, data.length);
        
        // 提取该瓦片的数据
        const tileData = data.slice(start, end);
        
        // 渲染并缓存
        renderTileToOffscreen(i, tileData);
      }
    }
  }, [
    scrollTop,    // 滚动位置变化
    data,         // 数据变化
    tileSize,     // 瓦片大小变化
    itemHeight,   // 项高度变化
    dataSize      // 总数据量变化
  ]);

  // ==================== 参数重置时清理缓存 ====================
  
  /**
   * 当瓦片大小或项高度变化时，清空缓存
   * 因为尺寸变化后，之前缓存的瓦片尺寸就不正确了
   */
  useEffect(() => {
    clearTileCache();
  }, [tileSize, itemHeight]);

  // ==================== Canvas 尺寸处理 ====================
  
  /**
   * 监听容器尺寸变化，调整主 Canvas 大小
   * 
   * 重要：
   * - Canvas 的 width/height 属性决定画布分辨率
   * - CSS 的 width/height 只决定显示尺寸
   * - 这里设置的是实际分辨率，需要与容器一致
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = outerContainerRef.current;
    
    if (!canvas || !container) return;

    // 调整 Canvas 大小为容器尺寸
    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // 尺寸变化后需要重新渲染所有瓦片
      clearTileCache();
    };

    // 初始化时执行一次
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 组件卸载时移除监听
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==================== 主 Canvas 渲染 ====================
  
  /**
   * 将可见瓦片绘制到主 Canvas 上
   * 
   * 渲染策略：
   * 1. 清空画布
   * 2. 获取可见瓦片范围
   * 3. 遍历可见瓦片，从缓存中取出并绘制到对应位置
   * 
   * 注意：这里使用的是 drawImage 直接复制图像，比重新绘制内容快得多
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container || data.length === 0) return;

    // 获取 2D 渲染上下文
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 获取可见瓦片范围
    const { startTile, endTile } = getVisibleTileRange();
    
    // 容器可见高度（用于裁剪）
    const containerHeight = container.clientHeight;

    // 遍历可见瓦片
    for (let i = startTile; i < endTile; i++) {
      // 从缓存获取瓦片
      const offscreenCanvas = tileCacheRef.current[i];
      
      if (offscreenCanvas) {
        // 计算瓦片在主 Canvas 上的 Y 坐标
        // = 瓦片索引 × 瓦片高度 - 滚动位置
        const tileTop = i * TILE_PIXEL_HEIGHT - scrollTop;
        
        // 边界检查：只绘制在可见区域内的部分
        // 如果瓦片完全在可视区域外，则跳过
        if (tileTop + TILE_PIXEL_HEIGHT > 0 && tileTop < containerHeight) {
          // 将离屏 Canvas 的内容绘制到主 Canvas
          // drawImage 可以接受 9 个参数来实现裁剪，这里简单使用 3 参数版本
          ctx.drawImage(offscreenCanvas, 0, tileTop);
        }
      }
    }
  }, [
    scrollTop,    // 滚动位置变化
    data,         // 数据变化
    tileSize,     // 瓦片大小变化
    itemHeight,   // 项高度变化
    dataSize      // 总数据量变化
  ]);

  // ==================== 事件处理 ====================
  
  /**
   * 处理滚动事件
   * 
   * 注意：这里使用 onScroll 而不是监听 wheel 事件
   * 因为 onScroll 能正确处理所有滚动方式（鼠标滚轮、触摸、键盘等）
   */
  const handleScroll = (e) => {
    // 更新滚动位置状态，触发重新渲染
    setScrollTop(e.target.scrollTop);
  };

  /**
   * 重置滚动位置和缓存
   */
  const handleReset = () => {
    setScrollTop(0);
    clearTileCache();
  };

  /**
   * 手动清除缓存（用于调试）
   */
  const handleClearCache = () => {
    clearTileCache();
    message.success('瓦片缓存已清除');
  };

  /**
   * 处理 Canvas 点击事件
   * 
   * Canvas 本身无法直接给内部元素添加事件，需要：
   * 1. 监听 canvas 的点击事件
   * 2. 根据点击坐标计算点击的是哪个数据项
   * 
   * @param {React.MouseEvent} e - 点击事件对象
   */
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const outerContainer = outerContainerRef.current;
    
    if (!canvas || !container || !outerContainer || data.length === 0) return;

    // 获取点击相对于外层容器的坐标
    const rect = outerContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算点击位置对应的数据项索引
    // 实际 Y 坐标 = canvas Y 坐标 + 滚动位置
    const actualY = y + container.scrollTop;
    
    // 根据 Y 坐标计算点击的是第几项
    const itemIndex = Math.floor(actualY / itemHeight);

    // 检查点击是否在有效范围内
    if (itemIndex >= 0 && itemIndex < data.length) {
      const clickedItem = data[itemIndex];
      console.log('点击了列表项:', clickedItem);
      message.info(`${t('canvasVirtualList.clickedItem')}: ${clickedItem.text}`);
    }
  };

  // ==================== 渲染界面 ====================
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="Canvas + 瓦片虚拟列表">
        {/* 控制面板 */}
        <div style={{ marginBottom: '20px' }}>
          {/* 第一行：数值输入框 */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>数据量:</label>
            <Input
              type="number"
              value={dataSize}
              onChange={(e) => setDataSize(Number(e.target.value))}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <label style={{ marginRight: '10px' }}>瓦片项数:</label>
            <Input
              type="number"
              value={tileSize}
              onChange={(e) => setTileSize(Number(e.target.value))}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <label style={{ marginRight: '10px' }}>项高度:</label>
            <Input
              type="number"
              value={itemHeight}
              onChange={(e) => setItemHeight(Number(e.target.value))}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <Button 
              type="primary" 
              onClick={handleReset} 
              style={{ marginRight: '8px' }}
            >
              重置
            </Button>
            <Button onClick={handleClearCache}>
              清除缓存
            </Button>
          </div>
          
          {/* 第二行：滑块 */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>数据量滑块:</label>
            <Slider
              min={1000}
              max={100000}
              step={1000}
              value={dataSize}
              onChange={setDataSize}
              style={{ width: '300px', marginRight: '10px' }}
            />
            <span>{dataSize} 条</span>
          </div>
        </div>

        {/* 
         * 外层容器：负责定位 Canvas，使 Canvas 固定不随内部滚动而移动
         * 内层容器（真正的滚动容器）只负责滚动占位元素
         */}
        <div
          ref={outerContainerRef}
          style={{
            height: '500px',
            border: '1px solid #ddd',
            position: 'relative', // Canvas 绝对定位的参照
            overflow: 'hidden'    // 自己不滚动，滚动交给内部容器
          }}
          onClick={handleCanvasClick}
        >
          {/* 实际滚动容器 */}
          <div
            ref={containerRef}
            style={{
              height: '100%',
              overflow: 'auto'
            }}
            onScroll={handleScroll}
          >
            {/* 
             * 占位元素
             * 作用：撑起滚动条，使得滚动条的位置和长度与实际内容一致
             * 高度 = 总数据量 × 单项高度
             */}
            <div
              style={{
                height: `${data.length * itemHeight}px`
              }}
            />
          </div>

          {/* 
           * 主 Canvas
           * 固定覆盖在外层容器上，不随内部滚动容器一起滚动
           * pointerEvents: 'none' 让滚动事件穿透到底下的滚动容器
           * 但点击事件会被阻断，所以需要在外层容器单独处理点击
           */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* 性能指标展示 */}
        <div style={{ marginTop: '20px' }}>
          <h3>性能指标</h3>
          <p>总数据量: {dataSize} 条</p>
          <p>瓦片大小: {tileSize} 项/瓦片</p>
          <p>瓦片总数: {tileCount} 个</p>
          <p>项高度: {itemHeight}px</p>
          <p>瓦片像素高度: {TILE_PIXEL_HEIGHT}px</p>
          <p>渲染策略: 离屏 Canvas 缓存瓦片，按需渲染可见瓦片</p>
        </div>
      </Card>
    </div>
  );
};

export default CanvasVirtualListPage;
