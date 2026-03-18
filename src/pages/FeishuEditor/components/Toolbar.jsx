/**
 * 工具栏组件
 */
import { Divider } from 'antd';
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
} from '@ant-design/icons';
import ToolbarButton from './ToolbarButton';

const Toolbar = ({ editor, onOpenLinkModal, onOpenImageModal }) => {
  if (!editor) return null;

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
