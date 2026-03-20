/**
 * 剪贴板测试菜单组件
 *
 * ============================================================================
 * 剪贴板 API 详解
 * ============================================================================
 *
 * 1. Clipboard API 概述
 *    - 现代浏览器提供的剪贴板操作 API
 *    - 基于 Promise，使用 async/await
 *    - 需要 HTTPS 环境或 localhost 才能使用
 *
 * 2. ClipboardItem 对象
 *    - 用于写入剪贴板的数据容器
 *    - 可以同时提供多种格式（HTML、纯文本、图片等）
 *    - 构造函数接受一个对象，key 是 MIME 类型，value 是 Blob
 *
 * 3. 常用 MIME 类型
 *    - text/plain: 纯文本
 *    - text/html: HTML 格式内容（保留样式）
 *    - text/rtf: 富文本格式
 *    - image/png/jpeg/gif: 图片数据
 *
 * 4. 权限要求
 *    - 读取剪贴板：需要用户授权（Clipboard API 会自动请求）
 *    - 写入剪贴板：通常不需要授权，但受 CSP 限制
 *
 * ============================================================================
 */

import React, { useState } from 'react';
import { Button, Dropdown, Space, Modal, message, Typography, Divider } from 'antd';
import {
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * 剪贴板测试菜单组件
 *
 * @param {Object} props
 * @param {Object} props.editor - Tiptap 编辑器实例
 */
const ClipboardMenu = ({ editor }) => {
  // 存储粘贴测试结果的模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [pastedContent, setPastedContent] = useState('');

  /**
   * =========================================================================
   * 复制功能：使用 Clipboard API 写入剪贴板
   * =========================================================================
   *
   * write() 方法：
   * - 将数据写入系统剪贴板
   * - 接受 ClipboardItem 数组
   * - 返回 Promise
   * - 需要用户交互触发（如点击按钮）
   */

  /**
   * 测试 1：复制富文本 HTML
   *
   * 原理：
   * 1. 创建包含 HTML 和纯文本两种格式的 ClipboardItem
   * 2. HTML 格式保留富文本样式（加粗、颜色等）
   * 3. 纯文本格式作为降级方案
   * 4. 调用 navigator.clipboard.write() 写入剪贴板
   *
   * 适用场景：
   * - 用户点击按钮复制带格式的内容
   * - 需要在其他应用中粘贴保留样式
   */
  const testCopyRichText = async () => {
    try {
      // 定义要复制的 HTML 内容（带样式）
      const htmlContent = `
        <div>
          <p><strong>这是加粗文字</strong></p>
          <p><em>这是斜体文字</em></p>
          <p><span style="color: #ff4d4f;">这是红色文字</span></p>
          <p><span style="font-size: 18px;">这是大号字体</span></p>
          <p><u>这是下划线文字</u></p>
        </div>
      `;

      // 纯文本版本（不保留格式）
      // 当目标应用不支持 HTML 时，会使用这个作为备选
      const plainText = '这是加粗文字\n这是斜体文字\n这是红色文字\n这是大号字体\n这是下划线文字';

      // 创建 ClipboardItem 对象
      // ClipboardItem 接受一个对象，key 是 MIME 类型，value 是 Blob 对象
      const clipboardItem = new ClipboardItem({
        // text/html: 富文本格式，粘贴到 Word/飞书等会保留样式
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        // text/plain: 纯文本格式，作为降级方案
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });

      // 使用 Clipboard API 写入剪贴板
      // write() 方法会将 ClipboardItem 写入系统剪贴板
      await navigator.clipboard.write([clipboardItem]);

      message.success('富文本已复制到剪贴板！可以粘贴到其他应用试试。');
    } catch (error) {
      // 常见错误：
      // 1. NotAllowedError: 没有权限（需要用户交互）
      // 2. SecurityError: 非安全上下文（需要 HTTPS）
      console.error('复制失败:', error);
      message.error('复制失败: ' + error.message);
    }
  };

  /**
   * 测试 2：复制编辑器选中的内容
   *
   * 原理：
   * 1. 获取 Tiptap 编辑器的选中内容
   * 2. 转换为 HTML 格式
   * 3. 使用 ClipboardItem 写入剪贴板
   *
   * 与 testCopyRichText 的区别：
   * - testCopyRichText：复制预设的 HTML 字符串
   * - 这个函数：复制用户选中的编辑器内容
   */
  const testCopyEditorSelection = async () => {
    try {
      // 获取编辑器当前选中的内容
      // editor.state.selection: 获取当前光标选区
      // getSiblings(): 获取选区周围的兄弟节点
      // toHTML(): 将选中内容转换为 HTML 字符串

      const { from, to } = editor.state.selection;

      // 检查是否有选中内容
      if (from === to) {
        message.warning('请先选中编辑器中的内容');
        return;
      }

      // 使用 Tiptap 的方法获取选中内容的 HTML
      // getHTML() 返回当前选中的 HTML 内容
      const selectedHtml = editor.getHTML();

      // 也可以使用 getJSON() 获取结构化数据
      // const selectedJson = editor.getJSON();

      // 纯文本版本
      const plainText = editor.state.doc.textBetween(from, to, ' ');

      // 创建 ClipboardItem
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([selectedHtml], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });

      // 写入剪贴板
      await navigator.clipboard.write([clipboardItem]);

      message.success('已复制编辑器选中的内容！');
    } catch (error) {
      console.error('复制选中内容失败:', error);
      message.error('复制失败: ' + error.message);
    }
  };

  /**
   * =========================================================================
   * 粘贴功能：使用 Clipboard API 读取剪贴板
   * =========================================================================
   *
   * read() 方法：
   * - 从系统剪贴板读取数据
   * - 返回 ClipboardItem 数组
   * - 会触发浏览器权限请求（用户需要授权）
   * - 只能通过用户操作（如点击按钮）调用
   *
   * readText() 方法：
   * - 读取纯文本内容
   * - 更简单，但不保留格式
   */

  /**
   * 测试 3：读取剪贴板内容
   *
   * 原理：
   * 1. 调用 navigator.clipboard.read() 获取剪贴板数据
   * 2. 检查支持的数据类型
   * 3. 使用 item.getType() 获取特定类型的 Blob
   * 4. 将 Blob 转换为可读内容
   *
   * 注意事项：
   * - 浏览器会弹出权限请求，用户必须允许
   * - 某些浏览器可能不支持此 API
   */
  const testReadClipboard = async () => {
    try {
      // 使用 Clipboard API 读取剪贴板
      // 返回一个 ClipboardItem 数组
      const clipboardItems = await navigator.clipboard.read();

      let content = '';
      let htmlContent = '';

      // 遍历剪贴板中的每个 ClipboardItem
      for (const item of clipboardItems) {
        // item.types: 返回该 ClipboardItem 支持的所有 MIME 类型数组
        console.log('支持的数据类型:', item.types);

        // 检查是否包含 HTML 类型
        // HTML 格式通常由 Office/飞书/网页等应用写入
        if (item.types.includes('text/html')) {
          // getType(mimeType): 获取指定类型的 Blob 对象
          const htmlBlob = await item.getType('text/html');

          // Blob.text(): 将 Blob 内容转换为字符串
          htmlContent = await htmlBlob.text();

          console.log('读取到 HTML 内容:', htmlContent);
        }

        // 检查是否包含纯文本类型
        // 几乎所有应用都支持纯文本格式
        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain');
          content = await textBlob.text();
        }
      }

      // 如果没有 HTML 内容，使用纯文本
      const displayContent = htmlContent || content;

      if (displayContent) {
        setPastedContent(displayContent);
        setModalVisible(true);
        message.success('成功读取剪贴板内容！');
      } else {
        message.warning('剪贴板中没有可读取的内容');
      }
    } catch (error) {
      // 常见错误：
      // 1. NotAllowedError: 用户拒绝了剪贴板权限
      // 2. SecurityError: 非安全上下文
      // 3. TypeError: 浏览器不支持 ClipboardItem
      console.error('读取剪贴板失败:', error);

      if (error.name === 'NotAllowedError') {
        message.error('请允许访问剪贴板权限');
      } else {
        message.error('读取失败: ' + error.message);
      }
    }
  };

  /**
   * 测试 4：使用 readText() 读取纯文本
   *
   * 原理：
   * - readText() 是 read() 的简化版本
   * - 专门用于读取纯文本
   * - 无需处理 Blob 转换
   * - 更简单，但不保留任何格式
   *
   * 使用场景：
   * - 只关心文本内容
   * - 不需要保留样式
   */
  const testReadText = async () => {
    try {
      // 使用 readText() 直接读取纯文本
      // 这是最简单的剪贴板读取方式
      const text = await navigator.clipboard.readText();

      if (text) {
        setPastedContent(text);
        setModalVisible(true);
        message.success('成功读取纯文本！');
      } else {
        message.warning('剪贴板中没有文本内容');
      }
    } catch (error) {
      console.error('读取文本失败:', error);
      message.error('读取失败: ' + error.message);
    }
  };

  /**
   * 测试 5：粘贴并插入编辑器
   *
   * 原理：
   * 1. 读取剪贴板内容
   * 2. 解析 HTML 内容
   * 3. 使用 Tiptap 的命令插入内容
   *
   * 注意：这里我们演示如何处理粘贴事件
   * 实际使用中，Tiptap 已经内置了粘贴处理
   */
  const testPasteToEditor = async () => {
    try {
      // 读取剪贴板的 HTML 内容
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        if (item.types.includes('text/html')) {
          const htmlBlob = await item.getType('text/html');
          const htmlContent = await htmlBlob.text();

          // 使用 Tiptap 命令插入内容
          // chain() 创建一个命令链
          // focus() 确保编辑器获得焦点
          // insertContent() 在当前位置插入内容
          editor.chain().focus().insertContent(htmlContent).run();

          message.success('已粘贴到编辑器！');
          return;
        }
      }

      // 如果没有 HTML，尝试粘贴纯文本
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
        message.success('已粘贴纯文本到编辑器！');
      }
    } catch (error) {
      console.error('粘贴失败:', error);
      message.error('粘贴失败: ' + error.message);
    }
  };

  /**
   * =========================================================================
   * 辅助功能：剪贴板支持检测
   * =========================================================================
   *
   * 并非所有浏览器都支持完整的 Clipboard API
   * 需要进行特性检测
   */

  /**
   * 检测浏览器是否支持 Clipboard API
   */
  const isClipboardSupported = () => {
    return (
      // 检查 navigator.clipboard 对象是否存在
      !!navigator.clipboard &&
      // 检查 ClipboardItem 构造函数是否可用
      typeof ClipboardItem !== 'undefined'
    );
  };

  /**
   * 显示剪贴板功能说明
   */
  const showClipboardInfo = () => {
    Modal.info({
      title: '剪贴板 API 使用说明',
      width: 600,
      content: (
        <div style={{ lineHeight: 1.8 }}>
          <Paragraph>
            <Text strong>1. 使用前提</Text>
            <ul>
              <li>需要 HTTPS 环境（localhost 除外）</li>
              <li>需要用户交互触发（点击按钮）</li>
              <li>读取剪贴板需要用户授权</li>
            </ul>
          </Paragraph>

          <Paragraph>
            <Text strong>2. 写入剪贴板 (write)</Text>
            <ul>
              <li>创建 ClipboardItem 对象</li>
              <li>指定 MIME 类型（text/html, text/plain 等）</li>
              <li>调用 clipboard.write() 写入</li>
            </ul>
          </Paragraph>

          <Paragraph>
            <Text strong>3. 读取剪贴板 (read)</Text>
            <ul>
              <li>调用 clipboard.read() 返回 ClipboardItem 数组</li>
              <li>通过 item.types 检查支持的数据类型</li>
              <li>使用 item.getType() 获取对应类型的 Blob</li>
              <li>使用 Blob.text() 转换为字符串</li>
            </ul>
          </Paragraph>

          <Paragraph>
            <Text strong>4. 简化方法</Text>
            <ul>
              <li>writeText() / readText(): 纯文本操作</li>
              <li>write() / read(): 完整 API，支持多种格式</li>
            </ul>
          </Paragraph>

          <Divider />

          <Text type="secondary">
            当前浏览器支持: {isClipboardSupported() ? '✓ 支持' : '✗ 不支持'}
          </Text>
        </div>
      ),
    });
  };

  /**
   * 下拉菜单的 items 配置
   */
  const menuItems = [
    // 第一组：复制功能
    {
      key: 'copy-group',
      type: 'group',
      label: '复制到剪贴板',
      children: [
        {
          key: 'copy-rich-text',
          icon: <CopyOutlined />,
          label: '复制富文本 HTML',
          onClick: testCopyRichText,
        },
        {
          key: 'copy-selection',
          icon: <FileTextOutlined />,
          label: '复制选中内容',
          onClick: testCopyEditorSelection,
        },
      ],
    },
    // 第二组：读取功能
    {
      key: 'read-group',
      type: 'group',
      label: '从剪贴板读取',
      children: [
        {
          key: 'read-html',
          icon: <CloudDownloadOutlined />,
          label: '读取 HTML 内容',
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
    // 第三组：编辑器粘贴
    {
      key: 'paste-group',
      type: 'group',
      label: '粘贴到编辑器',
      children: [
        {
          key: 'paste-editor',
          icon: <ScissorOutlined />,
          label: '粘贴到光标位置',
          onClick: testPasteToEditor,
        },
      ],
    },
    // 分隔线
    { type: 'divider' },
    // 帮助
    {
      key: 'help',
      icon: <ExperimentOutlined />,
      label: '使用说明',
      onClick: showClipboardInfo,
    },
  ];

  return (
    <>
      {/* 剪贴板测试下拉菜单 */}
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <Button icon={<CloudUploadOutlined />}>剪贴板测试</Button>
      </Dropdown>

      {/* 显示读取内容的模态框 */}
      <Modal
        title="剪贴板内容"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="insert"
            type="primary"
            onClick={() => {
              // 将读取的内容插入编辑器
              editor.chain().focus().insertContent(pastedContent).run();
              setModalVisible(false);
              message.success('已插入到编辑器');
            }}
          >
            插入到编辑器
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* HTML 内容预览 */}
          {pastedContent.includes('<') ? (
            <div>
              <Text strong>HTML 源码：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {pastedContent}
              </pre>
            </div>
          ) : null}

          {/* 渲染预览 */}
          <div>
            <Text strong>渲染效果：</Text>
            <div
              style={{
                background: '#fff',
                padding: 12,
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
              }}
            >
              {pastedContent.replace(/<[^>]+>/g, '')}
            </div>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default ClipboardMenu;
