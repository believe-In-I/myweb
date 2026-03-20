/**
 * Clipboard API 测试页面
 *
 * ============================================================================
 * Clipboard API 完整指南
 * ============================================================================
 *
 * Clipboard API 提供了一种安全的方式来读取和写入系统剪贴板。
 * 它允许 Web 应用程序执行复制、剪切和粘贴操作。
 *
 * 核心概念：
 * 1. ClipboardItem - 表示剪贴板中的一个数据项
 * 2. navigator.clipboard - 全局剪贴板访问接口
 * 3. MIME 类型 - 用于指定数据类型（text/html, text/plain 等）
 *
 * 浏览器兼容性：
 * - 现代浏览器（Chrome 66+, Firefox 63+, Safari 13.1+）
 * - 需要 HTTPS 或 localhost 环境
 * - 读取操作需要用户授权
 *
 * ============================================================================
 */

import React, { useState } from 'react';
import { Card, Button, Space, Modal, message, Typography, Divider, Alert, List, Tag, Collapse } from 'antd';
import {
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * ClipboardMenu - 独立的剪贴板测试组件
 * 不依赖编辑器，可独立使用
 */
const ClipboardMenu = () => {
  // 状态管理
  const [modalVisible, setModalVisible] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [contentType, setContentType] = useState(''); // 'html' | 'text'
  const [isLoading, setIsLoading] = useState(false);

  // =========================================================================
  // 复制功能：使用 Clipboard API 写入剪贴板
  // =========================================================================

  /**
   * testCopyRichText - 复制富文本 HTML
   *
   * 原理：
   * 1. 创建包含 HTML 和纯文本两种格式的 ClipboardItem
   * 2. HTML 格式用于在支持富文本的应用中保留样式
   * 3. 纯文本作为降级方案（当目标不支持 HTML 时使用）
   * 4. 调用 navigator.clipboard.write() 写入剪贴板
   *
   * MIME 类型说明：
   * - text/html: 富文本格式，可保留加粗、颜色、链接等样式
   * - text/plain: 纯文本格式，不保留任何样式
   */
  const testCopyRichText = async () => {
    try {
      // 待复制的 HTML 内容，包含多种样式
      const htmlContent = `
        <div>
          <p><strong>这是加粗文字</strong></p>
          <p><em>这是斜体文字</em></p>
          <p><span style="color: #ff4d4f;">这是红色文字</span></p>
          <p><span style="color: #52c41a;">这是绿色文字</span></p>
          <p><span style="font-size: 18px;">这是大号字体</span></p>
          <p><u>这是下划线文字</u></p>
          <p><s>这是删除线文字</s></p>
          <p><a href="https://example.com">这是链接</a></p>
        </div>
      `;

      // 纯文本版本，用于不支持 HTML 的应用
      const plainText = '这是加粗文字\n这是斜体文字\n这是红色文字\n这是绿色文字\n这是大号字体\n这是下划线文字\n这是删除线文字\n这是链接';

      // 创建 ClipboardItem 对象
      // ClipboardItem 是剪贴板数据的基本单位
      // 它的 key 是 MIME 类型，value 是 Blob 对象
      const clipboardItem = new ClipboardItem({
        // 富文本格式：粘贴到 Word、飞书、Notion 等会保留样式
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        // 纯文本格式：作为降级方案，所有应用都支持
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });

      // 使用 Clipboard API 写入剪贴板
      // write() 接受 ClipboardItem 数组，可以同时写入多种格式
      await navigator.clipboard.write([clipboardItem]);

      message.success('富文本已复制到剪贴板！可以去飞书/Word 粘贴试试。');
    } catch (error) {
      // 常见错误处理
      if (error.name === 'NotAllowedError') {
        message.error('没有权限写入剪贴板，请检查浏览器设置');
      } else if (error.name === 'SecurityError') {
        message.error('安全错误：需要 HTTPS 环境或 localhost');
      } else {
        message.error('复制失败: ' + error.message);
      }
      console.error('复制失败:', error);
    }
  };

  /**
   * testCopyCustomHtml - 复制自定义 HTML（卡片样式示例）
   *
   * 演示如何复制带有复杂样式的 HTML 内容
   */
  const testCopyCustomHtml = async () => {
    try {
      // 创建卡片样式的 HTML
      const cardHtml = `
        <div style="border: 2px solid #1890ff; border-radius: 8px; padding: 16px; max-width: 300px; font-family: Arial, sans-serif;">
          <h3 style="color: #1890ff; margin: 0 0 8px 0;">卡片标题</h3>
          <p style="color: #666; margin: 0;">这是一段示例文本，可以包含<strong>加粗</strong>和<em>斜体</em>内容。</p>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
            <span style="background: #e6f7ff; color: #1890ff; padding: 4px 8px; border-radius: 4px; font-size: 12px;">标签</span>
          </div>
        </div>
      `;

      const plainText = '卡片标题\n这是一段示例文本，可以包含加粗和斜体内容。\n标签';

      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([cardHtml], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });

      await navigator.clipboard.write([clipboardItem]);
      message.success('卡片样式已复制！');
    } catch (error) {
      message.error('复制失败: ' + error.message);
    }
  };

  // =========================================================================
  // 读取功能：使用 Clipboard API 读取剪贴板
  // =========================================================================

  /**
   * testReadClipboard - 读取剪贴板内容（完整版）
   *
   * 原理：
   * 1. 调用 navigator.clipboard.read() 获取 ClipboardItem 数组
   * 2. 遍历每个 ClipboardItem，检查其支持的 MIME 类型
   * 3. 使用 item.getType(mimeType) 获取对应类型的 Blob
   * 4. 使用 Blob.text() 将 Blob 转换为字符串
   *
   * 注意：此操作会触发浏览器权限请求
   */
  const testReadClipboard = async () => {
    setIsLoading(true);
    try {
      // 使用 Clipboard API 读取剪贴板
      // read() 返回一个 Promise，解析为 ClipboardItem 数组
      const clipboardItems = await navigator.clipboard.read();

      let htmlContent = '';
      let plainText = '';
      let supportedTypes = [];

      // 遍历剪贴板中的每个数据项
      for (const item of clipboardItems) {
        // item.types 返回该 ClipboardItem 支持的所有 MIME 类型数组
        supportedTypes = [...supportedTypes, ...item.types];
        console.log('支持的 MIME 类型:', item.types);

        // 检查并读取 HTML 格式
        // 大多数现代应用（Office、飞书、网页等）会以 HTML 格式存储富文本
        if (item.types.includes('text/html')) {
          // getType() 方法接受 MIME 类型，返回对应的 Blob 对象
          const htmlBlob = await item.getType('text/html');
          htmlContent = await htmlBlob.text();
          console.log('HTML 内容:', htmlContent);
        }

        // 检查并读取纯文本格式
        // 几乎所有应用都会提供纯文本格式作为降级方案
        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain');
          plainText = await textBlob.text();
        }
      }

      // 优先显示 HTML 内容，如果没有则显示纯文本
      const displayContent = htmlContent || plainText;

      if (displayContent) {
        setPastedContent(displayContent);
        setContentType(htmlContent ? 'html' : 'text');
        setModalVisible(true);
        message.success({
          content: `成功读取剪贴板！检测到类型: ${supportedTypes.join(', ')}`,
          duration: 3,
        });
      } else {
        message.warning('剪贴板中没有可读取的文本内容');
      }
    } catch (error) {
      // 权限错误处理
      if (error.name === 'NotAllowedError') {
        Modal.warning({
          title: '需要剪贴板权限',
          content: '请在浏览器设置中允许访问剪贴板，然后重试。',
        });
      } else if (error.name === 'SecurityError') {
        message.error('安全错误：需要 HTTPS 环境或 localhost');
      } else {
        message.error('读取失败: ' + error.message);
      }
      console.error('读取剪贴板失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * testReadText - 读取纯文本（简化版）
   *
   * readText() 是 read() 的简化版本
   * 优点：更简单，无需处理 Blob 转换
   * 缺点：只能读取纯文本，无法保留格式
   */
  const testReadText = async () => {
    try {
      // readText() 直接返回剪贴板中的纯文本
      // 如果剪贴板中没有文本，会返回空字符串（不会报错）
      const text = await navigator.clipboard.readText();

      if (text) {
        setPastedContent(text);
        setContentType('text');
        setModalVisible(true);
        message.success('成功读取纯文本！');
      } else {
        message.warning('剪贴板中没有文本内容');
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        message.error('请允许访问剪贴板权限');
      } else {
        message.error('读取失败: ' + error.message);
      }
    }
  };

  /**
   * testWriteText - 写入纯文本（简化版）
   *
   * writeText() 是 write() 的简化版本
   * 优点：简单快捷
   * 缺点：只能写入纯文本
   */
  const testWriteText = async () => {
    try {
      const text = '这是一段通过 Clipboard API 写入的纯文本！\n第二行文本\n第三行文本';

      // writeText() 接受一个字符串，直接写入剪贴板
      await navigator.clipboard.writeText(text);

      message.success('纯文本已写入剪贴板！');
    } catch (error) {
      message.error('写入失败: ' + error.message);
    }
  };

  // =========================================================================
  // 辅助功能
  // =========================================================================

  /**
   * 检测浏览器是否支持 Clipboard API
   */
  const checkClipboardSupport = () => {
    const support = {
      clipboard: !!navigator.clipboard,
      clipboardItem: typeof ClipboardItem !== 'undefined',
      read: navigator.clipboard && typeof navigator.clipboard.read === 'function',
      write: navigator.clipboard && typeof navigator.clipboard.write === 'function',
      readText: navigator.clipboard && typeof navigator.clipboard.readText === 'function',
      writeText: navigator.clipboard && typeof navigator.clipboard.writeText === 'function',
    };
    return support;
  };

  const support = checkClipboardSupport();

  // 菜单项配置
  const menuItems = [
    // 第一组：复制功能
    {
      key: 'copy-group',
      type: 'group',
      label: '【复制】写入剪贴板',
      children: [
        {
          key: 'copy-rich-text',
          icon: <CopyOutlined />,
          label: '复制富文本 HTML',
          onClick: testCopyRichText,
        },
        {
          key: 'copy-custom-html',
          icon: <CopyOutlined />,
          label: '复制卡片样式',
          onClick: testCopyCustomHtml,
        },
        {
          key: 'write-text',
          icon: <FileTextOutlined />,
          label: '写入纯文本',
          onClick: testWriteText,
        },
      ],
    },
    // 第二组：读取功能
    {
      key: 'read-group',
      type: 'group',
      label: '【读取】从剪贴板读取',
      children: [
        {
          key: 'read-html',
          icon: <CloudDownloadOutlined />,
          label: '读取完整内容（含 HTML）',
          onClick: testReadClipboard,
        },
        {
          key: 'read-text',
          icon: <FileTextOutlined />,
          label: '读取纯文本',
          onClick: testReadText,
        },
      ],
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 页面标题 */}
      <Title level={2} style={{ marginBottom: 24 }}>
        <ExperimentOutlined /> Clipboard API 测试
      </Title>

      {/* 功能说明 */}
      <Alert
        message="Clipboard API 使用说明"
        description={
          <div>
            <Paragraph>
              Clipboard API 允许 Web 应用读取和写入系统剪贴板，支持富文本格式。
            </Paragraph>
            <List
              size="small"
              dataSource={[
                '写入：使用 ClipboardItem 对象，可同时提供 HTML 和纯文本两种格式',
                '读取：read() 可获取完整数据，readText() 获取纯文本',
                '权限：写入通常无需授权，读取需要用户授权',
                '环境：需要 HTTPS 或 localhost 环境',
              ]}
              renderItem={(item) => <List.Item style={{ padding: '4px 0' }}>{item}</List.Item>}
            />
          </div>
        }
        type="info"
        style={{ marginBottom: 24 }}
      />

      {/* 浏览器支持检测 */}
      <Card title="浏览器支持检测" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Tag icon={support.clipboard ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.clipboard ? 'success' : 'error'}>
            navigator.clipboard: {support.clipboard ? '✓ 支持' : '✗ 不支持'}
          </Tag>
          <Tag icon={support.clipboardItem ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.clipboardItem ? 'success' : 'error'}>
            ClipboardItem: {support.clipboardItem ? '✓ 支持' : '✗ 不支持'}
          </Tag>
          <Tag icon={support.read ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.read ? 'success' : 'default'}>
            clipboard.read(): {support.read ? '✓' : '✗'}
          </Tag>
          <Tag icon={support.write ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.write ? 'success' : 'default'}>
            clipboard.write(): {support.write ? '✓' : '✗'}
          </Tag>
          <Tag icon={support.readText ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.readText ? 'success' : 'default'}>
            clipboard.readText(): {support.readText ? '✓' : '✗'}
          </Tag>
          <Tag icon={support.writeText ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={support.writeText ? 'success' : 'default'}>
            clipboard.writeText(): {support.writeText ? '✓' : '✗'}
          </Tag>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <Card title="操作菜单" style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Button icon={<CopyOutlined />} onClick={testCopyRichText}>
            复制富文本
          </Button>
          <Button icon={<CopyOutlined />} onClick={testCopyCustomHtml}>
            复制卡片样式
          </Button>
          <Button icon={<FileTextOutlined />} onClick={testWriteText}>
            写入纯文本
          </Button>
          <Button
            icon={<CloudDownloadOutlined />}
            onClick={testReadClipboard}
            loading={isLoading}
            type="primary"
          >
            读取剪贴板
          </Button>
          <Button icon={<FileTextOutlined />} onClick={testReadText}>
            读取纯文本
          </Button>
        </Space>
      </Card>

      {/* 代码示例 */}
      <Card title="代码示例">
        <Collapse defaultActiveKey={['write', 'read']}>
          <Panel header="复制富文本 HTML" key="write">
            <Paragraph>
              <Text type="secondary">
                使用 ClipboardItem 同时提供 HTML 和纯文本格式，确保最大兼容性。
              </Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
{`const htmlContent = '<strong>加粗</strong> 和 <span style="color:red">红字</span>';
const plainText = '加粗 和 红字';

const clipboardItem = new ClipboardItem({
  'text/html': new Blob([htmlContent], { type: 'text/html' }),
  'text/plain': new Blob([plainText], { type: 'text/plain' }),
});

await navigator.clipboard.write([clipboardItem]);`}
            </pre>
          </Panel>

          <Panel header="读取剪贴板内容" key="read">
            <Paragraph>
              <Text type="secondary">
                读取时需要检查支持的 MIME 类型，然后获取对应格式的数据。
              </Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
{`// 读取完整内容（含 HTML）
const items = await navigator.clipboard.read();

for (const item of items) {
  console.log('支持类型:', item.types);

  if (item.types.includes('text/html')) {
    const blob = await item.getType('text/html');
    const html = await blob.text();
    console.log('HTML:', html);
  }

  if (item.types.includes('text/plain')) {
    const blob = await item.getType('text/plain');
    const text = await blob.text();
    console.log('纯文本:', text);
  }
}

// 简化版 - 只读纯文本
const text = await navigator.clipboard.readText();`}
            </pre>
          </Panel>

          <Panel header="ClipboardItem 原理" key="原理">
            <Paragraph>
              <Text type="secondary">
                ClipboardItem 是 Clipboard API 的核心数据结构，用于在剪贴板中存储数据。
              </Text>
            </Paragraph>
            <List
              size="small"
              bordered
              dataSource={[
                'ClipboardItem 构造函数接受一个对象，key 是 MIME 类型字符串',
                'value 是 Blob 对象，必须与指定的 MIME 类型匹配',
                '常见的 MIME 类型：text/html, text/plain, image/png, image/jpeg',
                '可以同时提供多种格式，目标应用会选择最适合的格式',
                '写入时通常不需要权限（Firefox 可能需要）',
                '读取时需要用户授权，浏览器会弹出权限提示',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Panel>
        </Collapse>
      </Card>

      {/* 读取结果模态框 */}
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined />
            剪贴板内容
            <Tag color={contentType === 'html' ? 'blue' : 'default'}>
              {contentType === 'html' ? 'HTML' : '纯文本'}
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* HTML 源码 */}
          {contentType === 'html' && (
            <div>
              <Text strong>HTML 源码：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: 12,
                }}
              >
                {pastedContent}
              </pre>
            </div>
          )}

          {/* 渲染预览 */}
          <div>
            <Text strong>渲染效果：</Text>
            <div
              style={{
                background: '#fff',
                padding: 16,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                minHeight: 60,
              }}
              dangerouslySetInnerHTML={{ __html: pastedContent }}
            />
          </div>

          {/* 纯文本版本 */}
          <div>
            <Text strong>纯文本版本：</Text>
            <div
              style={{
                background: '#fafafa',
                padding: 12,
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {pastedContent.replace(/<[^>]+>/g, '')}
            </div>
          </div>

          <Divider />

          <Text type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined /> 提示：复制其他应用的内容后，再点击"读取剪贴板"按钮
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default ClipboardMenu;
