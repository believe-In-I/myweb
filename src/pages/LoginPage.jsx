import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import './LoginPage.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Mouse move handler for interactive effects
  const handleMouseMove = (e) => {
    setMousePosition({
      x: (window.innerWidth / 2 - e.clientX) / 50,
      y: (window.innerHeight / 2 - e.clientY) / 50,
    });
  };

  // Three.js particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connecting lines
      particles.forEach((particle, index) => {
        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0, 200, 255, ${0.15 * (1 - distance / 150)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        });
      });

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * 3
        );
        gradient.addColorStop(0, particle.color.replace('70%', '50%'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = particle.alpha * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createParticles();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const onFinish = (values) => {
    setLoading(true);

    setTimeout(() => {
      const result = login(values.username, values.password);

      if (result.success) {
        message.success('登录成功');
        navigate('/home/apiTest');
      } else {
        message.error(result.message);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container" onMouseMove={handleMouseMove}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* Floating shapes */}
      <div className="floating-shape shape-1" style={{
        transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)`
      }} />
      <div className="floating-shape shape-2" style={{
        transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px)`
      }} />
      <div className="floating-shape shape-3" style={{
        transform: `translate(${mousePosition.x * -1.5}px, ${mousePosition.y * -1.5}px)`
      }} />

      {/* Gradient overlay */}
      <div className="gradient-overlay" />

      {/* Main login card */}
      <div className="login-card-wrapper" style={{
        transform: `perspective(1000px) rotateY(${mousePosition.x * 0.05}deg) rotateX(${mousePosition.y * 0.05}deg)`
      }}>
        <div className="login-card-glow" />
        <Card className="login-card">
          {/* Animated logo/title */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-ring" />
              <div className="logo-ring delay-1" />
              <div className="logo-ring delay-2" />
              <div className="logo-core">
                <span>🚀</span>
              </div>
            </div>
            <h1 className="login-title">
              <span className="title-text">欢迎回来</span>
              <span className="title-glow">Welcome</span>
            </h1>
            <p className="login-subtitle">探索无限可能的科技世界</p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="用户名"
                className="glow-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="密码"
                className="glow-input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                <span className="button-text">{loading ? '登录中...' : '立即登录'}</span>
                <span className="button-glow" />
                <span className="button-shine" />
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            {/* <p className="hint">账号: niumashuai | 密码: 123456</p> */}
          </div>
        </Card>
      </div>

      {/* Bottom decorative elements */}
      <div className="bottom-glow" />
    </div>
  );
};

export default LoginPage;
