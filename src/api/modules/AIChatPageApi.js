// AI Chat 接口（使用 fetch 因为需要流式响应）
export const aiChat = async (messages, signal) => {
  const response = await fetch(`https://api.niumashuai.top/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal
  });

  if (!response.ok) {
    throw new Error('请求失败');
  }

  return response;
};
