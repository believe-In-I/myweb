import { useState } from 'react';
import { Card, Space } from 'antd';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MermaidPreviewModal } from './MermaidPreviewModal';
import MarkdownRenderers from '@/components/MarkdownRenderer';

const SAMPLE_MARKDOWN = `# 企业稳定性对比

## 基础信息
| 公司名称 | 成立时间 | 规模 |
| ---- | ---- | ---- |
| 河北氧护盾 | 2019 | 10-20人 |
| 北京斜杠码 | 2025 | ≤10人 |

## 决策流程图
\`\`\`mermaid
graph TD
A[选择公司] --> B{稳定优先?}
B -->|是| C[选氧护盾]
B -->|否| D[选斜杠码]
C --> E[核查社保]
D --> F[核查融资]
E --> G[入职]
F --> H[评估风险]
H -->|风险可控| G
H -->|风险高| I[放弃]
\`\`\`

## 阶段一：方案设计
- 架构选型
- 技术栈评估
- 数据库设计
- 接口规范制定
- 方案评审与确认

## 阶段二：实施
\`\`\`mermaid
gantt
    title 项目实施计划
    dateFormat  YYYY-MM-DD
    section 前期
    需求调研       :a1, 2026-01-01, 10d
    方案设计       :after a1, 5d
    section 开发
    前端开发       :2026-01-16, 30d
    后端开发       :2026-01-16, 25d
    section 测试
    集成测试       :2026-02-15, 10d
    上线部署       :2026-02-25, 5d
\`\`\`
`;

export default function MarkdownPreviewPage() {
  const [markdown] = useState(SAMPLE_MARKDOWN);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSvg, setPreviewSvg] = useState('');

  const handleMermaidClick = (svg: string) => {
    setPreviewSvg(svg);
    setPreviewVisible(true);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <Space>
            <span>Markdown 预览（支持 Mermaid 图表）</span>
          </Space>
        }
        styles={{ body: { flex: 1, overflow: 'auto' } }}
      >
        <div
          style={{
            padding: '16px',
            minHeight: '400px',
            background: '#fff',
            borderRadius: '4px'
          }}
        >
          <MarkdownRenderers content={markdown} onMermaidClick={handleMermaidClick} />
        </div>
      </Card>

      <MermaidPreviewModal
        visible={previewVisible}
        svg={previewSvg}
        onClose={() => setPreviewVisible(false)}
      />
    </div>
  );
}
