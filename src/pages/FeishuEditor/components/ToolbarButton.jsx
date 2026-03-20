/**
 * 工具栏按钮组件
 */
import { forwardRef } from 'react';
import { Tooltip } from 'antd';

const ToolbarButton = forwardRef(({
  isActive,
  onClick,
  title,
  icon,
  className = '',
  stopPropagation = false
}, ref) => (
  <Tooltip title={title} placement="top">
    <button
      ref={ref}
      className={`feishu-editor-toolbar-btn ${isActive ? 'active' : ''} ${className}`}
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
        }
        onClick?.(e);
      }}
      type="button"
    >
      {icon}
    </button>
  </Tooltip>
));

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;
