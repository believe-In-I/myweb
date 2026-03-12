import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { message } from 'antd';

marked.setOptions({
  breaks: true,
  gfm: true
});

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

interface MarkdownRendererProps {
  markdown: string;
  onMermaidClick?: (svg: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown, onMermaidClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      if (!containerRef.current) return;

      try {
        const html = marked.parse(markdown) as string;

        // 先用 dangerouslySetInnerHTML 渲染
        containerRef.current.innerHTML = html;

        const mermaidBlocks = Array.from(containerRef.current.querySelectorAll('.language-mermaid, .mermaid'));

        if (mermaidBlocks.length === 0) return;

        const renderPromises = mermaidBlocks.map(async (block, index) => {
          const el = block as HTMLElement;
          const code = el.textContent || el.innerText || '';
          if (!code.trim()) return;

          el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100px;background:#f5f5f5;border-radius:4px;color:#999;">⏳ 正在渲染图表 ${index + 1}/${mermaidBlocks.length}...</div>`;

          try {
            const id = `mermaid-${Date.now()}-${index}`;
            const { svg } = await mermaid.render(id, code);
            el.innerHTML = svg;

            const svgElement = el.querySelector('svg');
            if (svgElement) {
              (svgElement as unknown as HTMLElement).style.cursor = 'pointer';
              const currentSvg = svg;
              svgElement.addEventListener('click', () => {
                onMermaidClick?.(currentSvg);
              });
            }
          } catch (err) {
            console.error('Mermaid 渲染失败:', err);
            el.innerHTML = `<span style="color:red">图表渲染失败: ${err}</span>`;
          }
        });

        await Promise.all(renderPromises);
      } catch (err) {
        console.error('Markdown 渲染失败:', err);
        message.error('Markdown 解析失败');
      }
    };

    renderMarkdown();
  }, [markdown, onMermaidClick]);

  return <div ref={containerRef} className="markdown-content" />;
};
