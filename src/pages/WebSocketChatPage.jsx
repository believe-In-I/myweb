import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Popover,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  SmileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FolderOpenOutlined,
  AudioOutlined,
  HistoryOutlined,
  UserOutlined,
  DownloadOutlined,
  SettingOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { ossUploadChat } from '@/api';

const { Text } = Typography;

/** 与 myweb-nodejs/routes/WebSocket.js 中 MessageType 一致 */
const MsgType = {
  TEXT: 'text',
  EMOJI: 'emoji',
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
  VOICE: 'voice',
  SYSTEM: 'system',
  USER_LIST: 'userList',
  HISTORY: 'history',
};

const WS_CHAT_USER_ID = 'ws_chat_userId';
const WS_CHAT_USERNAME = 'ws_chat_username';

function getWsBaseUrl() {
  const env = import.meta.env.VITE_WS_CHAT_URL;
  if (env) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'ws://localhost:3001/ws/chat';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//api.niumashuai.top/ws/chat`;
}

/** [微笑] 等形式映射为 Unicode，未命中则保留原文 */
const EMOJI_NAME_MAP = {
  微笑: '😊',
  大笑: '😂',
  开心: '😄',
  爱心: '❤️',
  点赞: '👍',
  大哭: '😭',
  汗颜: '😅',
  生气: '😠',
  疑问: '❓',
  再见: '👋',
  握手: '🤝',
  咖啡: '☕',
  玫瑰: '🌹',
  礼物: '🎁',
  蛋糕: '🎂',
  月亮: '🌙',
  太阳: '☀️',
  庆祝: '🎉',
  666: '6️⃣6️⃣6️⃣',
  棒: '👍',
  OK: '👌',
  加油: '💪',
  猪头: '🐷',
};

const EMOJI_QUICK_UNIQUE = ['微笑', '大笑', '爱心', '点赞', '大哭', '汗颜', '生气', '疑问', '再见', '握手', '咖啡', '玫瑰', '礼物', '蛋糕', '月亮', '太阳', '庆祝', '666', '棒', 'OK', '加油'];

