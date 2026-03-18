/**
 * 图片上传弹窗组件
 */
import { useState } from 'react';
import { Modal, Input, Space, Divider } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const ImageModal = ({ open, onClose, onConfirm }) => {
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url);
      setUrl('');
      onClose();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onConfirm(event.target.result);
        setUrl('');
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      title="插入图片"
      open={open}
      onOk={handleConfirm}
      onCancel={onClose}
      okText="确定"
      cancelText="取消"
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="请输入图片地址"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleConfirm}
          prefix={<LinkOutlined />}
        />
        <Divider>或</Divider>
        <div>
          <input type="file" accept="image/*" onChange={handleFileSelect} />
        </div>
      </Space>
    </Modal>
  );
};

export default ImageModal;
