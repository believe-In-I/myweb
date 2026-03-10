import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, message, Button, Space, Dropdown } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, FullscreenOutlined, FullscreenExitOutlined, DownloadOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import { generateMermaid } from './simpleConverter';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export interface MermaidPreviewProps {
  /** 输入的 Markdown 文本内容 */
  markdown: string;
  /** 图表类型，目前仅支持 flowchart */
  chartType?: 'flowchart';
  /** 流程图方向：TD（从上到下）或 LR（从左到右） */
  direction?: 'TD' | 'LR';
  /** 是否在预览下方显示生成的 Mermaid 代码 */
  showCode?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示缩放控制按钮 */
  showZoomControls?: boolean;
  /** 是否显示全屏和下载按钮 */
  showActions?: boolean;
}

/**
 * Mermaid 预览组件
 * 接收 markdown 和图表类型，自动转换为 Mermaid 并渲染
 * 支持缩放和平移
 */
export default function MermaidPreview({
  markdown,
  chartType = 'flowchart',
  direction = 'TD',
  showCode = false,
  style,
  showZoomControls = true,
  showActions = true
}: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 生成 Mermaid 代码
  useEffect(() => {
    if (!markdown) {
      setMermaidCode('');
      return;
    }

    setLoading(true);
    try {
      const code = generateMermaid(markdown, {
        preferredChartType: chartType,
        autoDetect: false,
        includeTextContent: true,
        direction: direction
      });
      setMermaidCode(code);
      // 重置缩放和位置
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } catch (error) {
      message.error('转换失败，请检查Markdown格式');
      console.error(error);
      setMermaidCode('');
    } finally {
      setLoading(false);
    }
  }, [markdown, chartType, direction]);

  // 渲染图表
  useEffect(() => {
    if (!mermaidCode || !containerRef.current) return;

    const renderChart = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        containerRef.current!.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        // 尝试降级渲染
        try {
          containerRef.current!.innerHTML = `<div class="mermaid" id="fallback">${mermaidCode}</div>`;
          await mermaid.run({ nodes: [containerRef.current!] });
        } catch (fallbackErr) {
          console.error('Fallback render also failed:', fallbackErr);
          message.error('图表渲染失败');
        }
      }
    };

    renderChart();
  }, [mermaidCode]);

  // 缩放操作
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.05, 3));
    } else {
      setScale(prev => Math.max(prev - 0.05, 0.3));
    }
  }, []);

  // 拖拽平移
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 下载 SVG
  const handleDownloadSvg = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) {
      message.error('没有可下载的图表');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('SVG 下载成功');
  }, []);

  // 下载 PNG
  const handleDownloadPng = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) {
      message.error('没有可下载的图表');
      return;
    }

    // 克隆 SVG 并设置明确的尺寸
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    const bbox = svgEl.getBBox();
    const viewBox = clonedSvg.getAttribute('viewBox');

    // 如果有 viewBox，使用它；否则使用 getBBox 获取的尺寸
    let width = bbox.width;
    let height = bbox.height;

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      width = vbWidth || width;
      height = vbHeight || height;
    }

    // 确保尺寸有效
    if (!width || !height || width <= 0 || height <= 0) {
      width = 800;
      height = 600;
    }

    // 添加边距
    const padding = 20;
    width += padding * 2;
    height += padding * 2;

    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));
    clonedSvg.setAttribute('x', String(padding));
    clonedSvg.setAttribute('y', String(padding));

    // 设置 XML 命名空间
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const pixelRatio = 2; // 2倍清晰度
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        message.error('Canvas创建失败');
        return;
      }

      // 白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(pixelRatio, pixelRatio);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          message.error('PNG生成失败');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flowchart-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        message.success('PNG 下载成功');
      }, 'image/png');
    };

    img.onerror = () => {
      message.error('图片加载失败');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      {/* 缩放控制栏 */}
      {showZoomControls && (
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa'
        }}>
          <Space>
            <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            <span style={{ minWidth: 50, textAlign: 'center', fontSize: 12 }}>
              {Math.round(scale * 100)}%
            </span>
            <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            <Button size="small" icon={<ExpandOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
          {showActions && (
            <Space>
              <Button
                size="small"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? '退出全屏' : '全屏'}
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'svg',
                      label: '下载 SVG',
                      onClick: handleDownloadSvg,
                    },
                    {
                      key: 'png',
                      label: '下载 PNG',
                      onClick: handleDownloadPng,
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button size="small" icon={<DownloadOutlined />}>
                  下载
                </Button>
              </Dropdown>
            </Space>
          )}
        </div>
      )}

      {loading ? <Spin /> : null}

      {/* SVG 容器 - 支持缩放和平移 */}
      <div
        ref={svgContainerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: isFullscreen ? '#fff' : 'transparent',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>

      {showCode && mermaidCode && (
        <pre style={{
          width: '100%',
          maxHeight: '150px',
          overflow: 'auto',
          fontSize: 11,
          background: '#f5f5f5',
          padding: 8,
          marginBottom: 0,
          borderRadius: 0,
          fontFamily: 'monospace',
          borderTop: '1px solid #eee'
        }}>
          {mermaidCode}
        </pre>
      )}
    </div>
  );
}