function renderBracketText(text) {
  if (!text) return null;
  const parts = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t-${last}`}>{text.slice(last, m.index)}</span>);
    }
    const name = m[1];
    const char = EMOJI_NAME_MAP[name];
    parts.push(
      <span key={`e-${m.index}`} style={{ fontSize: 22, verticalAlign: 'middle' }} title={`[${name}]`}>
        {char || `[${name}]`}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={`t-end`}>{text.slice(last)}</span>);
  }
  return parts.length ? parts : text;
}

async function downloadByUrl(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('下载失败');
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename || 'download';
    a.click();
    URL.revokeObjectURL(href);
    message.success('已开始下载');
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
    message.info('已打开链接，若未下载请右键另存为');
  }
}

function tsToMs(t) {
  if (t == null) return 0;
  if (typeof t === 'number') return t;
  const n = Date.parse(t);
  return Number.isNaN(n) ? 0 : n;
}

function msgTime(m) {
  const t = m.payload?.timestamp ?? m.timestamp;
  if (!t) return '';
  const d = new Date(tsToMs(t));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export default function WebSocketChatPage() {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [previewImage, setPreviewImage] = useState({ open: false, url: '', name: '' });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(() => localStorage.getItem(WS_CHAT_USERNAME) || '');

  const wsRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordStartRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const userId = useMemo(() => {
    let id = localStorage.getItem(WS_CHAT_USER_ID);
    if (!id) {
      id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(WS_CHAT_USER_ID, id);
    }
    return id;
  }, []);

  const username = useMemo(() => localStorage.getItem(WS_CHAT_USERNAME) || '访客', []);

  const sendWs = useCallback((obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    } else {
      message.warning('未连接，请稍后重试');
    }
  }, []);

  const mergeSorted = useCallback((list) => {
    return [...list].sort((a, b) => {
      const ta = tsToMs(a.payload?.timestamp ?? a.timestamp);
      const tb = tsToMs(b.payload?.timestamp ?? b.timestamp);
      return ta - tb;
    });
  }, []);

  useEffect(() => {
    const name = encodeURIComponent(localStorage.getItem(WS_CHAT_USERNAME) || '访客');
    const uid = encodeURIComponent(userId);
    const url = `${getWsBaseUrl()}?userId=${uid}&username=${name}`;
    setConnecting(true);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
    };

    ws.onerror = () => {
      setConnecting(false);
      message.error('WebSocket 连接异常');
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const { type, payload, id, timestamp } = data;

        if (type === MsgType.HISTORY && payload?.messages) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const next = [...prev];
            payload.messages.forEach((m) => {
              if (m.id && !seen.has(m.id)) {
                seen.add(m.id);
                next.push(m);
              }
            });
            return mergeSorted(next);
          });
          return;
        }

        if (type === MsgType.USER_LIST) {
          setOnlineUsers(payload?.users || []);
          return;
        }

        if (
          type === MsgType.TEXT ||
          type === MsgType.EMOJI ||
          type === MsgType.IMAGE ||
          type === MsgType.VIDEO ||
          type === MsgType.FILE ||
          type === MsgType.VOICE ||
          type === MsgType.SYSTEM
        ) {
          setMessages((prev) => {
            if (id && prev.some((m) => m.id === id)) return prev;
            return mergeSorted([...prev, { id, type, payload, timestamp }]);
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [userId, mergeSorted]);

  const handleSendText = () => {
    const content = inputValue.trim();
    if (!content) return;
    sendWs({ type: MsgType.TEXT, payload: { content } });
    setInputValue('');
    textareaRef.current?.focus();
  };

  const insertEmojiBracket = (name) => {
    const insert = `[${name}]`;
    const ta =
      textareaRef.current?.resizableTextArea?.textArea ||
      textareaRef.current?.nativeElement ||
      textareaRef.current;
    if (ta && typeof ta.selectionStart === 'number') {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const v = inputValue;
      setInputValue(v.slice(0, start) + insert + v.slice(end));
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + insert.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setInputValue((v) => `${v}${insert}`);
    }
  };

  const sendEmojiOnly = (name) => {
    sendWs({
      type: MsgType.EMOJI,
      payload: { emojiId: `[${name}]`, emojiType: 'system', description: name },
    });
  };

  const uploadAndSend = async (file, kind, opts = {}) => {
    const { durationSeconds = 1 } = opts;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('key', `chat/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`);
      const res = await ossUploadChat(form);
      if (res.status !== 'success' || !res.data?.url) {
        throw new Error(res.message || '上传失败');
      }
      const { url, size, originalName, contentType } = res.data;
      if (kind === 'image') {
        sendWs({
          type: MsgType.IMAGE,
          payload: {
            url,
            thumbnail: url,
            originalName: originalName || file.name,
            width: 0,
            height: 0,
          },
        });
      } else if (kind === 'video') {
        sendWs({
          type: MsgType.VIDEO,
          payload: {
            url,
            thumbnail: '',
            duration: 0,
            originalName: originalName || file.name,
          },
        });
      } else if (kind === 'voice') {
        sendWs({
          type: MsgType.VOICE,
          payload: {
            url,
            duration: durationSeconds,
            format: file.type?.includes('webm') ? 'webm' : 'mpeg',
          },
        });
      } else {
        sendWs({
          type: MsgType.FILE,
          payload: {
            url,
            fileName: originalName || file.name,
            fileSize: size || file.size,
            fileType: contentType || file.type,
            originalName: originalName || file.name,
          },
        });
      }
      message.success('已发送');
    } catch (e) {
      message.error(e.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const startRecord = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined });
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) recordChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const durationSec = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        const f = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        if (f.size < 1) {
          message.warning('录音过短');
          return;
        }
        uploadAndSend(f, 'voice', { durationSeconds: durationSec });
      };
      mediaRecorderRef.current = rec;
      recordStartRef.current = Date.now();
      rec.start(200);
      setRecording(true);
      message.info('正在录音，再次点击麦克风结束并发送');
    } catch {
      message.error('无法访问麦克风');
    }
  };

  const stopRecord = () => {
    if (!recording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    mediaRecorderRef.current = null;
  };

  const toggleRecord = () => {
    if (recording) stopRecord();
    else startRecord();
  };

  const linkColor = (self) => (self ? 'rgba(255,255,255,0.92)' : undefined);

  const renderPayload = (m, selfBubble = false) => {
    const { type, payload } = m;

    if (type === MsgType.SYSTEM) {
      return (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {payload?.content}
        </Text>
      );
    }

    if (type === MsgType.TEXT) {
      return (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left' }}>
          {renderBracketText(payload?.content)}
        </div>
      );
    }

    if (type === MsgType.EMOJI) {
      const id = payload?.emojiId || '';
      const inner = id.replace(/^\[|\]$/g, '');
      const char = EMOJI_NAME_MAP[inner] || id || '🙂';
      return (
        <span style={{ fontSize: 40, lineHeight: 1 }} title={payload?.description || inner}>
          {char}
        </span>
      );
    }

    if (type === MsgType.IMAGE) {
      const url = payload?.thumbnail || payload?.url;
      return (
        <div>
          <img
            src={url}
            alt={payload?.originalName}
            style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, cursor: 'pointer', display: 'block' }}
            onClick={() => setPreviewImage({ open: true, url: payload?.url, name: payload?.originalName || 'image' })}
          />
          <Button
            type="link"
            size="small"
            style={{ color: linkColor(selfBubble), paddingLeft: 0 }}
            icon={<DownloadOutlined />}
            onClick={() => downloadByUrl(payload?.url, payload?.originalName || 'image.jpg')}
          >
            下载
          </Button>
        </div>
      );
    }

    if (type === MsgType.VIDEO) {
      return (
        <div>
          <video src={payload?.url} controls style={{ maxWidth: 280, maxHeight: 200, borderRadius: 8, display: 'block' }} />
          <Button
            type="link"
            size="small"
            style={{ color: linkColor(selfBubble), paddingLeft: 0 }}
            icon={<DownloadOutlined />}
            onClick={() => downloadByUrl(payload?.url, payload?.originalName || 'video.mp4')}
          >
            下载视频
          </Button>
        </div>
      );
    }

    if (type === MsgType.FILE) {
      return (
        <Space direction="vertical" size={4} style={{ alignItems: 'flex-start' }}>
          <Text ellipsis style={{ maxWidth: 240, color: selfBubble ? '#fff' : undefined }}>
            📎 {payload?.originalName || payload?.fileName}
          </Text>
          <Button
            type="primary"
            size="small"
            ghost
            style={selfBubble ? { color: '#fff', borderColor: 'rgba(255,255,255,0.85)', background: 'transparent' } : undefined}
            icon={<DownloadOutlined />}
            onClick={() => downloadByUrl(payload?.url, payload?.originalName || payload?.fileName)}
          >
            下载文件
          </Button>
        </Space>
      );
    }

    if (type === MsgType.VOICE) {
      return (
        <audio
          src={payload?.url}
          controls
          style={{ width: 220, height: 36, verticalAlign: 'middle' }}
        />
      );
    }

    return <Text type="secondary">未知消息</Text>;
  };

  const saveUsername = () => {
    const n = (tempUsername || '').trim() || '访客';
    localStorage.setItem(WS_CHAT_USERNAME, n);
    message.success('已保存，请刷新页面以使用新昵称连接');
    setSettingsOpen(false);
  };

  const emojiPanel = (
    <div style={{ width: 280, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {EMOJI_QUICK_UNIQUE.map((name) => (
        <button
          key={name}
          type="button"
          title={name}
          onClick={() => insertEmojiBracket(name)}
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 6,
            cursor: 'pointer',
            background: '#fff',
            fontSize: 20,
          }}
        >
          {EMOJI_NAME_MAP[name] || name}
        </button>
      ))}
      <div style={{ gridColumn: '1 / -1', marginTop: 8, fontSize: 12, color: '#999' }}>
        点击插入 [表情名]；也可直接发送纯表情：
        <Button type="link" size="small" onClick={() => sendEmojiOnly('微笑')}>
          发「微笑」
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
      <Card
        size="small"
        title={
          <Space>
            <span>实时聊天</span>
            <Badge status={connected ? 'success' : 'default'} text={connecting ? '连接中…' : connected ? '已连接' : '未连接'} />
            <Button type="text" icon={<TeamOutlined />} size="small">
              在线 {onlineUsers.length} 人
            </Button>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
              聊天记录
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
              昵称
            </Button>
          </Space>
        }
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' } }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f7f8fa' }}>
          {uploading && (
            <div style={{ textAlign: 'center', padding: 8 }}>
              <Spin size="small" /> 上传中…
            </div>
          )}
          {messages.map((m) => {
            const p = m.payload || {};
            const isSystem = m.type === MsgType.SYSTEM;
            const isSelf = p.userId === userId && !isSystem;
            if (isSystem) {
              return (
                <div key={m.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                  {renderPayload(m, false)}
                  <div style={{ fontSize: 11, color: '#bbb' }}>{msgTime(m)}</div>
                </div>
              );
            }
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isSelf ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                {!isSelf && <Avatar icon={<UserOutlined />} src={p.avatar} style={{ backgroundColor: '#1890ff' }} />}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isSelf ? '#1890ff' : '#fff',
                    color: isSelf ? '#fff' : '#333',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  {!isSelf && (
                    <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
                      {p.username || '用户'}
                    </div>
                  )}
                  <div style={{ color: isSelf ? '#fff' : undefined }}>{renderPayload(m, isSelf)}</div>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>{msgTime(m)}</div>
                </div>
                {isSelf && <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px 20px', background: '#fff' }}>
          <div
            className="ws-chat-input-wrap"
            style={{
              borderRadius: 24,
              border: '1px solid #e5e5e5',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '14px 16px 12px',
              minHeight: 52,
            }}
          >
            <Input.TextArea
              ref={textareaRef}
              placeholder="发送文字，表情可用 [微笑] 形式…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              autoSize={{ minRows: 1, maxRows: 6 }}
              bordered={false}
              disabled={!connected}
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
                gap: 4,
                marginTop: 4,
              }}
            >
              <Popover content={emojiPanel} title="表情（插入 [名称]）" trigger="click">
                <Button type="text" icon={<SmileOutlined style={{ fontSize: 16 }} />} />
              </Popover>
              <Button type="text" icon={<PictureOutlined style={{ fontSize: 16 }} />} onClick={() => imageInputRef.current?.click()} />
              <Button type="text" icon={<VideoCameraOutlined style={{ fontSize: 16 }} />} onClick={() => videoInputRef.current?.click()} />
              <Button type="text" icon={<FolderOpenOutlined style={{ fontSize: 16 }} />} onClick={() => fileInputRef.current?.click()} />
              <Button
                type="text"
                danger={recording}
                icon={<AudioOutlined style={{ fontSize: 16 }} />}
                onClick={toggleRecord}
                title={recording ? '结束录音并发送' : '点击开始录音'}
              />
              <Button type="text" icon={<HistoryOutlined style={{ fontSize: 16 }} />} onClick={() => setHistoryOpen(true)} />
              <button
                type="button"
                onClick={handleSendText}
                disabled={!connected || !inputValue.trim()}
                title="发送"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: connected && inputValue.trim() ? '#b0c4ff' : '#e8e8e8',
                  color: connected && inputValue.trim() ? '#fff' : '#bfbfbf',
                  cursor: connected && inputValue.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <ArrowUpOutlined style={{ fontWeight: 'bold' }} />
              </button>
            </div>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) uploadAndSend(f, 'image');
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) uploadAndSend(f, 'video');
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) uploadAndSend(f, 'file');
            }}
          />
        </div>
      </Card>

      <Modal
        open={previewImage.open}
        title={previewImage.name}
        footer={[
          <Button key="dl" icon={<DownloadOutlined />} type="primary" onClick={() => downloadByUrl(previewImage.url, previewImage.name)}>
            下载
          </Button>,
          <Button key="c" onClick={() => setPreviewImage({ open: false, url: '', name: '' })}>
            关闭
          </Button>,
        ]}
        onCancel={() => setPreviewImage({ open: false, url: '', name: '' })}
        width={720}
        centered
      >
        <img src={previewImage.url} alt="" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
      </Modal>

      <Drawer title="聊天记录" placement="right" width={400} open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <div style={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {messages
            .filter((m) => m.type !== MsgType.USER_LIST)
            .map((m) => (
              <div key={m.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {msgTime(m)} · {m.type}
                  {m.payload?.username ? ` · ${m.payload.username}` : ''}
                </Text>
                <div style={{ marginTop: 6 }}>{renderPayload(m, false)}</div>
              </div>
            ))}
        </div>
      </Drawer>

      <Modal title="设置昵称" open={settingsOpen} onOk={saveUsername} onCancel={() => setSettingsOpen(false)} okText="保存">
        <p style={{ color: '#888', fontSize: 13 }}>修改后需刷新页面，才会用新昵称重新连接 WebSocket。</p>
        <Input placeholder="昵称" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} maxLength={32} />
      </Modal>
    </div>
  );
}
