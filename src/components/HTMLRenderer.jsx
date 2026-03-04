import React, { useEffect, useRef } from 'react';

const HTMLRenderer = ({ htmlString }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'BUTTON_CLICK') {
        console.log('iframe里点击了按钮', event.data.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!iframeRef.current || !htmlString) return;

    const iframe = iframeRef.current;
    
    // 等待 iframe 加载完成后写入内容
    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlString);
        doc.close();
      } catch (error) {
        console.error('iframe write error:', error);
      }
    };

    // 如果 iframe 已经加载完成，直接写入
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    } else {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [htmlString]);

  return (
    <iframe
      ref={iframeRef}
      title="html-renderer"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        border: 'none',
        backgroundColor: '#fff',
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

export default HTMLRenderer;
