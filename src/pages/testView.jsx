import React, { useEffect, useState, useRef } from 'react';
import { get } from '@/utils/request'
import HTMLRenderer from '@/components/HTMLRenderer';

const TestView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const containerRef = useRef(null);
    const [html, setHtml] = useState('');

    useEffect(() => {
        get('/get/file', {}, { responseType: 'text' }).then(res => {
            setHtml(res);
        }).catch(err => {
            console.error('请求失败:', err);
            setError('请求失败，请重试');
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>测试页面</h1>
            <p>这是一个测试页面，用于展示各种功能组件的开发和调试。</p>
            {typeof html}
            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd' }}>
                <h2>HTML 渲染测试</h2>
                {loading && <p>加载中...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && html && (
                    <HTMLRenderer htmlString={html} />
                )}
            </div>
        </div>
    );
}

export default TestView;