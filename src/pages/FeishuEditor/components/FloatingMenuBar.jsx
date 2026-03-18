/**
 * 浮动菜单组件（空行时显示）
 */
import { FloatingMenu } from '@tiptap/react/menus';
import {
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import ToolbarButton from './ToolbarButton';

const FloatingMenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="feishu-editor-floating-menu"
    >
      <ToolbarButton
        icon={<span className="toolbar-text">H1</span>}
        title="一级标题"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={<span className="toolbar-text">H2</span>}
        title="二级标题"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={<UnorderedListOutlined />}
        title="无序列表"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<OrderedListOutlined />}
        title="有序列表"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={<CodeOutlined />}
        title="代码块"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        icon={<MinusOutlined />}
        title="分隔线"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
    </FloatingMenu>
  );
};

export default FloatingMenuBar;
