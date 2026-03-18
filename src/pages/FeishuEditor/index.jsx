/**
 * 飞书风格富文本编辑器
 *
 * 功能原理：
 * 1. 基于 Tiptap 编辑器（底层使用 ProseMirror，与飞书、Notion 等相同的技术栈）
 * 2. ProseMirror 是一个模块化的富文本编辑器框架，提供了声明式的 schema 定义
 * 3. 编辑器状态由 EditorState 管理，包含文档结构、选区、事务历史等信息
 * 4. 所有编辑操作都通过事务（Transaction）完成，支持撤销/重做
 *
 * 步骤：
 * 1. 使用 StarterKit 提供基础功能（标题、列表、代码块、引用等）
 * 2. 添加常用扩展：链接、图片、分隔线、下划线、删除线等
 * 3. 自定义工具栏组件，调用 Tiptap 的命令 API
 * 4. 实现悬浮工具栏（Bubble Menu）：选中文字时显示格式选项
 * 5. 集成飞书风格的 UI 设计
 */

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Space, Card } from 'antd';
import {
  Toolbar,
  BubbleMenuBar,
  FloatingMenuBar,
  StatusBar,
  LinkModal,
  ImageModal,
  showHtmlModal,
  showJsonModal,
} from './components';
import './FeishuEditor.css';

/**
 * 飞书风格富文本编辑器主组件
 */
const FeishuEditorPage = () => {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState('');

  /**
   * Tiptap 编辑器配置
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'feishu-editor-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'feishu-editor-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: `
      <h1>飞书风格富文本编辑器</h1>
      <p>这是一个基于 <strong>Tiptap</strong> 实现的飞书风格富文本编辑器，支持丰富的格式化功能。</p>
      <h2>主要功能</h2>
      <ul>
        <li>文本格式化：<strong>粗体</strong>、<em>斜体</em>、<u>下划线</u>、<s>删除线</s></li>
        <li>标题：支持 H1、H2、H3 三级标题</li>
        <li>列表：有序列表、无序列表</li>
        <li>对齐：左对齐、居中、右对齐</li>
        <li>代码：行内代码、代码块</li>
        <li>链接和图片</li>
      </ul>
      <h2>使用说明</h2>
      <blockquote>
        <p>💡 提示：选中文字后会出现悬浮工具栏，可以快速格式化文本。</p>
      </blockquote>
      <h2>代码示例</h2>
      <pre><code>function hello() {
  console.log('Hello, Feishu Editor!');
}</code></pre>
      <hr />
      <p>开始编辑你的文档吧！</p>
    `,
    editorProps: {
      attributes: {
        class: 'feishu-editor-content',
      },
    },
  });

  /**
   * 设置链接
   */
  const setLink = useCallback(
    (url) => {
      if (editingLink) {
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        setEditingLink('');
      } else {
        editor?.chain().focus().setLink({ href: url }).run();
      }
    },
    [editor, editingLink]
  );

  /**
   * 插入图片
   */
  const addImage = useCallback(
    (url) => {
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor]
  );

  /**
   * 获取编辑器内容
   */
  const getHTML = useCallback(() => editor?.getHTML() || '', [editor]);
  const getJSON = useCallback(() => editor?.getJSON() || {}, [editor]);
  const getText = useCallback(() => editor?.getText() || '', [editor]);

  const getCharacterCount = useCallback(() => getText().length, [getText]);
  const getWordCount = useCallback(() => {
    const text = getText();
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [getText]);

  /**
   * 打开链接弹窗
   */
  const handleOpenLinkModal = useCallback(() => {
    if (editor?.isActive('link')) {
      setEditingLink(editor.getAttributes('link').href);
    }
    setLinkModalOpen(true);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="feishu-editor-page">
      <Card
        title="飞书风格富文本编辑器"
        extra={
          <Space>
            <Button onClick={() => showHtmlModal(getHTML())}>获取 HTML</Button>
            <Button onClick={() => showJsonModal(getJSON())}>获取 JSON</Button>
          </Space>
        }
      >
        <Toolbar
          editor={editor}
          onOpenLinkModal={handleOpenLinkModal}
          onOpenImageModal={() => setImageModalOpen(true)}
        />

        <BubbleMenuBar editor={editor} onOpenLinkModal={handleOpenLinkModal} />

        <FloatingMenuBar editor={editor} />

        <EditorContent editor={editor} className="feishu-editor-wrapper" />

        <StatusBar wordCount={getWordCount()} characterCount={getCharacterCount()} />
      </Card>

      <LinkModal
        open={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setEditingLink('');
        }}
        onConfirm={setLink}
        initialUrl={editingLink}
      />

      <ImageModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onConfirm={addImage}
      />
    </div>
  );
};

export default FeishuEditorPage;
