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
} from '@ant-design/icons';
import ToolbarButton from './ToolbarButton';

const BubbleMenuBar = ({ editor, onOpenLinkModal }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
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
