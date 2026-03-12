import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

/** 弹窗组件属性 */
interface MermaidPreviewModalProps {
  /** 控制弹窗显示/隐藏 */
  visible: boolean;
  /** SVG 字符串 <svg ...></svg> */
  svg: string;
  /** 关闭弹窗的回调函数 */
  onClose: () => void;
}

/**
 * 下载 SVG 为文件
 * @param svg - SVG 字符串内容
 * @param filename - 下载时的文件名（不含扩展名）
 */
const downloadSVG = (svg: string, filename: string) => {
  // 将 SVG 字符串转换为 Blob 对象
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  // 创建临时 URL 用于下载
  const url = URL.createObjectURL(blob);
  // 创建隐藏的 <a> 标签触发下载
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  // 清理 DOM 和内存
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Mermaid 图表预览弹窗组件 */
export const MermaidPreviewModal: React.FC<MermaidPreviewModalProps> = ({ visible, svg, onClose }) => {
  /** 当前缩放比例 */
  const [scale, setScale] = useState(1);
  /** SVG 当前偏移位置 */
  const [position, setPosition] = useState({ x: 0, y: 0 });
  /** 是否正在拖拽 */
  const [isDragging, setIsDragging] = useState(false);
  /** 记录拖拽开始时的鼠标位置 */
  const dragStart = useRef({ x: 0, y: 0 });

  /** 重置缩放和位置到初始状态 */
  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  /** 鼠标滚轮缩放处理：滚轮向下缩小，向上放大 */
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = useCallback((e) => {
    // deltaY > 0 表示滚轮向下滚动（缩小），否则放大
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    // 限制缩放范围在 0.1 ~ 5 倍之间
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
  }, []);

  /** 鼠标按下开始拖拽 */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // 记录拖拽开始时鼠标相对于当前偏移位置的偏移量
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  /** 鼠标移动时更新偏移位置（实现拖拽效果） */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  /** 鼠标松开结束拖拽 */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 弹窗打开时重置缩放和位置
  useEffect(() => {
    if (visible) {
      resetTransform();
    }
  }, [visible]);

  /** 处理 SVG 下载 */
  const handleDownload = () => {
    try {
      downloadSVG(svg, 'mermaid-chart');
      message.success('SVG 下载成功');
    } catch (err) {
      message.error('SVG 下载失败');
      console.error(err);
    }
  };

  return (
    <Modal
      open={visible}
      footer={null}
      width="80vw"
      style={{ top: '10vh', maxHeight: '80vh', padding: 0 }}
      styles={{ body: { height: '70vh', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' } }}
      onCancel={onClose}
      centered
    >
      {/* 顶部工具栏：缩放按钮和下载按钮 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
      }}>
        <Space>
          <Button size="small" onClick={() => setScale(prev => Math.min(prev * 1.2, 5))}>放大</Button>
          <Button size="small" onClick={() => setScale(prev => Math.max(prev * 0.8, 0.1))}>缩小</Button>
          <Button size="small" onClick={resetTransform}>重置</Button>
        </Space>
        <Space>
          <Button type="primary" size="small" icon={<DownloadOutlined />} onClick={handleDownload}>
            SVG
          </Button>
        </Space>
      </div>

      {/* SVG 预览区域：支持滚轮缩放和拖拽 */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {svg ? (
          <div
            style={{
              // 应用缩放和位移变换
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              // 拖拽时禁用过渡动画以保证实时性，松开后恢复平滑过渡
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              maxWidth: '80vw',
              maxHeight: '70vh',
              width: '100%',
              height: '100%',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
            }}
          >
            {/* 将 SVG 字符串转换为 data URL 显示为图片 */}
            <img
              alt="mermaid-preview"
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                pointerEvents: 'none' // 禁止图片默认的拖拽行为
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div style={{ color: '#999' }}>加载中...</div>
        )}
      </div>
    </Modal>
  );
};
