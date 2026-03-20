/**
 * 工具栏组件
 */
import { Divider, Popover, Slider, Button } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
  MinusOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  HighlightOutlined,
} from '@ant-design/icons';
import { useState, useCallback } from 'react';
import ToolbarButton from './ToolbarButton';

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff4d4f', '#fa541c', '#faad14',
  '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#666666',
];

// 字体大小选项
const FONT_SIZES = [
  { label: '12px', value: 12 },
  { label: '14px', value: 14 },
  { label: '16px', value: 16 },
  { label: '18px', value: 18 },
  { label: '20px', value: 20 },
  { label: '24px', value: 24 },
  { label: '28px', value: 28 },
  { label: '32px', value: 32 },
  { label: '36px', value: 36 },
];

/**
 * 颜色选择器组件
 */
const ColorPicker = ({ value, onChange, presetColors, title }) => {
  const [inputValue, setInputValue] = useState(value || '#000000');

  const handleColorChange = (color) => {
    setInputValue(color);
    onChange(color);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  // 阻止事件冒泡，防止 Popover 关闭
  const handleColorClick = (e, color) => {
    e.preventDefault();
    e.stopPropagation();
    handleColorChange(color);
  };

  return (
    <div style={{ width: 200, padding: 8 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>{title}</div>

      {/* 预设颜色网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
        marginBottom: 12
      }}>
        {presetColors.map((color) => (
          <div
            key={color}
            onMouseDown={(e) => handleColorClick(e, color)}
            style={{
              width: 28,
              height: 28,
              backgroundColor: color,
              border: value === color ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* 颜色预览和输入 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            backgroundColor: inputValue,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
          }}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#000000"
          style={{
            flex: 1,
            height: 32,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: '0 8px',
          }}
        />
      </div>
    </div>
  );
};

/**
 * 字体大小选择器组件
 */
const FontSizePicker = ({ currentSize, onChange }) => {
  // 阻止事件冒泡，防止 Popover 关闭
  const handleSizeClick = (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(size);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>字体大小</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4
      }}>
        {FONT_SIZES.map(({ label, value }) => (
          <Button
            key={value}
            size="small"
            type={currentSize === value ? 'primary' : 'default'}
            onMouseDown={(e) => handleSizeClick(e, value)}
            style={{ fontSize: 12 }}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

const Toolbar = ({ editor, onOpenLinkModal, onOpenImageModal }) => {
  if (!editor) return null;

  // 获取当前字体颜色
  const getCurrentColor = useCallback(() => {
    return editor.getAttributes('textStyle').color || '#000000';
  }, [editor]);

  // 获取当前背景颜色
  const getCurrentHighlight = useCallback(() => {
    return editor.getAttributes('highlight').color || null;
  }, [editor]);

  // 获取当前字体大小
  const getCurrentFontSize = useCallback(() => {
    const size = editor.getAttributes('textStyle').fontSize;
    return size ? parseInt(size) : 16;
  }, [editor]);

  // 设置字体颜色
  const setFontColor = useCallback((color) => {
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  // 清除字体颜色
  const clearFontColor = useCallback(() => {
    editor.chain().focus().unsetColor().run();
  }, [editor]);

  // 设置背景颜色
  const setHighlightColor = useCallback((color) => {
    editor.chain().focus().setHighlight({ color }).run();
  }, [editor]);

  // 清除背景颜色
  const clearHighlight = useCallback(() => {
    editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  // 设置字体大小 - 使用 setMark 方式
  const setFontSize = useCallback((size) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  }, [editor]);

  return (
    <div className="feishu-editor-toolbar">
      {/* 撤销/重做 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<UndoOutlined />}
          title="撤销 (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={<RedoOutlined />}
          title="重做 (Ctrl+Shift+Z)"
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      <Divider type="vertical" />

      {/* 标题 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<span className="toolbar-text">H1</span>}
          title="一级标题"
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon={<span className="toolbar-text">H2</span>}
          title="二级标题"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={<span className="toolbar-text">H3</span>}
          title="三级标题"
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
      </div>

      <Divider type="vertical" />

      {/* 文本格式 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<BoldOutlined />}
          title="粗体 (Ctrl+B)"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={<ItalicOutlined />}
          title="斜体 (Ctrl+I)"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={<UnderlineOutlined />}
          title="下划线 (Ctrl+U)"
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={<StrikethroughOutlined />}
          title="删除线"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </div>

      <Divider type="vertical" />

      {/* 字体样式：颜色、背景、大小 */}
      <div className="feishu-editor-toolbar-group">
        {/* 字体颜色 */}
        <Popover
          trigger="click"
          placement="bottom"
          content={
            <ColorPicker
              value={getCurrentColor()}
              onChange={setFontColor}
              presetColors={PRESET_COLORS}
              title="字体颜色"
            />
          }
        >
          <span onClick={(e) => e.stopPropagation()}>
            <ToolbarButton
              icon={
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <FontSizeOutlined style={{ fontSize: 14 }} />
                  <span style={{
                    width: 14,
                    height: 14,
                    backgroundColor: getCurrentColor() === '#000000' ? undefined : getCurrentColor(),
                    border: '1px solid currentColor',
                    borderRadius: 2,
                    display: 'inline-block'
                  }} />
                </span>
              }
              title="字体颜色"
              isActive={getCurrentColor() !== '#000000'}
            />
          </span>
        </Popover>

        {/* 背景颜色 */}
        <Popover
          trigger="click"
          placement="bottom"
          content={
            <div>
              <ColorPicker
                value={getCurrentHighlight() || '#ffff00'}
                onChange={setHighlightColor}
                presetColors={PRESET_COLORS}
                title="背景颜色（高亮）"
              />
              {getCurrentHighlight() && (
                <Button
                  size="small"
                  onClick={clearHighlight}
                  style={{ marginTop: 8 }}
                >
                  清除高亮
                </Button>
              )}
            </div>
          }
        >
          <span onClick={(e) => e.stopPropagation()}>
            <ToolbarButton
              icon={
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <HighlightOutlined style={{ fontSize: 14 }} />
                  <span style={{
                    width: 12,
                    height: 12,
                    backgroundColor: getCurrentHighlight() || '#ffff00',
                    border: '1px solid #d9d9d9',
                    borderRadius: 2,
                    marginLeft: 2
                  }} />
                </span>
              }
              title="背景颜色"
              isActive={!!getCurrentHighlight()}
            />
          </span>
        </Popover>

        {/* 字体大小 */}
        <Popover
          trigger="click"
          placement="bottom"
          content={
            <FontSizePicker
              currentSize={getCurrentFontSize()}
              onChange={setFontSize}
            />
          }
        >
          <span onClick={(e) => e.stopPropagation()}>
            <ToolbarButton
              icon={<span className="toolbar-text" style={{ fontSize: 12 }}>{getCurrentFontSize()}</span>}
              title="字体大小"
            />
          </span>
        </Popover>
      </div>

      <Divider type="vertical" />

      {/* 列表 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<UnorderedListOutlined />}
          title="无序列表"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={<OrderedListOutlined />}
          title="有序列表"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>

      <Divider type="vertical" />

      {/* 对齐 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<AlignLeftOutlined />}
          title="左对齐"
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolbarButton
          icon={<AlignCenterOutlined />}
          title="居中对齐"
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolbarButton
          icon={<AlignRightOutlined />}
          title="右对齐"
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
      </div>

      <Divider type="vertical" />

      {/* 插入元素 */}
      <div className="feishu-editor-toolbar-group">
        <ToolbarButton
          icon={<CodeOutlined />}
          title="行内代码"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          icon={<LinkOutlined />}
          title="链接"
          isActive={editor.isActive('link')}
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              onOpenLinkModal();
            }
          }}
        />
        <ToolbarButton
          icon={<PictureOutlined />}
          title="图片"
          onClick={onOpenImageModal}
        />
        <ToolbarButton
          icon={<MinusOutlined />}
          title="分隔线"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </div>
    </div>
  );
};

export default Toolbar;
