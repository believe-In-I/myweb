import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Select, Divider, message, Spin, Typography } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import { generateMermaid } from './simpleConverter';

const { TextArea } = Input;
const { Text } = Typography;

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const SAMPLE_MARKDOWN = `# 项目计划

## 阶段一：需求分析
- 用户调研
- 竞品分析
- 功能规划

## 阶段二：开发
- 前端开发
- 后端开发
- 测试

## 阶段三：上线
- 部署
- 监控
- 维护
`;

export default function MarkdownToMermaidPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [chartType, setChartType] = useState<'mindmap' | 'flowchart'>('mindmap');
  const [direction, setDirection] = useState<'TD' | 'LR'>('TD');
  const [mermaidCode, setMermaidCode] = useState('');
  const [renderKey, setRenderKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateChart = () => {
    setLoading(true);
    try {
      let code = '';
      if (chartType === 'mindmap') {
        code = generateMermaid(markdown, {
          preferredChartType: 'mindmap',
          autoDetect: false,
          includeTextContent: true
        });
      } else {
        code = generateMermaid(markdown, {
          preferredChartType: 'flowchart',
          autoDetect: false,
          includeTextContent: true
        });
      }
      console.log('Generated Mermaid code:', code);
      setMermaidCode(code);
      setRenderKey(prev => prev + 1);
    } catch (error) {
      message.error('转换失败，请检查Markdown格式');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateChart();
  }, []);

  useEffect(() => {
    if (mermaidCode && containerRef.current) {
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
    }
  }, [mermaidCode, renderKey]);

  const handleDownload = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) {
      message.warning('请先生成图表');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <Space>
            <span>Markdown 转 Mermaid 流程图</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 120 }}
              options={[
                { value: 'mindmap', label: '思维导图' },
                { value: 'flowchart', label: '流程图' },
              ]}
            />
            {chartType === 'flowchart' && (
              <Select
                value={direction}
                onChange={setDirection}
                style={{ width: 100 }}
                options={[
                  { value: 'TD', label: '上下' },
                  { value: 'LR', label: '左右' },
                ]}
              />
            )}
            <Button icon={<ReloadOutlined />} onClick={generateChart}>
              生成
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              下载SVG
            </Button>
          </Space>
        }
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左侧：Markdown 输入 */}
          <div style={{ width: '40%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
              <Text strong>Markdown 输入</Text>
            </div>
            <TextArea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              style={{ flex: 1, resize: 'none', fontFamily: 'monospace', fontSize: 13 }}
              placeholder="输入 Markdown 内容..."
            />
          </div>

          {/* 右侧：Mermaid 渲染 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Mermaid 预览</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{chartType === 'mindmap' ? '思维导图' : '流程图'}</Text>
            </div>
            <div
              ref={containerRef}
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                background: '#fff',
              }}
            >
              {loading ? <Spin /> : null}
              {mermaidCode && (
                <pre style={{ 
                  width: '100%', 
                  maxHeight: '150px', 
                  overflow: 'auto',
                  fontSize: 11, 
                  background: '#f5f5f5', 
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 4,
                  fontFamily: 'monospace'
                }}>
                  {mermaidCode}
                </pre>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
