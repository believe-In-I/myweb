import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Upload, Typography, Alert, Spin, Space, Input } from 'antd';

const { Title, Text } = Typography;

const ApiTestPage = () => {

  // 基础配置
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:3001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 上传结果
  const [uploadResult, setUploadResult] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // 测试健康检查
  const testHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/health`);
      setHealthData(response.data);
    } catch (err) {
      setError(`健康检查失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('acl', 'public-read');

      const response = await axios.post(`${apiBaseUrl}/api/oss/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadResult(response.data.data);
    } catch (err) {
      setError(`文件上传失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
    
    return false; // 阻止自动上传
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>OSS文件上传</Title>
      
      {/* API Base URL配置 */}
      <Card title="配置" style={{ marginBottom: 20 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>API地址:</Text>
            <Input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              style={{ marginLeft: 10, width: 300 }}
              placeholder="http://localhost:3001"
            />
          </div>
          
          <Button type="primary" onClick={testHealth} loading={loading}>
            检查服务状态
          </Button>
        </Space>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert
          message="操作失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* 健康检查结果 */}
      {healthData && (
        <Card title="服务状态" style={{ marginBottom: 20 }}>
          <pre style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 }}>
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </Card>
      )}

      {/* 文件上传区域 */}
      <Card title="文件上传" style={{ marginBottom: 20 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Upload
              beforeUpload={handleFileUpload}
              showUploadList={false}
              maxCount={1}
            >
              <Button type="primary" size="large" loading={loading}>
                选择文件上传到OSS
              </Button>
            </Upload>
          </div>
          
          <Text type="secondary">
            支持多种文件格式，上传后将返回访问URL
          </Text>
        </Space>
      </Card>

      {/* 上传结果 */}
      {uploadResult && (
        <Card title="上传结果">
          <Space direction="vertical" style={{ width: '100%' }}>
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
            
            <div>
              <Text strong>文件类型:</Text> {uploadResult.contentType}
            </div>
            
            <div>
              <Text strong>上传时间:</Text> {new Date(uploadResult.uploadedAt).toLocaleString()}
            </div>
          </Space>
        </Card>
      )}

      {/* API文档 */}
      <Card title="API文档" style={{ marginTop: 20 }}>
        <div style={{ padding: 10 }}>
          <Title level={5}>文件上传接口</Title>
          <div style={{ marginBottom: 15 }}>
            <Text strong>请求方式:</Text> POST
          </div>
          <div style={{ marginBottom: 15 }}>
            <Text strong>请求URL:</Text> {apiBaseUrl}/api/oss/upload
          </div>
          <div style={{ marginBottom: 15 }}>
            <Text strong>请求参数:</Text>
            <ul>
              <li>file: 要上传的文件（必填）</li>
              <li>key: 文件在OSS中的路径（可选，默认自动生成）</li>
              <li>acl: 访问权限（可选，默认public-read）</li>
              <li>contentType: 文件类型（可选，默认根据文件自动判断）</li>
            </ul>
          </div>
          <div>
            <Text strong>响应示例:</Text>
            <pre style={{ marginTop: 5, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5, overflow: 'auto' }}>
{`{
  "status": "success",
  "message": "文件上传成功",
  "data": {
    "key": "uploads/1735894567890-file.txt",
    "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/1735894567890-file.txt",
    "size": 1024,
    "contentType": "text/plain",
    "uploadedAt": "2026-01-04T09:45:07.890Z"
  }
}`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiTestPage;
