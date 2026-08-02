import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

interface MarkdownItem {
  name: string;
  path: string;
  title: string;
}

const MarkdownFile = () => {
  const [list, setList] = useState<MarkdownItem[]>([]);
  const [html, setHtml] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. 只请求1个JSON（无并发、无阻塞）
  useEffect(() => {
    fetch('/md-manifest.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setList(data);
        if (data.length > 0) openFile(data[0]);
      })
      .catch(err => {
        console.error('加载文档清单失败:', err);
        // 可以设置一个错误状态，在界面上友好提示
        setList([]);
        // 可选：设置错误信息供 UI 显示
        // setError('文档清单加载失败，请检查 /public/data 目录下是否有 .md 文件，并运行 node scripts/generate-md-manifest.js 生成清单');
      });
  }, []);
  // 2. 打开单个MD
  const openFile = async (item: MarkdownItem) => {
    setLoading(true);
    try {
      const res = await fetch(item.path);
      const text = await res.text();
      setHtml(marked.parse(text) as any);
      setActive(item.path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧列表：1000个全渲染 */}
      <div style={{ width: 260, borderRight: '1px solid #ddd', padding: 16, overflowY: 'auto' }}>
        <h3>文档库</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {list.map(item => (
            <div
              key={item.path}
              onClick={() => openFile(item)}
              style={{
                padding: 8,
                borderRadius: 4,
                cursor: 'pointer',
                background: active === item.path ? '#e8f4ff' : '#fff',
              }}
            >
              {item.title}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {loading && <div>加载中...</div>}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default MarkdownFile;