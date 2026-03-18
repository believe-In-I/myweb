import React, { useState } from 'react';
import { Card, Input, Button, Space, Select, Typography } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import MermaidPreview from './MermaidPreview';

const { TextArea } = Input;
const { Text } = Typography;

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
  const [direction, setDirection] = useState<'TD' | 'LR'>('TD');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
              value={direction}
              onChange={setDirection}
              style={{ width: 100 }}
              options={[
                { value: 'TD', label: '上下' },
                { value: 'LR', label: '左右' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} disabled>
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

          {/* 右侧：Mermaid 预览组件 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Mermaid 预览</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>流程图</Text>
            </div>
            <MermaidPreview
              key={refreshKey}
              markdown={markdown}
              orientation={direction}
              showCode={true}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
