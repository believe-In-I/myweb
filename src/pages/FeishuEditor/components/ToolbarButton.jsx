/**
 * 工具栏按钮组件
 */
import { Tooltip } from 'antd';

const ToolbarButton = ({ isActive, onClick, title, icon, className = '' }) => (
  <Tooltip title={title} placement="top">
    <button
      className={`feishu-editor-toolbar-btn ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  </Tooltip>
);

export default ToolbarButton;
