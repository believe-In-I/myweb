import React, { useEffect, useState } from 'react';
import { Card, Button, Upload, Typography, Alert, Spin, Space, Input, Table, Popconfirm, message, Tag, Breadcrumb, Modal, Form, Tooltip, Empty } from 'antd';
import { FolderOutlined, FileOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined, PlusOutlined, HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { healthCheck, ossList, ossDelete, ossDeleteDir, ossDownloadUrl, ossCreateDir, ossUpload } from '@/api';

const { Title, Text } = Typography;

// 允许的图片 MIME 类型（后端设置）
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
];

const ApiTestPage = () => {
  // const apiBaseUrl = 'https://api.niumashuai.top';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 上传结果
  const [uploadResult, setUploadResult] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // 文件列表
  const [fileList, setFileList] = useState([]);
  const [dirList, setDirList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 当前目录路径
  const [currentPath, setCurrentPath] = useState('uploads/');

  // 创建目录弹窗
  const [createDirModalVisible, setCreateDirModalVisible] = useState(false);
  const [createDirLoading, setCreateDirLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取文件列表
  const fetchFileList = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('获取文件列表, prefix:', currentPath);

      const response = await ossList(currentPath);
      console.log('文件列表响应:', response.data);

      if (response.status === 'success') {
        setDirList(response.data.directories || []);
        setFileList(response.data.files || []);
      } else {
        setError(response.message || '获取文件列表失败');
      }
    } catch (err) {
      console.error('获取文件列表失败:', err);
      setError(`获取文件列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试健康检查
  const testHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthCheck();
      setHealthData(response.data);
    } catch (err) {
      setError(`健康检查失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取文件列表
  useEffect(() => {
    testHealth();
  }, []);

  useEffect(() => {
    fetchFileList();
  }, [currentPath, refreshKey]);

  // 手动刷新列表
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 进入目录
  const handleEnterDir = (dirKey) => {
    setCurrentPath(dirKey);
  };

  // 返回上级目录
  const handleGoBack = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      pathParts.pop();
      const newPath = pathParts.length > 0 ? pathParts.join('/') + '/' : 'uploads/';
      setCurrentPath(newPath);
    } else {
      setCurrentPath('uploads/');
    }
  };

  // 获取面包屑路径
  const getBreadcrumbItems = () => {
    const items = [{ title: <><HomeOutlined /> 根目录</>, path: 'uploads/' }];
    const pathParts = currentPath.split('/').filter(Boolean);

    let accumulatedPath = '';
    pathParts.forEach((part, index) => {
      accumulatedPath += part + '/';
      items.push({
        title: part,
        path: accumulatedPath
      });
    });

    return items;
  };

  // 面包屑点击
  const handleBreadcrumbClick = (path) => {
    setCurrentPath(path);
  };

  // 删除文件
  const handleDeleteFile = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ossDelete(key);
      if (response.status === 'success') {
        message.success('文件删除成功');
        fetchFileList();
      } else {
        setError(response.message || '删除文件失败');
      }
    } catch (err) {
      setError(`删除文件失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除目录
  const handleDeleteDir = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ossDeleteDir(key);
      if (response.status === 'success') {
        message.success(`目录删除成功，删除了 ${response.data.deletedCount} 个文件`);
        fetchFileList();
      } else {
        setError(response.message || '删除目录失败');
      }
    } catch (err) {
      setError(`删除目录失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 下载文件
  const handleDownload = async (key) => {
    setLoading(true);
    try {
      const response = await ossDownloadUrl(key);
      if (response.status === 'success') {
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = key.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('开始下载');
      } else {
        message.error(response.message || '获取下载链接失败');
      }
    } catch (err) {
      message.error(`下载失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 复制链接
  const handleCopyLink = async (key) => {
    try {
      const response = await ossDownloadUrl(key);
      if (response.status === 'success') {
        await navigator.clipboard.writeText(response.data.url);
        message.success('链接已复制到剪贴板');
      } else {
        message.error(response.message || '获取链接失败');
      }
    } catch (err) {
      message.error(`复制失败: ${err.message}`);
    }
  };

  // 创建目录
  const handleCreateDir = async (values) => {
    setCreateDirLoading(true);
    try {
      const response = await ossCreateDir(values.dirName, currentPath);
      if (response.status === 'success') {
        message.success('目录创建成功');
        setCreateDirModalVisible(false);
        form.resetFields();
        fetchFileList();
      } else {
        message.error(response.message || '创建目录失败');
      }
    } catch (err) {
      message.error(`创建目录失败: ${err.message}`);
    } finally {
      setCreateDirLoading(false);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (file) => {
    // 校验文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error('只允许上传图片文件（jpeg, png, gif, webp, svg, bmp, tiff）');
      return Upload.LIST_IGNORE;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('acl', 'public-read');
      // 上传到当前目录
      const fileName = file.name;
      const ossKey = `${currentPath}${Date.now()}-${fileName}`;
      formData.append('key', ossKey);

      console.log('上传文件到:', ossKey);

      const response = await ossUpload(formData);

      console.log('上传响应:', response.data); // 调试日志

      setUploadResult(response.data);
      message.success('文件上传成功');

      // 延迟一点时间再刷新，确保 OSS 同步
      setTimeout(() => {
        fetchFileList();
      }, 500);
    } catch (err) {
      console.error('上传失败:', err); // 调试日志
      setError(`文件上传失败: ${err.message}`);
    } finally {
      setLoading(false);
    }

    return false;
  };

  // 表格列配置 - 文件
  const fileColumns = [
    {
      title: '预览',
      key: 'preview',
      width: 80,
      render: (_, record) => {
        const isImage = record.contentType?.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(record.key);
        if (isImage && record.url) {
          return (
            <img
              src={record.url}
              alt="preview"
              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          );
        }
        return <FileOutlined style={{ fontSize: 24, color: '#999' }} />;
      }
    },
    {
      title: '文件名',
      dataIndex: 'key',
      key: 'name',
      render: (text) => {
        const fileName = text.split('/').pop();
        return (
          <Space>
            <span>{fileName}</span>
          </Space>
        );
      }
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => {
        if (!size || size === 0) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      }
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 150,
      render: (type) => {
        if (!type) return <Tag>unknown</Tag>;
        if (type.includes('image')) return <Tag color="green">图片</Tag>;
        if (type.includes('video')) return <Tag color="purple">视频</Tag>;
        if (type.includes('audio')) return <Tag color="orange">音频</Tag>;
        if (type.includes('pdf')) return <Tag color="red">PDF</Tag>;
        if (type.includes('text')) return <Tag color="blue">文本</Tag>;
        return <Tag>{type.split('/')[1]}</Tag>;
      }
    },
    {
      title: '上传时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.key)}
            />
          </Tooltip>
          <Tooltip title="复制链接">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(record.key)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个文件吗？此操作不可恢复。"
            onConfirm={() => handleDeleteFile(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 表格列配置 - 目录
  const dirColumns = [
    {
      title: '目录名',
      dataIndex: 'key',
      key: 'name',
      render: (text) => {
        const dirName = text.split('/').filter(Boolean).pop();
        return (
          <Space>
            <FolderOutlined style={{ color: '#faad14' }} />
            <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => handleEnterDir(text)}>
              {dirName}
            </span>
          </Space>
        );
      }
    },
    {
      title: '路径',
      dataIndex: 'key',
      key: 'path',
      ellipsis: true,
      render: (text) => <code style={{ fontSize: 12 }}>{text}</code>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="进入">
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ rotate: '180deg' }} />}
              onClick={() => handleEnterDir(record.key)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个目录及其所有内容吗？此操作不可恢复。"
            onConfirm={() => handleDeleteDir(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除目录">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 合并目录和文件数据（目录在前）
  const combinedData = [
    ...dirList.map(d => ({ ...d, type: 'dir' })),
    ...fileList.map(f => ({ ...f, type: 'file' }))
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>OSS文件管理器</Title>

      {/* API Base URL配置 */}
      <Card title="配置" style={{ marginBottom: 20 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>API地址:</Text>
            <Text type="secondary" style={{ marginLeft: 10 }}>
              {import.meta.env.PROD ? '(生产环境)' : '(开发环境 - 使用Vite代理)'}
            </Text>
          </div>

          <Button type="primary" onClick={testHealth} loading={loading}>
            检查服务状态
          </Button>
        </Space>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert
          title="操作失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* 文件操作区 */}
      <Card
        title={
          <Space>
            <span>当前目录: </span>
            <Breadcrumb
              items={getBreadcrumbItems().map((item, index) => ({
                title: index === getBreadcrumbItems().length - 1 ? (
                  item.title
                ) : (
                  <a onClick={() => handleBreadcrumbClick(item.path)}>{item.title}</a>
                )
              }))}
            />
          </Space>
        }
        style={{ marginBottom: 20 }}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              disabled={currentPath === 'uploads/'}
            >
              返回上级
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateDirModalVisible(true)}
            >
              新建目录
            </Button>
            <Upload
              beforeUpload={handleFileUpload}
              showUploadList={false}
              multiple
            >
              <Button type="primary" icon={<Upload />} loading={loading}>
                上传文件
              </Button>
            </Upload>
            <Button onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        {loading && dirList.length === 0 && fileList.length === 0 ? (
          <Spin description="加载中...">
            <div style={{ padding: 50, background: '#fafafa' }} />
          </Spin>
        ) : dirList.length === 0 && fileList.length === 0 ? (
          <Empty description="当前目录为空" />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            {/* 目录列表 */}
            {dirList.length > 0 && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 10 }}>
                  <FolderOutlined /> 文件夹 ({dirList.length})
                </Text>
                <Table
                  columns={dirColumns}
                  dataSource={dirList}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {/* 文件列表 */}
            {fileList.length > 0 && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 10 }}>
                  <FileOutlined /> 文件 ({fileList.length})
                </Text>
                <Table
                  columns={fileColumns}
                  dataSource={fileList}
                  rowKey="key"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            )}
          </Space>
        )}
      </Card>

      {/* 上传结果 */}
      {uploadResult && (
        <Card title="上传结果" style={{ marginBottom: 20 }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>文件URL:</Text>
              <div style={{ marginTop: 5, wordBreak: 'break-all' }}>
                <a href={uploadResult.url} target="_blank" rel="noopener noreferrer">
                  {uploadResult.url}
                </a>
              </div>
            </div>

            <div>
              <Text strong>文件路径:</Text> {uploadResult.key}
            </div>

            <div>
              <Text strong>文件大小:</Text> {uploadResult.size} bytes
            </div>

            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(uploadResult.url);
                  message.success('链接已复制');
                }}
              >
                复制链接
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = uploadResult.url;
                  link.download = uploadResult.key.split('/').pop();
                  link.click();
                }}
              >
                下载
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {/* 创建目录弹窗 */}
      <Modal
        title="创建新目录"
        open={createDirModalVisible}
        onCancel={() => {
          setCreateDirModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateDir}
        >
          <Form.Item
            name="dirName"
            label="目录名称"
            rules={[{ required: true, message: '请输入目录名称' }]}
          >
            <Input placeholder="请输入目录名称" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateDirModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={createDirLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiTestPage;
