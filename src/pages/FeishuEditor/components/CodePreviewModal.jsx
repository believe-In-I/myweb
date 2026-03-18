/**
 * 代码预览弹窗组件
 */
import { Modal, Button, message } from 'antd';
import { copyTextT } from '../../../utils/common';

const codeBlockStyle = {
  maxHeight: '400px',
  overflow: 'auto',
  background: '#1e1e1e',
  padding: '12px',
  borderRadius: '6px',
};

const preStyle = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  color: '#d4d4d4',
  fontSize: '13px',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
};

export const showHtmlModal = (html) => {
  Modal.info({
    title: 'HTML 内容',
    content: (
      <div style={codeBlockStyle}>
        <pre style={preStyle}>{html}</pre>
      </div>
    ),
    width: 800,
    maskClosable: true,
    footer: [
      <Button
        key="copy"
        type="primary"
        onClick={() => {
          copyTextT(html);
          message.success('已复制到剪贴板');
        }}
      >
        复制
      </Button>,
    ],
  });
};

export const showJsonModal = (json) => {
  const jsonString = JSON.stringify(json, null, 2);
  Modal.info({
    title: 'JSON 内容',
    content: (
      <div style={codeBlockStyle}>
        <pre style={preStyle}>{jsonString}</pre>
      </div>
    ),
    width: 800,
    maskClosable: true,
    footer: [
      <Button
        key="copy"
        type="primary"
        onClick={() => {
          copyTextT(jsonString);
          message.success('已复制到剪贴板');
        }}
      >
        复制
      </Button>,
    ],
  });
};

export { Modal };
