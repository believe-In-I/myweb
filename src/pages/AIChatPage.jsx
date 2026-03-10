import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Spin, Typography, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';

marked.use({ gfm: true });

const { Text } = Typography;

const apiBaseUrl = 'http://182.92.94.27:3001';

const AI_CHAT_STORAGE_KEY = 'ai_chat_messages';

const WELCOME_MESSAGE = '你好！我是 DeepSeek AI 助手，有什么可以帮助你的吗？（收费的，用了记得给我转帐，一条消息1块钱，概不赊账）';

export default function AIChatPage() {
  const getInitialMessages = () => {
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
    return [{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date().toISOString() }];
  };

  const [messages, setMessages] = useState(getInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);

  // 缓存消息到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('保存聊天记录失败:', e);
    }
  }, [messages]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    const chatMessages = [
      { role: 'system', content: '你是一个有帮助的AI助手，请用中文回答用户的问题。' },
      ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage.content }
    ];

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
        signal: controller.signal
      });

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
    setMessages([{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date().toISOString() }]);
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
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
            style={{ lineHeight: 1.7 }}
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
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI 智能助手</span>
          </Space>
        }
        extra={
          <Button icon={<DeleteOutlined />} onClick={handleClear} size="small">
            清空对话
          </Button>
        }
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' } }}
      >
        {/* 消息列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#f5f5f5' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 8 }} />
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? '#1890ff' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word'
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

        {/* 输入区域 */}
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入你想问的问题..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              disabled={loading}
              size="large"
            />
            {loading ? (
              <Button type="primary" icon={<StopOutlined />} onClick={handleStop} size="large" danger>
                停止
              </Button>
            ) : (
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} size="large" disabled={!inputValue.trim()}>
                发送
              </Button>
            )}
          </Space.Compact>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
            Powered by DeepSeek
          </Text>
        </div>
      </Card>
    </div>
  );
}
