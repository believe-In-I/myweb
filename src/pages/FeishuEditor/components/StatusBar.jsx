/**
 * 状态栏组件
 */
const StatusBar = ({ wordCount, characterCount }) => {
  return (
    <div className="feishu-editor-statusbar">
      <span>字数: {wordCount}</span>
      <span>字符: {characterCount}</span>
    </div>
  );
};

export default StatusBar;
