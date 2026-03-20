import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Spin, Typography, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, StopOutlined, PaperClipOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';
import { aiChat } from '@/api';

marked.use({ gfm: true });

const { Text } = Typography;

const AI_CHAT_STORAGE_KEY = 'ai_chat_messages';

const WELCOME_MESSAGE = '你好！我是雀灵助手，有什么可以帮助你的吗？我是收费的，问问题记得给我转帐，一条消息1块钱，概不赊账';

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
  const textareaRef = useRef(null);
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

        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' } }}
      >
        <Button icon={<DeleteOutlined />} onClick={handleClear} size="small" style={{ position: 'absolute', top: 0, right: 0, padding: '15px', borderRadius: '15px' }}>
          清空对话
        </Button>
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
                <Avatar src='/AiImage.jpg' style={{ marginRight: 8, width: '50px', height: '50px' }} />
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 16px',
                  borderRadius: '25px',
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
    </div>
  );
}
