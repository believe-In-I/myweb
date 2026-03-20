/**
 * 悬浮工具栏组件（选中文字时显示）
 */
import { BubbleMenu } from '@tiptap/react/menus';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  CodeOutlined,
  LinkOutlined,
  HighlightOutlined,
} from '@ant-design/icons';
import { Popover, Dropdown } from 'antd';
import { useState, useCallback } from 'react';
import ToolbarButton from './ToolbarButton';

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff4d4f', '#fa541c', '#faad14',
  '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#666666',
];

// 预设字体大小
const FONT_SIZES = [
  { label: '12px', value: 12 },
  { label: '14px', value: 14 },
  { label: '16px', value: 16 },
  { label: '18px', value: 18 },
  { label: '20px', value: 20 },
  { label: '24px', value: 24 },
  { label: '28px', value: 28 },
  { label: '32px', value: 32 },
];

const PRESET_HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000',
  '#0000ff', '#ffffff', '#c0c0c0', '#800000', '#000080',
];

/**
 * 迷你颜色选择器（用于悬浮菜单）
 */
const MiniColorPicker = ({ onSelect, colors = PRESET_COLORS }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 2,
      padding: 4,
    }}>
      {colors.map((color) => (
        <div
          key={color}
          onClick={() => onSelect(color)}
          style={{
            width: 22,
            height: 22,
            backgroundColor: color,
            border: '1px solid #d9d9d9',
            borderRadius: 2,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
};

/**
 * 字体大小选择器
 */
const FontSizePicker = ({ onSelect, currentSize }) => {
  return (
    <div style={{
      padding: 8,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 4,
      width: 120,
    }}>
      {FONT_SIZES.map((size) => (
        <div
          key={size.value}
          onClick={() => onSelect(size.value)}
          style={{
            padding: '4px 8px',
            textAlign: 'center',
            backgroundColor: currentSize === size.value ? '#e6f7ff' : 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: size.value > 18 ? size.value * 0.7 : size.value,
            border: currentSize === size.value ? '1px solid #1890ff' : '1px solid transparent',
          }}
        >
          {size.label}
        </div>
      ))}
    </div>
  );
};

const BubbleMenuBar = ({ editor, onOpenLinkModal }) => {
  if (!editor) return null;

  // 获取当前字体颜色
  const getCurrentColor = useCallback(() => {
    return editor.getAttributes('textStyle').color || null;
  }, [editor]);

  // 获取当前字体大小
  const getCurrentFontSize = useCallback(() => {
    const fontSize = editor.getAttributes('textStyle').fontSize;
    return fontSize ? parseInt(fontSize) : null;
  }, [editor]);

  // 获取当前背景颜色
  const getCurrentHighlight = useCallback(() => {
    return editor.getAttributes('highlight').color || null;
  }, [editor]);

  // 清除字体样式
  const clearFontStyle = useCallback((type) => {
    const chain = editor.chain().focus();
    if (type === 'color') {
      chain.unsetColor().run();
    } else if (type === 'highlight') {
      chain.unsetHighlight().run();
    } else if (type === 'fontSize') {
      chain.unsetFontSize().run();
    }
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      className="feishu-editor-bubble-menu"
    >
      <ToolbarButton
        icon={<BoldOutlined />}
        title="粗体"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<ItalicOutlined />}
        title="斜体"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<UnderlineOutlined />}
        title="下划线"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={<StrikethroughOutlined />}
        title="删除线"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      {/* 字体颜色 */}
      <Popover
        trigger="click"
        placement="bottom"
        content={
          <MiniColorPicker
            onSelect={(color) => {
              editor.chain().focus().setColor(color).run();
            }}
          />
        }
      >
        <ToolbarButton
          icon={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ fontSize: 12 }}>A</span>
              <span style={{
                width: 12,
                height: 3,
                backgroundColor: getCurrentColor() || '#000000',
                marginLeft: 2,
                borderRadius: 1,
              }} />
            </span>
          }
          title="字体颜色"
          isActive={!!getCurrentColor()}
        />
      </Popover>

      {/* 背景高亮 */}
      <Popover
        trigger="click"
        placement="bottom"
        content={
          <div>
            <MiniColorPicker
              onSelect={(color) => {
                editor.chain().focus().setHighlight({ color }).run();
              }}
              colors={PRESET_HIGHLIGHT_COLORS}
            />
            {getCurrentHighlight() && (
              <div
                onClick={() => clearFontStyle('highlight')}
                style={{
                  padding: '4px 8px',
                  marginTop: 4,
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontSize: 12,
                  textAlign: 'center',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                清除高亮
              </div>
            )}
          </div>
        }
      >
        <ToolbarButton
          icon={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <HighlightOutlined style={{ fontSize: 12 }} />
              <span style={{
                width: 12,
                height: 3,
                backgroundColor: getCurrentHighlight() || '#ffff00',
                marginLeft: 2,
                borderRadius: 1,
              }} />
            </span>
          }
          title="背景高亮"
          isActive={!!getCurrentHighlight()}
        />
      </Popover>

      {/* 字体大小 */}
      <Popover
        trigger="click"
        placement="bottom"
        content={
          <div>
            <FontSizePicker
              onSelect={(size) => {
                editor.chain().focus().setFontSize(`${size}px`).run();
              }}
              currentSize={getCurrentFontSize()}
            />
            {getCurrentFontSize() && (
              <div
                onClick={() => clearFontStyle('fontSize')}
                style={{
                  padding: '4px 8px',
                  marginTop: 4,
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontSize: 12,
                  textAlign: 'center',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                清除字体大小
              </div>
            )}
          </div>
        }
      >
        <ToolbarButton
          icon={
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>T</span>
          }
          title="字体大小"
          isActive={!!getCurrentFontSize()}
        />
      </Popover>

      <ToolbarButton
        icon={<LinkOutlined />}
        title="链接"
        isActive={editor.isActive('link')}
        onClick={() => onOpenLinkModal()}
      />
      <ToolbarButton
        icon={<CodeOutlined />}
        title="行内代码"
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
    </BubbleMenu>
  );
};

export default BubbleMenuBar;
