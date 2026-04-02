import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Spin, Typography, message, Modal, Form, Select, Upload, Popconfirm } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, StopOutlined, PaperClipOutlined, ArrowUpOutlined, SettingOutlined, CameraOutlined, PlusOutlined, UploadOutlined, LinkOutlined, SwapOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';
import { aiChat } from '@/api';

marked.use({ gfm: true });

const { Text } = Typography;

const AI_CHAT_STORAGE_KEY = 'ai_chat_messages';
const AI_IDENTITY_STORAGE_KEY = 'ai_chat_identity';

// 默认身份设定
const DEFAULT_IDENTITY = {
  name: '雀灵助手',
  age: '26',
  gender: '女',
  bio: '我是你的AI助手，有什么可以帮助你的吗？',
  personality: '热情开朗、善于倾听、温柔体贴',
  avatar: '/AiImage.jpg'
};

// 根据身份生成系统提示词
const generateSystemPrompt = (identity) => {
  return `你是一个AI助手，扮演一个角色与用户对话。请严格遵循以下身份设定：

【身份信息】
- 姓名：${identity.name}
- 年龄：${identity.age}岁
- 性别：${identity.gender}
- 简介：${identity.bio}
- 性格爱好：${identity.personality}

【对话规则】
1. 请严格以【${identity.name}】这个身份角色来回答问题
2. 回答要符合设定的性格特点
3. 用中文回复，语言自然、拟人化
4. 回答简洁明了
5. 如果不知道就说不知道`;
};

