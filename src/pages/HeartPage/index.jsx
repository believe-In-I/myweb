import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const HeartPage = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isHoveredRef = useRef(false);
  const [hearts, setHearts] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  );

  // 生成飘落的爱心
  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 5 + 5,
        color: `hsl(${Math.random() * 30 + 340}, 80%, 60%)`,
      };
      setHearts(prev => [...prev.slice(-15), newHeart]);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Three.js 3D 爱心背景
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth || 1;
    const height = containerRef.current.clientHeight || window.innerHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      // 限制移动端设备像素比以提升性能并避免崩溃
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      containerRef.current.appendChild(renderer.domElement);
    } catch (e) {
      console.error('WebGL 初始化失败:', e);
      return;
    }

    // 创建爱心形状
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const extrudeSettings = {
      depth: 0.8,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const heartMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff3366,
      metalness: 0.3,
      roughness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0xff1144,
      emissiveIntensity: 0.2,
    });

    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    heart.position.set(0, 0, 0);
    scene.add(heart);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 点光源
    const pointLight1 = new THREE.PointLight(0xff6699, 2, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x6699ff, 2, 10);
    pointLight2.position.set(-3, -3, 3);
    scene.add(pointLight2);

    // 粉色光环
    const ringGeometry = new THREE.RingGeometry(1.5, 1.6, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6699,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 动画
    let time = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.01;

      const currentIsHovered = isHoveredRef.current;

      // 呼吸效果 - 悬停时减弱
      const breathScale = currentIsHovered ? 1 : 1 + Math.sin(time * 2) * 0.05;
      heart.scale.set(breathScale, breathScale, breathScale);

      // 旋转 - 悬停时停止自动旋转，由 CSS 控制
      if (!currentIsHovered) {
        heart.rotation.y = Math.sin(time) * 0.3;
        heart.rotation.x = Math.cos(time * 0.5) * 0.1;
      }

      // 光环旋转
      ring.rotation.z += 0.005;
      ring.scale.set(1 + Math.sin(time * 2) * 0.1, 1 + Math.sin(time * 2) * 0.1, 1);

      // 光源移动
      pointLight1.position.x = Math.sin(time * 0.5) * 3;
      pointLight1.position.y = Math.cos(time * 0.5) * 3;
      pointLight2.position.x = Math.cos(time * 0.3) * 3;
      pointLight2.position.y = Math.sin(time * 0.3) * 3;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth || window.innerWidth || 1;
      const h = containerRef.current.clientHeight || window.innerHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (renderer && containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
        // 强制丢失上下文，防止移动端 WebGL 上下文泄漏导致白屏崩溃
        const gl = renderer.getContext();
        const ext = gl?.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
      heartGeometry.dispose();
      heartMaterial.dispose();
    };
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.05); }
          50% { transform: scale(1); }
          75% { transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 157, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 107, 157, 0.8), 0 0 60px rgba(255, 107, 157, 0.4); }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px #ff6b9d, 0 0 20px #ff6b9d; }
          50% { text-shadow: 0 0 20px #ff6b9d, 0 0 40px #ff6b9d, 0 0 60px #ff6b9d; }
        }

        .flip-card {
          perspective: 1000px;
          cursor: pointer;
        }

        .flip-card-inner {
          position: relative;
          width: 280px;
          height: 320px;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }

        .flip-card:hover .flip-card-inner,
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .flip-card-front {
          background: linear-gradient(145deg, rgba(255, 182, 193, 0.2), rgba(255, 105, 180, 0.3));
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 182, 193, 0.5);
        }

        .flip-card-back {
          background: linear-gradient(145deg, rgba(196, 69, 105, 0.9), rgba(255, 107, 157, 0.9));
          transform: rotateY(180deg);
          border: 2px solid rgba(255, 182, 193, 0.7);
        }

        .heart-svg {
          animation: heartbeat 1.5s ease-in-out infinite, float 3s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255, 107, 157, 0.8));
        }

        .hover-hint {
          position: absolute;
          bottom: 30px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          animation: float 2s ease-in-out infinite;
        }
      `}</style>

      {/* 角落装饰 */}
      <div style={styles.cornerDecorTopLeft} />
      <div style={styles.cornerDecorTopRight} />
      <div style={styles.cornerDecorBottomLeft} />
      <div style={styles.cornerDecorBottomRight} />

      {/* 背景粒子 */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            animation: `twinkle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 闪烁星星 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '4px',
            height: '4px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #fff, 0 0 20px #ff6b9d',
            animation: `twinkle ${Math.random() * 2 + 1}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 飘落的爱心 */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          style={{
            position: 'absolute',
            left: `${heart.left}%`,
            fontSize: `${heart.size}px`,
            color: heart.color,
            animation: `fall ${heart.duration}s linear forwards`,
            pointerEvents: 'none',
          }}
        >
          ❤
        </div>
      ))}

      {/* Three.js 3D 背景爱心 */}
      <div ref={containerRef} style={styles.threeContainer} />

      {/* 可交互的翻转爱心卡片 */}
      <div style={styles.flipCardWrapper}>
        <div
          className={`flip-card ${isFlipped ? 'flipped' : ''}`}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; }}
          onClick={() => {
            const nextFlipped = !isFlipped;
            setIsFlipped(nextFlipped);
            isHoveredRef.current = nextFlipped;
          }}
        >
          <div className="flip-card-inner">
            {/* 正面 - 爱心 */}
            <div className="flip-card-front">
              <svg
                className="heart-svg"
                width="150"
                height="150"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b9d" />
                    <stop offset="50%" stopColor="#ff3366" />
                    <stop offset="100%" stopColor="#c44569" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="url(#heartGradient)"
                  filter="url(#glow)"
                />
              </svg>
              <span style={styles.cardTitle}>Forever Love</span>
              <span className="hover-hint">hover me ❤</span>
            </div>

            {/* 背面 - 我喜欢你 */}
            <div className="flip-card-back">
              <div style={styles.backContent}>
                <span style={styles.backText}>我</span>
                <span style={styles.backText}>喜</span>
                <span style={styles.backText}>欢</span>
                <span style={styles.backText}>你</span>
              </div>
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginTop: '20px', animation: 'heartbeat 1s ease-in-out infinite' }}
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="rgba(255,255,255,0.9)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 底部文字 */}
      <div style={styles.content}>
        <p style={styles.subtitle}>✦ 愿爱与美好永远相伴 ✦</p>
      </div>

      {/* 底部装饰线 */}
      <div style={styles.bottomLine} />
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100dvh',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a1a 0%, #2d1f3d 50%, #1a0a1a 100%)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  flipCardWrapper: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '60px',
  },
  cardTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #ff6b9d, #fff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginTop: '20px',
    letterSpacing: '2px',
  },
  backContent: {
    display: 'flex',
    gap: '15px',
  },
  backText: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#fff',
    animation: 'textGlow 2s ease-in-out infinite',
    textShadow: '0 0 10px #ff6b9d, 0 0 20px #ff6b9d',
  },
  content: {
    position: 'absolute',
    bottom: '15%',
    textAlign: 'center',
    zIndex: 10,
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: '3px',
  },
  cornerDecorTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 150,
    height: 150,
    border: '2px solid rgba(255, 107, 157, 0.3)',
    borderRight: 'none',
    borderBottom: 'none',
    borderTopLeftRadius: '20px',
    pointerEvents: 'none',
    zIndex: 5,
  },
  cornerDecorTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 150,
    height: 150,
    border: '2px solid rgba(255, 107, 157, 0.3)',
    borderLeft: 'none',
    borderBottom: 'none',
    borderTopRightRadius: '20px',
    pointerEvents: 'none',
    zIndex: 5,
  },
  cornerDecorBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 150,
    height: 150,
    border: '2px solid rgba(255, 107, 157, 0.3)',
    borderRight: 'none',
    borderTop: 'none',
    borderBottomLeftRadius: '20px',
    pointerEvents: 'none',
    zIndex: 5,
  },
  cornerDecorBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 150,
    height: 150,
    border: '2px solid rgba(255, 107, 157, 0.3)',
    borderLeft: 'none',
    borderTop: 'none',
    borderBottomRightRadius: '20px',
    pointerEvents: 'none',
    zIndex: 5,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #ff6b9d, #c44569, #ff6b9d, transparent)',
    animation: 'shimmer 3s linear infinite',
    backgroundSize: '200% 100%',
  },
};

export default HeartPage;
