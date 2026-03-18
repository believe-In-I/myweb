/**
 * 链接编辑弹窗组件
 */
import { useState } from 'react';
import { Modal, Input } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const LinkModal = ({ open, onClose, onConfirm, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url);
      setUrl('');
      onClose();
    }
  };

  return (
    <Modal
      title="插入链接"
      open={open}
      onOk={handleConfirm}
      onCancel={onClose}
      okText="确定"
      cancelText="取消"
    >
      <Input
        placeholder="请输入链接地址"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onPressEnter={handleConfirm}
        prefix={<LinkOutlined />}
      />
    </Modal>
  );
};

export default LinkModal;