export default function AIChatPage() {
  // 加载保存的身份设定
  const getInitialIdentity = () => {
    try {
      const stored = localStorage.getItem(AI_IDENTITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_IDENTITY,
          ...parsed,
          avatar: parsed.avatar || DEFAULT_IDENTITY.avatar
        };
      }
    } catch (e) {
      console.error('恢复身份设定失败:', e);
    }
    return DEFAULT_IDENTITY;
  };

  const getWelcomeMessage = (identity) => {
    return `哈喽！我是 ${identity.name}，${identity.bio}`;
  };

  const getInitialMessages = (currentIdentity) => {
    try {
      const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('恢复聊天记录失败:', e);
    }
    return [{ id: 'welcome', role: 'assistant', content: getWelcomeMessage(currentIdentity), timestamp: new Date().toISOString() }];
  };

  const [messages, setMessages] = useState(() => getInitialMessages(getInitialIdentity()));
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 身份设定相关状态
  const [identity, setIdentity] = useState(getInitialIdentity);
  const [identityModalVisible, setIdentityModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // 缓存消息到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(messages.length - 100, messages.length)));
    } catch (e) {
      console.error('保存聊天记录失败:', e);
    }
  }, [messages]);

  // 保存身份设定到 localStorage
  useEffect(() => {
    try {
      console.log(identity,'identity');
      
      localStorage.setItem(AI_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch (e) {
      console.error('保存身份设定失败:', e);
    }
  }, [identity]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 打开身份设置弹窗
  const handleOpenIdentitySettings = () => {
    form.setFieldsValue(identity);
    setPreviewAvatar(identity.avatar);
    setIdentityModalVisible(true);
  };

  // 保存身份设定
  const handleSaveIdentity = () => {
    form.validateFields().then(values => {
      setIdentity(values);
      setIdentityModalVisible(false);
      message.success('身份设定已保存');
    });
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    const systemPrompt = generateSystemPrompt(identity);
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage.content }
    ];

    try {
      const response = await aiChat(chatMessages, controller.signal);

      if (!response.ok) throw new Error('请求失败');

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessage.id);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '' && line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            setLoading(false);
            setStreamingMessageId(null);
            setAbortController(null);
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || parsed.content;
            if (content) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content += content;
                }
                return newMessages;
              });
            }
            if (parsed.error) {
              message.error(parsed.error);
              setLoading(false);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
      } else {
        message.error('AI 响应失败，请稍后重试');
        console.error('AI Chat Error:', error);
      }
    } finally {
      setLoading(false);
      setStreamingMessageId(null);
      setAbortController(null);
      // 发送完成后保持输入框聚焦
      textareaRef.current?.focus();
    }
  };

  // 停止生成
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setStreamingMessageId(null);
      setAbortController(null);
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([{ id: 'welcome', role: 'assistant', content: getWelcomeMessage(identity), timestamp: new Date().toISOString() }]);
    localStorage.removeItem(AI_CHAT_STORAGE_KEY);
  };

  // 渲染消息内容：流式中显示纯文本，完成后用 marked 解析
  const renderContent = (content, role, msgId) => {
    if (role === 'assistant') {
      if (msgId === streamingMessageId) {
        return (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, wordBreak: 'break-word' }}>
            {content || <span style={{ color: '#999' }}>思考中...</span>}
          </div>
        );
      }
      try {
        const cleanHtml = DOMPurify.sanitize(marked.parse(content || ''), {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'a', 'img', 'span', 'div', 'hr'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
        });
        return (
          <div
            style={{ fontSize: '14px' }}
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      } catch (error) {
        console.error('Markdown 解析错误:', error);
        return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{content}</div>;
      }
    }
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card

        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', zIndex: 1000 }}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleOpenIdentitySettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#666',
              fontSize: 13,
              height: 32,
              padding: '10px 12px',
              borderRadius: 16,
              transition: 'all 0.2s',
              background: 'rgb(212 222 255)',
            }}
            className="hover-bg-gray"
          >
            设置身份
          </Button>
          <Popconfirm
            title="确认清空"
            description="确定要清空所有聊天记录吗？"
            onConfirm={handleClear}
            okText="确定"
            cancelText="取消"
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#666',
                fontSize: 13,
                height: 32,
                padding: '0 12px',
                borderRadius: 16,
                transition: 'all 0.2s',
                marginLeft: 10,
              }}
            >
              清空对话
            </Button>
          </Popconfirm>
        </div>
        {/* 消息列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar src={identity.avatar} style={{ marginRight: 8, width: '35px', height: '35px' }} />
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 16px',
                  borderRadius: '25px',
                  background: msg.role === 'user' ? '#1890ff' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word',
                }}
              >
                {msg.role === 'loading' ? (
                  <Spin size="small" />
                ) : (
                  renderContent(msg.content, msg.role, msg.id)
                )}
                {msg.role === 'assistant' && loading && msg.id === messages[messages.length - 1].id && (
                  <span style={{ color: '#999', fontSize: 12 }}>正在输入...</span>
                )}
              </div>
              {msg.role === 'user' && (
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a', marginLeft: 8 }} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 - DeepSeek 风格 */}
        <div style={{ padding: '16px 20px 20px', background: '#fff' }}>
          <div
            className="ai-chat-input-wrap"
            style={{
              borderRadius: 24,
              border: '1px solid #e5e5e5',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              padding: '14px 16px 12px',
              minHeight: 52,
            }}
          >
            <Input.TextArea
              ref={textareaRef}
              placeholder="给 AI 发送消息"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoSize={{ minRows: 1, maxRows: 6 }}
              bordered={false}
              style={{
                padding: 0,
                fontSize: 15,
                lineHeight: 1.5,
                resize: 'none',
              }}
              styles={{
                textarea: {
                  padding: 0,
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                },
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  color: '#8c8c8c',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 16,
                }}
                title="附件（暂未开放）"
              >
                <PaperClipOutlined />
              </span>
              {loading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  title="停止"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#ff7875',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  <StopOutlined />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  title="发送"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: inputValue.trim() ? '#b0c4ff' : '#e8e8e8',
                    color: inputValue.trim() ? '#fff' : '#bfbfbf',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  <ArrowUpOutlined style={{ fontWeight: 'bold' }} />
                </button>
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* 身份设置弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16
            }}>
              <RobotOutlined />
            </div>
            设置 AI 身份
          </div>
        }
        open={identityModalVisible}
        onOk={handleSaveIdentity}
        onCancel={() => setIdentityModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={480}
        destroyOnClose
        bodyStyle={{ padding: '24px 24px 16px' }}
        styles={{
          header: { padding: '20px 24px 0' },
          body: { padding: '24px 24px 16px' },
          footer: { padding: '16px 24px 20px', borderTop: '1px solid #f0f0f0' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={identity}
        >
          {/* 头像区域 */}
          {/* <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
            padding: '20px 0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
            borderRadius: 12,
            border: '1px solid #e8ecf0'
          }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Avatar
                src={previewAvatar}
                size={80}
                style={{
                  border: '3px solid #fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#f0f0f0'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                boxShadow: '0 2px 8px rgba(102,126,234,0.4)'
              }}>
                <CameraOutlined style={{ fontSize: 12 }} />
              </div>
            </div> */}

            {/* 头像操作按钮 */}
            {/* <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Upload
                name="avatar"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={(info) => {
                  const file = info.file.originFileObj || info.file;
                  if (file && file.path) {
                    const filePath = 'file:///' + file.path.replace(/\\/g, '/');
                    setPreviewAvatar(filePath);
                    form.setFieldsValue({ avatar: filePath });
                  } else if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setPreviewAvatar(e.target.result);
                      form.setFieldsValue({ avatar: e.target.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              >
                <Button size="small" icon={<UploadOutlined />} style={{ fontSize: 12, borderRadius: 6 }}>
                  上传图片
                </Button>
              </Upload>
              <Button
                size="small"
                icon={<LinkOutlined />}
                style={{ fontSize: 12, borderRadius: 6 }}
                onClick={() => {
                  const url = prompt('请输入图片URL地址：');
                  if (url && url.trim()) {
                    setPreviewAvatar(url.trim());
                    form.setFieldsValue({ avatar: url.trim() });
                  }
                }}
              >
                输入链接
              </Button>
              <Button
                size="small"
                icon={<SwapOutlined />}
                style={{ fontSize: 12, borderRadius: 6 }}
                onClick={() => {
                  setPreviewAvatar('/AiImage.jpg');
                  form.setFieldsValue({ avatar: '/AiImage.jpg' });
                }}
              >
                恢复默认
              </Button>
            </div>
          </div> */}

          {/* 基本信息卡片 */}
          <div style={{
            background: '#fafbfc',
            borderRadius: 12,
            padding: '16px 16px 8px',
            marginBottom: 16
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#667eea',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              基本信息
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
                style={{ flex: 1, marginBottom: 8 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="姓名"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="age"
                rules={[{ required: true, message: '请输入年龄' }]}
                style={{ width: 80, marginBottom: 8 }}
              >
                <Input
                  placeholder="年龄"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
                style={{ width: 90, marginBottom: 8 }}
              >
                <Select
                  placeholder="性别"
                  style={{ borderRadius: 8 }}
                >
                  <Select.Option value="男">男</Select.Option>
                  <Select.Option value="女">女</Select.Option>
                  <Select.Option value="保密">保密</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* 详细描述卡片 */}
          <div style={{
            background: '#fafbfc',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 16,
            display:'flex',
            flexDirection:'column',
            gap: 10,
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#667eea',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              详细描述
            </div>
            <Form.Item
              name="bio"
              rules={[{ required: true, message: '请输入简介' }]}
              style={{ marginBottom: 12 }}
            >
              <Input.TextArea
                placeholder="请输入AI助手的简介"
                rows={3}
                maxLength={200}
                showCount
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="personality"
              rules={[{ required: true, message: '请输入性格爱好' }]}
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                placeholder="请描述AI助手的性格特点和爱好"
                rows={3}
                maxLength={200}
                showCount
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
