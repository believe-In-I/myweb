import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { marked } from 'marked';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
  loading?: boolean;
  className?: string;
  markdStyle?: React.CSSProperties;
  onMermaidClick?: (svg: string) => void;
}

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
});

// 配置 mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

export default function MarkdownRenderer({ content, loading = false, className = '', markdStyle, onMermaidClick }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;

      const mermaidBlocks = containerRef.current.querySelectorAll('.language-mermaid, .mermaid');
      if (mermaidBlocks.length === 0) return;

      for (let i = 0; i < mermaidBlocks.length; i++) {
        const block = mermaidBlocks[i] as HTMLElement;
        const code = block.textContent || block.innerText || '';
        if (!code.trim()) continue;

        try {
          const id = `mermaid-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(id, code);
          block.innerHTML = svg;
          const svgElement = block.querySelector('svg');
          if (svgElement) {
            (svgElement as unknown as HTMLElement).style.cursor = 'pointer';
            const currentSvg = svg;
            svgElement.addEventListener('click', () => {
              onMermaidClick?.(currentSvg);
            });
          }

        } catch (err) {
          console.error('Mermaid 渲染失败:', err);
          block.innerHTML = `<span style="color:red">图表渲染失败: ${err}</span>`;
        }
      }
    };

    // 等待 DOM 更新后渲染 Mermaid
    const timer = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timer);
  }, [content]);

  // 解析 Markdown
  const renderedHtml = content ? (marked.parse(content) as string) : '';

  return (
    <Spin spinning={loading}>
      <div
        ref={containerRef}
        className={`markdown-renderer ${className}`}
        style={markdStyle}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </Spin>
  );
}
