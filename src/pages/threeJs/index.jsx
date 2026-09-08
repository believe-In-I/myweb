import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import useResponsive from '@/hooks/useResponsive';

/**
 * Three.js 入门级 Demo
 * 功能：创建一个旋转的立方体，带有光源和轨道控制器
 * 学习要点：
 * - Three.js 核心概念（场景、相机、渲染器）
 * - 3D 对象创建与材质应用
 * - 光源设置
 * - 动画循环
 * - 轨道控制器使用
 */
const ThreeJsDemo = () => {
  // 引用 DOM 元素
  const containerRef = useRef(null);
  
  // Web Worker 相关状态
  const [galaxyLoading, setGalaxyLoading] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const galaxyPointsRef = useRef(null);
  const workerRef = useRef(null);
  
  // 响应式状态
  const { isMobile, isTablet } = useResponsive();
  
  // 存储 Three.js 相关对象
  let scene, camera, renderer, cube, controls, light;
  
  // 响应式配置
  const containerHeight = isMobile ? 350 : isTablet ? 450 : 600;
  const paddingSize = isMobile ? 12 : 20;
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 初始化 Three.js 场景
    initScene();
    
    // ========== Web Worker 初始化 ==========
    // Vite 支持通过 import.meta.url 加载 Worker，且 type: 'module' 允许使用 ES Module
    console.log('import.meta.url', import.meta.url)
    workerRef.current = new Worker(
      new URL('./geometryWorker.js', import.meta.url),
      { type: 'module' }
    );
    
    // 监听 Worker 返回的消息
    workerRef.current.onmessage = function (e) {
      const { type, payload } = e.data;
      if (type === 'galaxyResult') {
        addGalaxyToScene(payload);
        setGalaxyLoading(false);
      }
    };
    
    // 启动动画循环
    animate();
    
    // 清理函数
    return () => {
      // 终止 Worker（释放 Worker 线程资源）
      if (workerRef.current) workerRef.current.terminate();
      // 清理星系粒子
      if (galaxyPointsRef.current) {
        scene.remove(galaxyPointsRef.current);
        galaxyPointsRef.current.geometry.dispose();
        galaxyPointsRef.current.material.dispose();
      }
      if (controls) controls.dispose();
      if (renderer) renderer.dispose();
    };
  }, []);
  
  /**
   * 初始化 Three.js 场景
   */
  const initScene = () => {
    // 1. 创建场景
    scene = new THREE.Scene();
    // 设置场景背景颜色
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 2. 创建相机
    // 透视相机：参数分别为视野角度、宽高比、近裁剪面、远裁剪面
    camera = new THREE.PerspectiveCamera(
      75, // 视野角度
      containerRef.current.clientWidth / containerRef.current.clientHeight, // 宽高比
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    // 设置相机位置
    camera.position.z = 5;
    
    // 3. 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    // 设置渲染器尺寸
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    // 将渲染器的 DOM 元素添加到容器中
    containerRef.current.appendChild(renderer.domElement);
    
    // 4. 创建几何体和材质
    // 立方体几何体：参数分别为宽、高、深
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    // 材质：MeshPhongMaterial 支持光照反射
    const material = new THREE.MeshPhongMaterial({
      color: 0x0077ff, // 颜色
      shininess: 100, // 光泽度
      specular: 0x444444 // 高光颜色
    });
    
    // 5. 创建网格对象（几何体 + 材质）
    cube = new THREE.Mesh(geometry, material);
    // 将立方体添加到场景中
    scene.add(cube);
    
    // 6. 添加光源
    // 环境光：提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 平行光：模拟太阳光，产生阴影
    light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    // 7. 添加轨道控制器
    // 允许用户通过鼠标交互旋转、平移和缩放场景
    controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼效果，使交互更平滑
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 8. 响应窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // 更新相机宽高比
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      
      // 更新渲染器尺寸
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理函数：移除事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };
  
  /**
   * 动画循环
   */
  const animate = () => {
    // 请求下一帧动画
    requestAnimationFrame(animate);
    
    // 更新立方体旋转
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
    
    // 更新轨道控制器
    if (controls) controls.update();
    
    // 渲染场景
    renderer.render(scene, camera);
  };
  
  // ==================== Web Worker 相关函数 ====================
  
  /**
   * 将 Worker 计算出的粒子数据添加到 Three.js 场景
   * @param {{ positions: ArrayBuffer, colors: ArrayBuffer, count: number }} data
   */
  const addGalaxyToScene = (data) => {
    const { positions: posBuffer, colors: colBuffer, count } = data;
    
    // 移除旧星系（如果用户多次点击生成）
    if (galaxyPointsRef.current) {
      scene.remove(galaxyPointsRef.current);
      galaxyPointsRef.current.geometry.dispose();
      galaxyPointsRef.current.material.dispose();
    }
    
    // 从 ArrayBuffer 还原为 Float32Array
    const positions = new Float32Array(posBuffer);
    const colors = new Float32Array(colBuffer);
    
    // 创建 BufferGeometry 并填充属性
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 粒子材质（使用顶点颜色，每个粒子独立颜色）
    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    });
    
    // 创建粒子系统并添加到场景
    galaxyPointsRef.current = new THREE.Points(geometry, material);
    scene.add(galaxyPointsRef.current);
    
    setParticleCount(count);
  };
  
  /**
   * 点击按钮：通过 Web Worker 异步生成星系
   * - 主线程不会被阻塞，动画继续运行
   * - 计算完成后自动渲染到场景
   */
  const handleGenerateGalaxy = () => {
    if (galaxyLoading || !workerRef.current) return;
    setGalaxyLoading(true);
    setParticleCount(0);
    
    workerRef.current.postMessage({
      type: 'generateGalaxy',
      payload: { count: 50000, arms: 4, radius: 6 }
    });
  };
  
  return (
    <div style={{ padding: paddingSize }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? 12 : 20,
        fontSize: isMobile ? 18 : undefined
      }}>
      </h1>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: containerHeight,
          // border: '1px solid #ddd',
          // borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
      {/* Web Worker 控制按钮 */}
      <div style={{ 
        marginTop: isMobile ? 12 : 16, 
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* <button 
          onClick={handleGenerateGalaxy}
          disabled={galaxyLoading}
          style={{
            padding: '8px 20px',
            backgroundColor: galaxyLoading ? '#ccc' : '#0077ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: galaxyLoading ? 'not-allowed' : 'pointer',
            fontSize: isMobile ? 12 : 14
          }}
        >
          {galaxyLoading ? '⏳ 计算中...' : '✨ 生成螺旋星系'}
        </button>
        {particleCount > 0 && (
          <span style={{ fontSize: isMobile ? 12 : 14, color: '#666' }}>
            {particleCount.toLocaleString()} 个粒子（Worker 异步计算，不阻塞主线程）
          </span>
        )} */}
      </div>
    </div>
  );
};

export default ThreeJsDemo;